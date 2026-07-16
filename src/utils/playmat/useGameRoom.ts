// React hook that connects one device to a playmat room:
// load room + seat + event log, replay events into game state, subscribe to
// realtime inserts, and catch up after any reconnect or missed message.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured } from "../supabase";
import {
  applyPlaymatEvent,
  buildPlaymatState,
  clonePlaymatState
} from "./engine";
import {
  appendPlaymatEvent,
  fetchRoomByCode,
  fetchRoomEvents,
  fetchRoomPlayers,
  joinPlaymatRoom,
  SeatSpec,
  setRoomStatus,
  subscribeToPlaymatRoom,
  updatePlayerSeat
} from "./rooms";
import {
  clearPlaymatSession,
  getPlaymatSession,
  setPlaymatSession
} from "./session";
import {
  createInitialGameState,
  PlaymatEventRecord,
  PlaymatEventType,
  PlaymatGameState,
  PlaymatPlayerRecord,
  PlaymatRoomRecord
} from "./types";

export type GameRoomStatus =
  | "loading"
  | "notFound"
  | "needsSeat"
  | "ready"
  | "error";

export function useGameRoom(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const [status, setStatus] = useState<GameRoomStatus>("loading");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [actionErrorKey, setActionErrorKey] = useState<string | null>(null);
  const [room, setRoom] = useState<PlaymatRoomRecord | null>(null);
  const [players, setPlayers] = useState<PlaymatPlayerRecord[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<PlaymatGameState>(createInitialGameState);
  const [events, setEvents] = useState<PlaymatEventRecord[]>([]);

  const roomRef = useRef<PlaymatRoomRecord | null>(null);
  const lastEventIdRef = useRef(0);
  const catchingUpRef = useRef(false);

  const recordEvents = useCallback((incoming: PlaymatEventRecord[]) => {
    if (!incoming.length) {
      return;
    }

    setEvents((previous) => {
      const known = new Set(previous.map((event) => event.id));
      const fresh = incoming.filter((event) => !known.has(event.id));
      if (!fresh.length) {
        return previous;
      }

      return [...previous, ...fresh].sort((a, b) => a.id - b.id);
    });
  }, []);

  /** Rebuilds everything from the database — the recovery hammer. */
  const rebuildFromServer = useCallback(async (roomId: string) => {
    const allEvents = await fetchRoomEvents(roomId, 0);
    const rebuilt = buildPlaymatState(allEvents);
    lastEventIdRef.current = rebuilt.lastEventId;
    setEvents(allEvents);
    setGameState(rebuilt);
  }, []);

  const applyIncomingEvent = useCallback(
    (event: PlaymatEventRecord) => {
      if (event.id <= lastEventIdRef.current) {
        return; // already applied (optimistic insert + realtime echo)
      }

      lastEventIdRef.current = event.id;
      recordEvents([event]);
      setGameState((previous) => {
        const next = clonePlaymatState(previous);
        applyPlaymatEvent(next, event);
        return next;
      });
    },
    [recordEvents]
  );

  /** Fetches anything newer than the last applied event and applies it. */
  const catchUp = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom || catchingUpRef.current) {
      return;
    }

    catchingUpRef.current = true;
    try {
      const fresh = await fetchRoomEvents(currentRoom.id, lastEventIdRef.current);
      for (const event of fresh) {
        applyIncomingEvent(event);
      }
    } catch {
      // transient network issue; the next reconnect/focus retries
    } finally {
      catchingUpRef.current = false;
    }
  }, [applyIncomingEvent]);

  const refreshPlayers = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom) {
      return;
    }

    try {
      setPlayers(await fetchRoomPlayers(currentRoom.id));
    } catch {
      // transient; realtime will trigger another refresh
    }
  }, []);

  // Initial load + realtime subscription.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("error");
      setErrorKey("status.supabaseMissing");
      return;
    }

    if (!/^[A-Z0-9]{4}$/.test(normalizedCode)) {
      setStatus("notFound");
      return;
    }

    let disposed = false;
    let unsubscribe: (() => void) | null = null;

    const initialise = async () => {
      try {
        const loadedRoom = await fetchRoomByCode(normalizedCode);
        if (disposed) {
          return;
        }

        if (!loadedRoom) {
          setStatus("notFound");
          return;
        }

        roomRef.current = loadedRoom;
        setRoom(loadedRoom);

        const loadedPlayers = await fetchRoomPlayers(loadedRoom.id);
        if (disposed) {
          return;
        }

        setPlayers(loadedPlayers);

        const session = getPlaymatSession(normalizedCode);
        const mySeat = session
          ? loadedPlayers.find(
              (player) => player.id === session.playerId && player.token === session.token
            )
          : null;

        await rebuildFromServer(loadedRoom.id);
        if (disposed) {
          return;
        }

        setMyPlayerId(mySeat?.id ?? null);
        setStatus(mySeat ? "ready" : "needsSeat");

        unsubscribe = subscribeToPlaymatRoom(loadedRoom.id, {
          onEventInsert: applyIncomingEvent,
          onPlayersChange: () => void refreshPlayers(),
          onRoomChange: (updated) => {
            roomRef.current = updated;
            setRoom(updated);
          },
          onSubscribed: () => {
            void catchUp();
            void refreshPlayers();
          }
        });
      } catch (error) {
        if (!disposed) {
          setStatus("error");
          setErrorKey(error instanceof Error ? error.message : "playmat.error.loadRoom");
        }
      }
    };

    void initialise();

    const handleWake = () => {
      if (document.visibilityState === "visible") {
        void catchUp();
        void refreshPlayers();
      }
    };

    document.addEventListener("visibilitychange", handleWake);
    window.addEventListener("focus", handleWake);

    return () => {
      disposed = true;
      unsubscribe?.();
      document.removeEventListener("visibilitychange", handleWake);
      window.removeEventListener("focus", handleWake);
    };
  }, [normalizedCode, applyIncomingEvent, catchUp, rebuildFromServer, refreshPlayers]);

  const joinAsNewPlayer = useCallback(
    async (seat: SeatSpec) => {
      setActionErrorKey(null);
      try {
        const { room: joinedRoom, player } = await joinPlaymatRoom(normalizedCode, seat);
        setPlaymatSession(normalizedCode, {
          playerId: player.id,
          token: player.token,
          name: player.name
        });
        roomRef.current = joinedRoom;
        setRoom(joinedRoom);
        setMyPlayerId(player.id);
        setStatus("ready");
        await refreshPlayers();
      } catch (error) {
        setActionErrorKey(error instanceof Error ? error.message : "playmat.error.joinRoom");
      }
    },
    [normalizedCode, refreshPlayers]
  );

  const sendEvent = useCallback(
    async (type: PlaymatEventType, payload: Record<string, unknown> = {}) => {
      const currentRoom = roomRef.current;
      if (!currentRoom || !myPlayerId) {
        return;
      }

      setActionErrorKey(null);
      try {
        const inserted = await appendPlaymatEvent(currentRoom.id, myPlayerId, type, payload);
        applyIncomingEvent(inserted);
      } catch (error) {
        setActionErrorKey(error instanceof Error ? error.message : "playmat.error.action");
        // The insert may have been lost mid-flight; resync to be safe.
        void catchUp();
      }
    },
    [myPlayerId, applyIncomingEvent, catchUp]
  );

  const updateSeat = useCallback(
    async (seat: Pick<SeatSpec, "warbandId" | "format" | "deckId">) => {
      if (!myPlayerId) {
        return;
      }

      setActionErrorKey(null);
      try {
        await updatePlayerSeat(myPlayerId, seat);
        await refreshPlayers();
      } catch (error) {
        setActionErrorKey(error instanceof Error ? error.message : "playmat.error.action");
      }
    },
    [myPlayerId, refreshPlayers]
  );

  const startGame = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom) {
      return;
    }

    setActionErrorKey(null);
    try {
      await setRoomStatus(currentRoom.id, "active");
      roomRef.current = { ...currentRoom, status: "active" };
      setRoom(roomRef.current);
    } catch (error) {
      setActionErrorKey(error instanceof Error ? error.message : "playmat.error.action");
    }
  }, []);

  const endRoom = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom) {
      return;
    }

    try {
      await setRoomStatus(currentRoom.id, "ended");
    } catch {
      // even if this fails the local exit continues
    }
  }, []);

  const leaveSeat = useCallback(() => {
    clearPlaymatSession(normalizedCode);
    setMyPlayerId(null);
    setStatus("needsSeat");
  }, [normalizedCode]);

  const myPlayer = useMemo(
    () => players.find((player) => player.id === myPlayerId) ?? null,
    [players, myPlayerId]
  );

  return {
    status,
    errorKey,
    actionErrorKey,
    clearActionError: () => setActionErrorKey(null),
    room,
    players,
    myPlayer,
    gameState,
    events,
    joinAsNewPlayer,
    sendEvent,
    updateSeat,
    startGame,
    endRoom,
    leaveSeat
  };
}
