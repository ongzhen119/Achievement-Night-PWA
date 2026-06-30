export type CommunityProfile = {
  playerId: string;
  displayName: string;
  warband: string;
  joinedDate: string;
};

const PLAYER_ID_KEY = "community:player-id";
const PROFILE_KEY = "community:profile";

export function getCommunityPlayerId(): string | null {
  return window.localStorage.getItem(PLAYER_ID_KEY);
}

export function getOrCreateCommunityPlayerId(): string {
  const existing = getCommunityPlayerId();
  if (existing) return existing;
  const newId = crypto.randomUUID();
  window.localStorage.setItem(PLAYER_ID_KEY, newId);
  return newId;
}

export function getCommunityProfile(): CommunityProfile | null {
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CommunityProfile;
  } catch {
    return null;
  }
}

export function createCommunityProfile(
  displayName: string,
  warband: string
): CommunityProfile {
  const playerId = getOrCreateCommunityPlayerId();
  const profile: CommunityProfile = {
    playerId,
    displayName: displayName.trim(),
    warband: warband.trim(),
    joinedDate: new Date().toISOString()
  };
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function updateCommunityProfile(
  updates: Partial<Pick<CommunityProfile, "displayName" | "warband">>
): void {
  const current = getCommunityProfile();
  if (!current) return;
  window.localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ ...current, ...updates })
  );
}
