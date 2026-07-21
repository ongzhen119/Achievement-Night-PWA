// Per-device playmat session so a refreshed browser resumes its seat
// automatically (no login, matching the rest of the app).

export interface PlaymatSession {
  playerId: string;
  token: string;
  name: string;
}

function sessionKey(code: string) {
  return `playmat-session:${code.toUpperCase()}`;
}

export function getPlaymatSession(code: string): PlaymatSession | null {
  const rawValue = window.localStorage.getItem(sessionKey(code));
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as PlaymatSession;
    if (parsed && typeof parsed.playerId === "string" && typeof parsed.token === "string") {
      return parsed;
    }
  } catch {
    // fall through and clear the broken value
  }

  window.localStorage.removeItem(sessionKey(code));
  return null;
}

export function setPlaymatSession(code: string, session: PlaymatSession) {
  window.localStorage.setItem(sessionKey(code), JSON.stringify(session));
}

export function clearPlaymatSession(code: string) {
  window.localStorage.removeItem(sessionKey(code));
}

export function getLastPlayerName(): string {
  return window.localStorage.getItem("playmat-last-name") ?? "";
}

export function setLastPlayerName(name: string) {
  window.localStorage.setItem("playmat-last-name", name);
}
