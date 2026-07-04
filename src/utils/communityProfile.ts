const SELECTED_PLAYER_KEY = "aexern:selected-player-id";
const LEGACY_PLAYER_ID_KEY = "community:player-id";
const LEGACY_PROFILE_KEY = "community:profile";

export type CommunityProfile = {
  playerId: string;
  displayName: string;
  warband: string;
  joinedDate: string;
};

export function getSelectedPlayerId() {
  return window.localStorage.getItem(SELECTED_PLAYER_KEY);
}

export function setSelectedPlayerId(playerId: string) {
  window.localStorage.setItem(SELECTED_PLAYER_KEY, playerId);
}

export function clearSelectedPlayerId() {
  window.localStorage.removeItem(SELECTED_PLAYER_KEY);
}

// Compatibility for archived, unregistered event pages.
export function getCommunityPlayerId() {
  return window.localStorage.getItem(LEGACY_PLAYER_ID_KEY);
}

export function getOrCreateCommunityPlayerId() {
  const existing = getCommunityPlayerId();
  if (existing) return existing;
  const playerId = crypto.randomUUID();
  window.localStorage.setItem(LEGACY_PLAYER_ID_KEY, playerId);
  return playerId;
}

export function getCommunityProfile(): CommunityProfile | null {
  const value = window.localStorage.getItem(LEGACY_PROFILE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as CommunityProfile;
  } catch {
    return null;
  }
}

export function createCommunityProfile(displayName: string, warband: string) {
  const profile: CommunityProfile = {
    playerId: getOrCreateCommunityPlayerId(),
    displayName: displayName.trim(),
    warband: warband.trim(),
    joinedDate: new Date().toISOString()
  };
  window.localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function updateCommunityProfile(
  updates: Partial<Pick<CommunityProfile, "displayName" | "warband">>
) {
  const current = getCommunityProfile();
  if (current) {
    window.localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify({ ...current, ...updates }));
  }
}
