// Unified pointer-events drag for playing a card from hand onto the board.
//
// Replaces HTML5 native drag-and-drop (which never fires on touchscreens) with
// one code path that works for mouse, touch and pen. The hook owns only the
// gesture mechanics — the game mapping lives in the caller via `onDrop`.
//
// Feel: a card is grabbed by an *upward flick* (vertical intent past a small
// threshold). Horizontal movement is left to the browser so the hand keeps
// scrolling — see `touch-action: pan-x` on `.hand-row .card-tile` in styles.css,
// which is what actually splits scroll-vs-drag (React's touch listeners are
// passive, so preventDefault alone can't stop the scroll).

import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";

export type DropZone =
  | { kind: "played" }
  | { kind: "discard" }
  | { kind: "fighter"; fighterId: string };

interface UseCardDragOptions {
  onDrop: (cardId: string, zone: DropZone) => void;
  /** Movement (px) before a drag commits. */
  threshold?: number;
}

interface CardDrag {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, cardId: string) => void;
  ghost: { cardId: string; x: number; y: number } | null;
  draggingCardId: string | null;
}

/** Vertical intent past the threshold — an upward/downward flick, not a sideways scroll. */
export function shouldStartDrag(dx: number, dy: number, threshold = 8): boolean {
  return Math.hypot(dx, dy) >= threshold && Math.abs(dy) > Math.abs(dx);
}

/** Map the element under the pointer to a drop zone, or null if none. */
export function resolveZone(el: Element | null): DropZone | null {
  const zone = el?.closest<HTMLElement>("[data-drop]");
  if (!zone) {
    return null;
  }

  const kind = zone.dataset.drop;
  if (kind === "played") {
    return { kind: "played" };
  }
  if (kind === "discard") {
    return { kind: "discard" };
  }
  if (kind === "fighter" && zone.dataset.fighterId) {
    return { kind: "fighter", fighterId: zone.dataset.fighterId };
  }
  return null;
}

export function useCardDrag({ onDrop, threshold = 8 }: UseCardDragOptions): CardDrag {
  const [ghost, setGhost] = useState<CardDrag["ghost"]>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  // Refs for the live gesture so pointermove doesn't re-render on every pixel.
  const gesture = useRef<{
    cardId: string;
    pointerId: number;
    startX: number;
    startY: number;
    button: HTMLButtonElement;
    dragging: boolean;
    hoverEl: HTMLElement | null;
  } | null>(null);
  const clickSuppressTimer = useRef<number | null>(null);

  const setHover = useCallback((next: HTMLElement | null) => {
    const g = gesture.current;
    if (!g || g.hoverEl === next) {
      return;
    }
    g.hoverEl?.classList.remove("drop-hover");
    next?.classList.add("drop-hover");
    g.hoverEl = next;
  }, []);

  const teardown = useCallback(() => {
    const g = gesture.current;
    if (g) {
      g.hoverEl?.classList.remove("drop-hover");
      try {
        g.button.releasePointerCapture(g.pointerId);
      } catch {
        // pointer was never captured (pure tap / early bail) — fine
      }
    }
    gesture.current = null;
    setGhost(null);
    setDraggingCardId(null);
  }, []);

  // Swallow exactly the one synthetic click a browser fires after a drag, so a
  // drag never also opens the card modal. Genuine taps never arm this.
  const armClickSuppressor = useCallback(() => {
    const kill = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      if (clickSuppressTimer.current !== null) {
        window.clearTimeout(clickSuppressTimer.current);
        clickSuppressTimer.current = null;
      }
    };
    window.addEventListener("click", kill, { capture: true, once: true });
    clickSuppressTimer.current = window.setTimeout(() => {
      window.removeEventListener("click", kill, { capture: true });
      clickSuppressTimer.current = null;
    }, 350);
  }, []);

  const handleMove = useCallback(
    (event: PointerEvent) => {
      const g = gesture.current;
      if (!g || event.pointerId !== g.pointerId) {
        return;
      }

      const dx = event.clientX - g.startX;
      const dy = event.clientY - g.startY;

      if (!g.dragging) {
        if (Math.hypot(dx, dy) < threshold) {
          return;
        }
        if (Math.abs(dx) >= Math.abs(dy)) {
          // Horizontal intent — it's a hand scroll, not a drag. Bail out.
          teardown();
          return;
        }
        // Vertical intent: commit to the drag and lock the pointer to us.
        g.dragging = true;
        try {
          g.button.setPointerCapture(g.pointerId);
        } catch {
          // capture unsupported — the window listeners still deliver events
        }
        setDraggingCardId(g.cardId);
      }

      event.preventDefault();
      setGhost({ cardId: g.cardId, x: event.clientX, y: event.clientY });
      const under = document.elementFromPoint(event.clientX, event.clientY);
      setHover(under?.closest<HTMLElement>("[data-drop]") ?? null);
    },
    [setHover, teardown, threshold]
  );

  const handleUp = useCallback(
    (event: PointerEvent) => {
      const g = gesture.current;
      if (!g || event.pointerId !== g.pointerId) {
        return;
      }

      const wasDrag = g.dragging;
      const cardId = g.cardId;
      const zone = wasDrag
        ? resolveZone(document.elementFromPoint(event.clientX, event.clientY))
        : null;

      teardown();

      if (wasDrag) {
        if (zone) {
          onDrop(cardId, zone);
        }
        armClickSuppressor();
      }
      // Pure tap: do nothing here — the native click → onClick opens the modal.
    },
    [armClickSuppressor, onDrop, teardown]
  );

  const handleCancel = useCallback(
    (event: PointerEvent) => {
      const g = gesture.current;
      if (!g || event.pointerId !== g.pointerId) {
        return;
      }
      teardown();
    },
    [teardown]
  );

  useEffect(() => {
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
      if (clickSuppressTimer.current !== null) {
        window.clearTimeout(clickSuppressTimer.current);
      }
    };
  }, [handleMove, handleUp, handleCancel]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, cardId: string) => {
      // Primary button / touch / pen only; ignore right & middle mouse.
      if (event.button !== 0) {
        return;
      }
      // A second finger during a drag shouldn't hijack it.
      if (gesture.current) {
        return;
      }
      // Do NOT preventDefault or capture here — the browser must stay free to
      // pan-x scroll the hand until we know this is a vertical drag.
      gesture.current = {
        cardId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        button: event.currentTarget,
        dragging: false,
        hoverEl: null
      };
    },
    []
  );

  return { onPointerDown, ghost, draggingCardId };
}
