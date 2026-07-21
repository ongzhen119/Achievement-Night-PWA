import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Copy,
  Crown,
  Home,
  LogOut,
  Menu as MenuIcon,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Trophy
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CardActionModal, { CardAction } from "../components/playmat/CardActionModal";
import CardTile from "../components/playmat/CardTile";
import EventLogPanel from "../components/playmat/EventLogPanel";
import FighterTile from "../components/playmat/FighterTile";
import OpponentArea from "../components/playmat/OpponentArea";
import PileViewerModal from "../components/playmat/PileViewerModal";
import PlaymatModal from "../components/playmat/PlaymatModal";
import SeatSetup from "../components/playmat/SeatSetup";
import { getCatalogCard, deckCardUids } from "../data/playmat/catalog";
import {
  getRivalsDeck,
  OPENING_OBJECTIVE_HAND,
  OPENING_POWER_HAND,
  STANDARD_ROUNDS
} from "../data/playmat/rivalsDecks";
import { getFighter, getWarband } from "../data/playmat/warbands";
import { useLanguage } from "../i18n/useLanguage";
import { formatText } from "../utils/format";
import { shuffleCards } from "../utils/playmat/engine";
import { fetchCustomDeck } from "../utils/playmat/customDecks";
import { SeatSpec } from "../utils/playmat/rooms";
import {
  PlaymatCardZone,
  PlaymatDeckKind,
  PlaymatPlayerRecord,
  PlaymatPlayerState
} from "../utils/playmat/types";
import { useGameRoom } from "../utils/playmat/useGameRoom";

type ModalState =
  | { kind: "card"; ownerId: string; zone: PlaymatCardZone; cardId: string }
  | { kind: "pile"; ownerId: string; zone: PlaymatCardZone }
  | { kind: "fighter"; ownerId: string; fighterId: string }
  | { kind: "attach"; cardId: string }
  | { kind: "deckMenu"; deck: PlaymatDeckKind }
  | { kind: "log" }
  | { kind: "menu" }
  | null;

const ZONE_TITLE_KEYS: Record<PlaymatCardZone, string> = {
  powerDeck: "playmat.zone.powerDeck",
  hand: "playmat.zone.hand",
  played: "playmat.zone.played",
  discard: "playmat.zone.discard",
  objectiveDeck: "playmat.zone.objectiveDeck",
  objectiveHand: "playmat.zone.objectiveHand",
  scored: "playmat.zone.scored",
  objectiveDiscard: "playmat.zone.objectiveDiscard"
};

function deckLabel(player: PlaymatPlayerRecord, nemesisLabel: string) {
  if (player.format === "nemesis") {
    return nemesisLabel;
  }

  return getRivalsDeck(player.deck_id)?.name ?? "";
}

