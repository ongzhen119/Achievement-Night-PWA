export type CurrentPlayerCache = {
  playerId: string;
  displayName: string;
  warband: string;
};

function getPlayerCacheKey(slug: string) {
  return `achievement-night-player:${slug}`;
}

export function getCurrentPlayerCache(slug: string) {
  const rawValue = window.localStorage.getItem(getPlayerCacheKey(slug));

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as CurrentPlayerCache;
  } catch {
    window.localStorage.removeItem(getPlayerCacheKey(slug));
    return null;
  }
}

export function setCurrentPlayerCache(
  slug: string,
  currentPlayer: CurrentPlayerCache
) {
  window.localStorage.setItem(
    getPlayerCacheKey(slug),
    JSON.stringify(currentPlayer)
  );
}
