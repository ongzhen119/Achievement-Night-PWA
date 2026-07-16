// Supabase access layer for playmat rooms, seats, and the event log.

import { getSupabaseClient } from "../supabase";
import {
  PlaymatEventRecord,
  PlaymatEventType,
  PlaymatFormat,
  PlaymatPlayerRecord,
  PlaymatRoomRecord,
  PlaymatRoomStatus
} from "./types";

// A 1v1 game: a room seats at most two players.
export const MAX_ROOM_PLAYERS = 2;

export interface SeatSpec {
  communityPlayerId: string;
  name: string;
  warbandId: string;
  format: PlaymatFormat;
  deckId: string;
}

// No ambiguous characters (0/O, 1/I) so codes are easy to read out at a table.
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode() {
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }

  return code;
}

export async function createPlaymatRoom(seat: SeatSpec) {
  const client = getSupabaseClient();

  let room: PlaymatRoomRecord | null = null;
  for (let attempt = 0; attempt < 6 && !room; attempt += 1) {
    const { data, error } = await client
      .from("playmat_rooms")
      .insert({ code: generateRoomCode() })
      .select()
      .single();

    if (!error) {
      room = data as PlaymatRoomRecord;
    } else if (error.code !== "23505") {
      throw new Error("playmat.error.createRoom");
    }
  }

  if (!room) {
    throw new Error("playmat.error.createRoom");
  }

  const player = await insertPlayer(room.id, seat, true);
  return { room, player };
}

export async function joinPlaymatRoom(code: string, seat: SeatSpec) {
  const room = await fetchRoomByCode(code);
  if (!room) {
    throw new Error("playmat.error.roomNotFound");
  }

  if (room.status === "ended") {
    throw new Error("playmat.error.roomEnded");
  }

  // Enforce the 1v1 seat cap. Realtime keeps this current; a rare race just
  // means the second insert wins and a late third caller is rejected here.
  const existing = await fetchRoomPlayers(room.id);
  if (existing.length >= MAX_ROOM_PLAYERS) {
    throw new Error("playmat.error.roomFull");
  }

  const player = await insertPlayer(room.id, seat, false);
  return { room, player };
}

async function insertPlayer(
  roomId: string,
  seat: SeatSpec,
  isHost: boolean
): Promise<PlaymatPlayerRecord> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("playmat_players")
    .insert({
      room_id: roomId,
      name: seat.name.trim(),
      community_player_id: seat.communityPlayerId,
      warband_id: seat.warbandId,
      format: seat.format,
      deck_id: seat.deckId,
      is_host: isHost
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("playmat.error.joinRoom");
  }

  return data as PlaymatPlayerRecord;
}

export async function fetchRoomByCode(code: string): Promise<PlaymatRoomRecord | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("playmat_rooms")
    .select()
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (error) {
    throw new Error("playmat.error.loadRoom");
  }

  return (data as PlaymatRoomRecord | null) ?? null;
}

export async function fetchRoomPlayers(roomId: string): Promise<PlaymatPlayerRecord[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("playmat_players")
    .select()
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("playmat.error.loadRoom");
  }

  return (data as PlaymatPlayerRecord[]) ?? [];
}

export async function fetchRoomEvents(
  roomId: string,
  afterId = 0
): Promise<PlaymatEventRecord[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("playmat_events")
    .select()
    .eq("room_id", roomId)
    .gt("id", afterId)
    .order("id", { ascending: true });

  if (error) {
    throw new Error("playmat.error.loadRoom");
  }

  return (data as PlaymatEventRecord[]) ?? [];
}

export async function appendPlaymatEvent(
  roomId: string,
  playerId: string | null,
  type: PlaymatEventType,
  payload: Record<string, unknown> = {}
): Promise<PlaymatEventRecord> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("playmat_events")
    .insert({ room_id: roomId, player_id: playerId, type, payload })
    .select()
    .single();

  if (error || !data) {
    throw new Error("playmat.error.action");
  }

  return data as PlaymatEventRecord;
}

export async function updatePlayerSeat(
  playerId: string,
  seat: Pick<SeatSpec, "warbandId" | "format" | "deckId">
) {
  const client = getSupabaseClient();
  const { error } = await client
    .from("playmat_players")
    .update({ warband_id: seat.warbandId, format: seat.format, deck_id: seat.deckId })
    .eq("id", playerId);

  if (error) {
    throw new Error("playmat.error.action");
  }
}

export async function setRoomStatus(roomId: string, status: PlaymatRoomStatus) {
  const client = getSupabaseClient();
  const { error } = await client
    .from("playmat_rooms")
    .update({ status })
    .eq("id", roomId);

  if (error) {
    throw new Error("playmat.error.action");
  }
}

export interface RoomSubscriptionHandlers {
  onEventInsert: (event: PlaymatEventRecord) => void;
  onPlayersChange: () => void;
  onRoomChange: (room: PlaymatRoomRecord) => void;
  /** Called when realtime (re)connects; used to catch up on missed events. */
  onSubscribed: () => void;
}

export function subscribeToPlaymatRoom(
  roomId: string,
  handlers: RoomSubscriptionHandlers
) {
  const client = getSupabaseClient();
  const channel = client
    .channel(`playmat-room-${roomId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "playmat_events", filter: `room_id=eq.${roomId}` },
      (message) => handlers.onEventInsert(message.new as PlaymatEventRecord)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "playmat_players", filter: `room_id=eq.${roomId}` },
      () => handlers.onPlayersChange()
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "playmat_rooms", filter: `id=eq.${roomId}` },
      (message) => handlers.onRoomChange(message.new as PlaymatRoomRecord)
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        handlers.onSubscribed();
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}