export default function PlaymatRoomPage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    status,
    errorKey,
    actionErrorKey,
    room,
    players,
    myPlayer,
    gameState,
    events,
    joinAsNewPlayer,
    sendEvent,
    startGame,
    endRoom,
    leaveSeat
  } = useGameRoom(code);

  const [modal, setModal] = useState<ModalState>(null);
  const [handTab, setHandTab] = useState<"power" | "objective">("power");
  const [seat, setSeat] = useState<SeatSpec | null>(null);
  const [copied, setCopied] = useState(false);
  const setupSentRef = useRef(false);

  const myState: PlaymatPlayerState | null = myPlayer
    ? gameState.players[myPlayer.id] ?? null
    : null;
  const myWarband = getWarband(myPlayer?.warband_id);

  // Deal ourselves in once the host starts the game.
  useEffect(() => {
    if (
      room?.status !== "active" ||
      !myPlayer?.warband_id ||
      !myPlayer?.deck_id ||
      myState?.initialized ||
      setupSentRef.current
    ) {
      return;
    }

    const warband = getWarband(myPlayer.warband_id);
    if (!warband) {
      return;
    }

    setupSentRef.current = true;
    const deckId = myPlayer.deck_id;

    const run = async () => {
      let objectiveUids: string[] = [];
      let powerUids: string[] = [];

      if (myPlayer.format === "nemesis") {
        try {
          const deck = await fetchCustomDeck(deckId);
          if (!deck) {
            setupSentRef.current = false;
            return;
          }
          objectiveUids = deck.objective_uids ?? [];
          powerUids = deck.power_uids ?? [];
        } catch {
          setupSentRef.current = false;
          return;
        }
      } else {
        for (const uid of deckCardUids(deckId)) {
          if (getCatalogCard(uid)?.type === "objective") {
            objectiveUids.push(uid);
          } else {
            powerUids.push(uid);
          }
        }
      }

      void sendEvent("SETUP_PLAYER", {
        warbandId: warband.id,
        deckId,
        power: shuffleCards(powerUids),
        objectives: shuffleCards(objectiveUids),
        powerHand: OPENING_POWER_HAND,
        objectiveHand: OPENING_OBJECTIVE_HAND
      });
    };

    void run();
  }, [
    room?.status,
    myPlayer?.warband_id,
    myPlayer?.deck_id,
    myPlayer?.format,
    myState?.initialized,
    sendEvent,
    myPlayer
  ]);

  const opponents = useMemo(
    () => players.filter((player) => player.id !== myPlayer?.id),
    [players, myPlayer?.id]
  );

  const standings = useMemo(() => {
    return players
      .map((player) => ({ player, state: gameState.players[player.id] ?? null }))
      .sort((a, b) => (b.state?.gloryEarned ?? 0) - (a.state?.gloryEarned ?? 0));
  }, [players, gameState.players]);

  const closeModal = () => setModal(null);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room?.code ?? code.toUpperCase());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable; the code is on screen anyway
    }
  };

  // ------------------------------------------------------------------
  // Card actions
  // ------------------------------------------------------------------

  const cardActionsFor = (zone: PlaymatCardZone, cardId: string): CardAction[] => {
    if (!myState) {
      return [];
    }

    const card = getCatalogCard(cardId);
    const actions: CardAction[] = [];
    const act = (type: Parameters<typeof sendEvent>[0], payload: Record<string, unknown>) => {
      closeModal();
      void sendEvent(type, payload);
    };

    switch (zone) {
      case "hand":
        actions.push({ label: t("playmat.action.play"), onPress: () => act("PLAY_CARD", { cardId }) });
        if (card?.type === "upgrade") {
          actions.push({
            label: t("playmat.action.attach"),
            onPress: () => setModal({ kind: "attach", cardId })
          });
        }
        actions.push({
          label: t("playmat.action.discard"),
          tone: "danger",
          onPress: () => act("DISCARD_CARD", { cardId })
        });
        actions.push({
          label: t("playmat.action.toDeckTop"),
          tone: "ghost",
          onPress: () => act("MOVE_CARD", { cardId, from: "hand", to: "powerDeck", position: 0 })
        });
        actions.push({
          label: t("playmat.action.toDeckBottom"),
          tone: "ghost",
          onPress: () => act("MOVE_CARD", { cardId, from: "hand", to: "powerDeck", position: -1 })
        });
        break;

      case "objectiveHand":
        actions.push({ label: t("playmat.action.score"), onPress: () => act("SCORE_OBJECTIVE", { cardId }) });
        actions.push({
          label: t("playmat.action.discardObjective"),
          tone: "danger",
          onPress: () => act("DISCARD_OBJECTIVE", { cardId })
        });
        actions.push({
          label: t("playmat.action.toObjectiveDeckBottom"),
          tone: "ghost",
          onPress: () =>
            act("MOVE_CARD", { cardId, from: "objectiveHand", to: "objectiveDeck", position: -1 })
        });
        break;

      case "played":
        if (card?.type === "upgrade") {
          actions.push({
            label: t("playmat.action.attach"),
            onPress: () => setModal({ kind: "attach", cardId })
          });
        }
        actions.push({
          label: t("playmat.action.discard"),
          tone: "danger",
          onPress: () => act("DISCARD_CARD", { cardId })
        });
        actions.push({
          label: t("playmat.action.returnToHand"),
          tone: "ghost",
          onPress: () => act("MOVE_CARD", { cardId, from: "played", to: "hand" })
        });
        break;

      case "discard":
        actions.push({
          label: t("playmat.action.returnToHand"),
          onPress: () => act("MOVE_CARD", { cardId, from: "discard", to: "hand" })
        });
        actions.push({
          label: t("playmat.action.toDeckTop"),
          tone: "ghost",
          onPress: () => act("MOVE_CARD", { cardId, from: "discard", to: "powerDeck", position: 0 })
        });
        break;

      default:
        break;
    }

    return actions;
  };

  // ------------------------------------------------------------------
  // Drag & drop (desktop convenience; every action also works by tap)
  // ------------------------------------------------------------------

  const handleHandDragStart = (event: DragEvent, cardId: string) => {
    event.dataTransfer.setData("text/plain", JSON.stringify({ cardId, from: "hand" }));
    event.dataTransfer.effectAllowed = "move";
  };

  const readDragPayload = (event: DragEvent): { cardId: string; from: string } | null => {
    try {
      const parsed = JSON.parse(event.dataTransfer.getData("text/plain")) as {
        cardId?: string;
        from?: string;
      };
      return parsed.cardId ? { cardId: parsed.cardId, from: parsed.from ?? "hand" } : null;
    } catch {
      return null;
    }
  };

  const handlePlayedDrop = (event: DragEvent) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (payload?.from === "hand") {
      void sendEvent("PLAY_CARD", { cardId: payload.cardId });
    }
  };

  const handleDiscardDrop = (event: DragEvent) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (payload) {
      void sendEvent("DISCARD_CARD", { cardId: payload.cardId });
    }
  };

  const handleFighterDrop = (event: DragEvent, fighterId: string) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (payload && getCatalogCard(payload.cardId)?.type === "upgrade") {
      void sendEvent("ASSIGN_UPGRADE", { cardId: payload.cardId, fighterId });
    }
  };

  // ------------------------------------------------------------------
  // Early states
  // ------------------------------------------------------------------

  if (status === "loading") {
    return (
      <main className="app-shell centered-shell">
        <p className="status-line">{t("common.loading")}</p>
      </main>
    );
  }

  if (status === "error" || status === "notFound") {
    return (
      <main className="app-shell centered-shell">
        <section className="panel playmat-message-panel">
          <h1>{t("playmat.title")}</h1>
          <p>{status === "notFound" ? t("playmat.error.roomNotFound") : t(errorKey ?? "")}</p>
          <Link className="primary-button" to="/playmat">
            {t("playmat.backToLobby")}
          </Link>
        </section>
      </main>
    );
  }

  if (status === "needsSeat" || !myPlayer) {
    const roomFull = players.length >= 2;
    return (
      <main className="app-shell event-shell">
        <section className="panel playmat-message-panel">
          <p className="eyebrow">{t("playmat.roomCodeLabel")}</p>
          <h1 className="playmat-room-code">{code.toUpperCase()}</h1>
          {roomFull ? (
            <>
              <p className="error-line">{t("playmat.error.roomFull")}</p>
              <Link className="ghost-button" to="/playmat">
                {t("playmat.backToLobby")}
              </Link>
            </>
          ) : (
            <>
              <p>{t("playmat.joinSeatIntro")}</p>
              <SeatSetup onSeatChange={setSeat} />
              {actionErrorKey ? <p className="error-line">{t(actionErrorKey)}</p> : null}
              <button
                className="primary-button"
                disabled={!seat}
                onClick={() => seat && void joinAsNewPlayer(seat)}
                type="button"
              >
                {t("playmat.takeSeat")}
              </button>
              <Link className="ghost-button" to="/playmat">
                {t("playmat.backToLobby")}
              </Link>
            </>
          )}
        </section>
      </main>
    );
  }

  // ------------------------------------------------------------------
  // Lobby (waiting for host to start)
  // ------------------------------------------------------------------

  if (room?.status === "lobby") {
    const everyoneReady =
      players.length >= 2 && players.every((player) => player.warband_id && player.deck_id);

    return (
      <main className="app-shell event-shell">
        <section className="panel playmat-message-panel">
          <p className="eyebrow">{t("playmat.roomCodeLabel")}</p>
          <div className="playmat-code-row">
            <h1 className="playmat-room-code">{room.code}</h1>
            <button className="icon-button" onClick={() => void copyCode()} type="button">
              <Copy size={18} aria-hidden="true" />
            </button>
            {copied ? <span className="playmat-chip">{t("playmat.codeCopied")}</span> : null}
          </div>
          <p>{t("playmat.lobbyIntro")}</p>

          <div className="playmat-lobby-players">
            {players.map((player) => (
              <div className="playmat-lobby-row" key={player.id}>
                <strong>
                  {player.is_host ? <Crown size={14} aria-hidden="true" /> : null} {player.name}
                  {player.id === myPlayer.id ? ` (${t("playmat.you")})` : ""}
                </strong>
                <span>
                  {getWarband(player.warband_id)?.name ?? t("playmat.noWarbandYet")}
                  {" · "}
                  {player.format === "nemesis"
                    ? t("playmat.formatNemesis")
                    : deckLabel(player, t("playmat.formatNemesis"))}
                </span>
              </div>
            ))}
            {players.length < 2 ? (
              <div className="playmat-lobby-row waiting">
                <span>{t("playmat.waitingOpponent")}</span>
              </div>
            ) : null}
          </div>

          {actionErrorKey ? <p className="error-line">{t(actionErrorKey)}</p> : null}

          {myPlayer.is_host ? (
            <button
              className="primary-button"
              disabled={!everyoneReady}
              onClick={() => void startGame()}
              type="button"
            >
              <Play size={18} aria-hidden="true" /> {t("playmat.startGame")}
            </button>
          ) : (
            <p className="status-line">{t("playmat.waitingHost")}</p>
          )}
          {myPlayer.is_host && !everyoneReady ? (
            <p className="status-line">{t("playmat.startHint")}</p>
          ) : null}

          <button className="ghost-button" onClick={leaveSeat} type="button">
            <LogOut size={16} aria-hidden="true" /> {t("playmat.leaveSeat")}
          </button>
        </section>
      </main>
    );
  }

  // ------------------------------------------------------------------
  // Active game board
  // ------------------------------------------------------------------

  const phaseLabel =
    gameState.phase === "action" ? t("playmat.phase.action") : t("playmat.phase.end");
  const gameOver = gameState.finished || room?.status === "ended";
  const gloryAvailable = myState ? myState.gloryEarned - myState.glorySpent : 0;

  const modalOwnerState = (ownerId: string) => gameState.players[ownerId] ?? null;
  const modalOwnerPlayer = (ownerId: string) =>
    players.find((player) => player.id === ownerId) ?? null;

  return (
    <main className="playmat-shell">
      <header className="playmat-header">
        <button className="playmat-chip tappable" onClick={() => void copyCode()} type="button">
          {room?.code}
        </button>
        <span className="playmat-round">
          {formatText(t("playmat.roundLabel"), { round: gameState.round })} · {phaseLabel}
        </span>
        <div className="playmat-header-buttons">
          <button
            className="icon-button"
            aria-label={t("playmat.logTitle")}
            onClick={() => setModal({ kind: "log" })}
            type="button"
          >
            <BookOpen size={18} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            aria-label={t("playmat.menuTitle")}
            onClick={() => setModal({ kind: "menu" })}
            type="button"
          >
            <MenuIcon size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {actionErrorKey ? <p className="error-line playmat-error">{t(actionErrorKey)}</p> : null}

      <div className="playmat-scroll">
        {opponents.map((opponent) => (
          <OpponentArea
            key={opponent.id}
            onCardPress={(ownerId, zone, cardId) =>
              setModal({ kind: "card", ownerId, zone, cardId })
            }
            onFighterPress={(ownerId, fighterId) =>
              setModal({ kind: "fighter", ownerId, fighterId })
            }
            onOpenPile={(ownerId, zone) => setModal({ kind: "pile", ownerId, zone })}
            player={opponent}
            state={gameState.players[opponent.id] ?? null}
          />
        ))}

        {myState && myWarband ? (
          <>
            <section className="my-fighters">
              <p className="playmat-zone-title">{t("playmat.fightersTitle")}</p>
              <div className="fighter-row">
                {myWarband.fighters.map((fighter) => {
                  const fighterState = myState.fighters[fighter.id];
                  if (!fighterState) {
                    return null;
                  }

                  return (
                    <FighterTile
                      fighter={fighter}
                      key={fighter.id}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleFighterDrop(event, fighter.id)}
                      onPress={() =>
                        setModal({ kind: "fighter", ownerId: myPlayer.id, fighterId: fighter.id })
                      }
                      state={fighterState}
                      warbandId={myWarband.id}
                    />
                  );
                })}
              </div>
            </section>

            <section
              className="my-played"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handlePlayedDrop}
            >
              <p className="playmat-zone-title">
                {t("playmat.zone.played")} ({myState.played.length})
              </p>
              <div className="played-row">
                {myState.played.length ? (
                  myState.played.map((cardId) => {
                    const card = getCatalogCard(cardId);
                    return card ? (
                      <CardTile
                        card={card}
                        key={cardId}
                        onPress={() =>
                          setModal({ kind: "card", ownerId: myPlayer.id, zone: "played", cardId })
                        }
                        size="sm"
                      />
                    ) : null;
                  })
                ) : (
                  <p className="played-empty">{t("playmat.playedEmptyHint")}</p>
                )}
              </div>
            </section>
          </>
        ) : (
          <p className="status-line">{t("playmat.preparing")}</p>
        )}
      </div>

      {myState && myWarband ? (
        <footer className="playmat-dock">
          <div className="dock-controls">
            <button
              className="dock-pile"
              onClick={() => setModal({ kind: "deckMenu", deck: "power" })}
              type="button"
            >
              <CardTile backType="gambit" card={null} size="sm" />
              <span>
                {t("playmat.powerDeckShort")} {myState.powerDeck.length}
              </span>
            </button>
            <button
              className="dock-pile"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDiscardDrop}
              onClick={() => setModal({ kind: "pile", ownerId: myPlayer.id, zone: "discard" })}
              type="button"
            >
              <span className="dock-count">{myState.discard.length}</span>
              <span>{t("playmat.discardShort")}</span>
            </button>
            <button
              className="dock-pile"
              onClick={() => setModal({ kind: "deckMenu", deck: "objective" })}
              type="button"
            >
              <CardTile backType="objective" card={null} size="sm" />
              <span>
                {t("playmat.objectiveDeckShort")} {myState.objectiveDeck.length}
              </span>
            </button>
            <button
              className="dock-pile"
              onClick={() => setModal({ kind: "pile", ownerId: myPlayer.id, zone: "scored" })}
              type="button"
            >
              <span className="dock-count gold">{myState.scored.length}</span>
              <span>{t("playmat.scoredShort")}</span>
            </button>

            <div className="glory-control">
              <button
                aria-label={t("playmat.spendGlory")}
                className="icon-button"
                disabled={gloryAvailable <= 0}
                onClick={() => void sendEvent("SPEND_GLORY", { amount: 1 })}
                type="button"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span className="glory-value">
                <Trophy size={14} aria-hidden="true" /> {myState.gloryEarned}
                {myState.glorySpent > 0 ? <small>−{myState.glorySpent}</small> : null}
              </span>
              <button
                aria-label={t("playmat.gainGlory")}
                className="icon-button"
                onClick={() => void sendEvent("GAIN_GLORY", { amount: 1 })}
                type="button"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>

            <button
              className="end-phase-button"
              onClick={() => void sendEvent("END_PHASE")}
              type="button"
            >
              {gameState.phase === "action"
                ? t("playmat.endPhaseButton")
                : t("playmat.nextRoundButton")}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="hand-tabs">
            <button
              className={handTab === "power" ? "active" : ""}
              onClick={() => setHandTab("power")}
              type="button"
            >
              {t("playmat.zone.hand")} ({myState.hand.length})
            </button>
            <button
              className={handTab === "objective" ? "active" : ""}
              onClick={() => setHandTab("objective")}
              type="button"
            >
              {t("playmat.zone.objectiveHand")} ({myState.objectiveHand.length})
            </button>
          </div>

          <div className="hand-row">
            {(handTab === "power" ? myState.hand : myState.objectiveHand).map((cardId) => {
              const card = getCatalogCard(cardId);
              if (!card) {
                return null;
              }

              return (
                <CardTile
                  card={card}
                  draggable={handTab === "power"}
                  key={cardId}
                  onDragStart={(event) => handleHandDragStart(event, cardId)}
                  onPress={() =>
                    setModal({
                      kind: "card",
                      ownerId: myPlayer.id,
                      zone: handTab === "power" ? "hand" : "objectiveHand",
                      cardId
                    })
                  }
                  size="md"
                />
              );
            })}
            {(handTab === "power" ? myState.hand : myState.objectiveHand).length === 0 ? (
              <p className="played-empty">{t("playmat.handEmptyHint")}</p>
            ) : null}
          </div>
        </footer>
      ) : null}

      {/* ---------------- Modals ---------------- */}

      {modal?.kind === "card"
        ? (() => {
            const ownerPlayer = modalOwnerPlayer(modal.ownerId);
            const card = getCatalogCard(modal.cardId);
            if (!card) {
              return null;
            }

            const mine = modal.ownerId === myPlayer.id;
            return (
              <CardActionModal
                actions={mine ? cardActionsFor(modal.zone, modal.cardId) : []}
                card={card}
                onClose={closeModal}
                subtitle={
                  mine
                    ? t(ZONE_TITLE_KEYS[modal.zone])
                    : `${ownerPlayer?.name} · ${t(ZONE_TITLE_KEYS[modal.zone])}`
                }
              />
            );
          })()
        : null}

      {modal?.kind === "pile"
        ? (() => {
            const ownerPlayer = modalOwnerPlayer(modal.ownerId);
            const ownerState = modalOwnerState(modal.ownerId);
            if (!ownerState) {
              return null;
            }

            return (
              <PileViewerModal
                cardIds={ownerState[modal.zone]}
                onCardPress={(cardId) =>
                  setModal({ kind: "card", ownerId: modal.ownerId, zone: modal.zone, cardId })
                }
                onClose={closeModal}
                title={`${ownerPlayer?.name} · ${t(ZONE_TITLE_KEYS[modal.zone])}`}
              />
            );
          })()
        : null}

      {modal?.kind === "fighter"
        ? (() => {
            const ownerPlayer = modalOwnerPlayer(modal.ownerId);
            const ownerState = modalOwnerState(modal.ownerId);
            const ownerWarbandId = ownerPlayer?.warband_id ?? null;
            const fighter = getFighter(ownerWarbandId, modal.fighterId);
            const fighterState = ownerState?.fighters[modal.fighterId];
            if (!fighter || !fighterState || !ownerWarbandId) {
              return null;
            }

            const mine = modal.ownerId === myPlayer.id;
            return (
              <PlaymatModal onClose={closeModal} title={fighter.name}>
                <div className="fighter-sheet">
                  <FighterTile fighter={fighter} state={fighterState} warbandId={ownerWarbandId} />
                  <div className="fighter-sheet-info">
                    <p>
                      {t("playmat.woundsShort")}: {fighter.wounds} · {t("playmat.damageLabel")}:{" "}
                      {fighterState.damage}
                    </p>
                    {mine ? (
                      <>
                        <div className="fighter-sheet-controls">
                          <button
                            className="playmat-action ghost"
                            disabled={fighterState.damage <= 0}
                            onClick={() =>
                              void sendEvent("ADJUST_WOUNDS", { fighterId: fighter.id, amount: -1 })
                            }
                            type="button"
                          >
                            <Minus size={16} aria-hidden="true" /> {t("playmat.healWound")}
                          </button>
                          <button
                            className="playmat-action primary"
                            onClick={() =>
                              void sendEvent("ADJUST_WOUNDS", { fighterId: fighter.id, amount: 1 })
                            }
                            type="button"
                          >
                            <Plus size={16} aria-hidden="true" /> {t("playmat.addWound")}
                          </button>
                        </div>
                        <div className="fighter-sheet-controls">
                          <button
                            className="playmat-action ghost"
                            onClick={() =>
                              void sendEvent("TOGGLE_INSPIRED", { fighterId: fighter.id })
                            }
                            type="button"
                          >
                            {fighterState.inspired ? t("playmat.uninspire") : t("playmat.inspire")}
                          </button>
                          <button
                            className="playmat-action danger"
                            onClick={() =>
                              void sendEvent("SET_FIGHTER_OUT", {
                                fighterId: fighter.id,
                                out: !fighterState.out
                              })
                            }
                            type="button"
                          >
                            {fighterState.out
                              ? t("playmat.fighterReturn")
                              : t("playmat.fighterOutAction")}
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                <h3 className="pile-section-title">
                  {t("playmat.attachedUpgrades")} ({fighterState.upgrades.length})
                </h3>
                {fighterState.upgrades.length ? (
                  <div className="pile-grid">
                    {fighterState.upgrades.map((cardId) => {
                      const upgrade = getCatalogCard(cardId);
                      if (!upgrade) {
                        return null;
                      }

                      return (
                        <div className="upgrade-cell" key={cardId}>
                          <CardTile card={upgrade} size="md" />
                          {mine ? (
                            <button
                              className="playmat-action danger small"
                              onClick={() =>
                                void sendEvent("REMOVE_UPGRADE", { cardId, fighterId: fighter.id })
                              }
                              type="button"
                            >
                              {t("playmat.action.removeUpgrade")}
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="pile-empty">{t("playmat.noUpgrades")}</p>
                )}
              </PlaymatModal>
            );
          })()
        : null}

      {modal?.kind === "attach" && myWarband && myState
        ? (() => {
            const card = getCatalogCard(modal.cardId);
            if (!card) {
              return null;
            }

            return (
              <PlaymatModal onClose={closeModal} title={t("playmat.attachTitle")}>
                <p className="playmat-sheet-subtitle">{card.name}</p>
                <div className="playmat-action-list">
                  {myWarband.fighters.map((fighter) => {
                    const fighterState = myState.fighters[fighter.id];
                    return (
                      <button
                        className="playmat-action primary"
                        disabled={fighterState?.out}
                        key={fighter.id}
                        onClick={() => {
                          closeModal();
                          void sendEvent("ASSIGN_UPGRADE", {
                            cardId: modal.cardId,
                            fighterId: fighter.id
                          });
                        }}
                        type="button"
                      >
                        {fighter.name}
                        {fighterState?.upgrades.length ? ` (+${fighterState.upgrades.length})` : ""}
                      </button>
                    );
                  })}
                </div>
              </PlaymatModal>
            );
          })()
        : null}

      {modal?.kind === "deckMenu" && myState
        ? (() => {
            const isObjective = modal.deck === "objective";
            const deckZone = isObjective ? myState.objectiveDeck : myState.powerDeck;
            const discardZone = isObjective ? myState.objectiveDiscard : myState.discard;

            return (
              <PlaymatModal
                onClose={closeModal}
                title={t(isObjective ? "playmat.zone.objectiveDeck" : "playmat.zone.powerDeck")}
              >
                <p className="playmat-sheet-subtitle">
                  {formatText(t("playmat.cardsRemaining"), { count: deckZone.length })}
                </p>
                <div className="playmat-action-list">
                  <button
                    className="playmat-action primary"
                    disabled={!deckZone.length}
                    onClick={() => {
                      closeModal();
                      void sendEvent("DRAW_CARD", { deck: modal.deck, count: 1 });
                    }}
                    type="button"
                  >
                    {t("playmat.action.drawOne")}
                  </button>
                  <button
                    className="playmat-action ghost"
                    disabled={deckZone.length < 2}
                    onClick={() => {
                      closeModal();
                      void sendEvent("SHUFFLE_DECK", {
                        deck: modal.deck,
                        order: shuffleCards(deckZone)
                      });
                    }}
                    type="button"
                  >
                    <RotateCcw size={16} aria-hidden="true" /> {t("playmat.action.shuffle")}
                  </button>
                  {!isObjective && discardZone.length ? (
                    <button
                      className="playmat-action ghost"
                      onClick={() => {
                        closeModal();
                        void sendEvent("SHUFFLE_DECK", {
                          deck: modal.deck,
                          order: shuffleCards([...deckZone, ...discardZone]),
                          includeDiscard: true
                        });
                      }}
                      type="button"
                    >
                      {t("playmat.action.shuffleDiscardIn")}
                    </button>
                  ) : null}
                </div>
              </PlaymatModal>
            );
          })()
        : null}

      {modal?.kind === "log" ? (
        <EventLogPanel events={events} onClose={closeModal} players={players} />
      ) : null}

      {modal?.kind === "menu" ? (
        <PlaymatModal onClose={closeModal} title={t("playmat.menuTitle")}>
          <div className="playmat-action-list">
            {!gameOver && myPlayer.is_host ? (
              <button
                className={`playmat-action ${gameState.round >= STANDARD_ROUNDS ? "primary" : "danger"}`}
                onClick={() => {
                  closeModal();
                  void sendEvent("END_GAME");
                  void endRoom();
                }}
                type="button"
              >
                {gameState.round >= STANDARD_ROUNDS
                  ? t("playmat.endGameButton")
                  : t("playmat.endGameEarlyButton")}
              </button>
            ) : null}
            <button
              className="playmat-action ghost"
              onClick={() => {
                closeModal();
                navigate("/playmat");
              }}
              type="button"
            >
              <LogOut size={16} aria-hidden="true" /> {t("playmat.backToLobby")}
            </button>
            <button
              className="playmat-action ghost"
              onClick={() => {
                closeModal();
                navigate("/");
              }}
              type="button"
            >
              <Home size={16} aria-hidden="true" /> {t("playmat.backHome")}
            </button>
          </div>
        </PlaymatModal>
      ) : null}

      {gameOver ? (
        <div className="playmat-overlay game-over">
          <div className="playmat-sheet">
            <div className="playmat-sheet-head">
              <h2>{t("playmat.gameOverTitle")}</h2>
            </div>
            <div className="playmat-sheet-body">
              <ol className="playmat-standings">
                {standings.map(({ player, state }, index) => (
                  <li key={player.id}>
                    <span className="standing-rank">#{index + 1}</span>
                    <strong>{player.name}</strong>
                    <span>{getWarband(player.warband_id)?.name ?? ""}</span>
                    <span className="standing-glory">
                      <Trophy size={14} aria-hidden="true" /> {state?.gloryEarned ?? 0}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="playmat-action-list">
                <Link className="playmat-action primary" to="/playmat">
                  {t("playmat.backToLobby")}
                </Link>
                <Link className="playmat-action ghost" to="/">
                  {t("playmat.backHome")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
