export type CurrentPlayerCache = {
  playerId: string;
  displayName: string;
  warband: string;
};

function getPlayerCacheKey(slug: string) {
  return `achievement-player:${slug}`;
}

function getQuickStartProgressKey(slug: string) {
  return `achievement-quick-start:${slug}`;
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

export function getQuickStartProgress(slug: string) {
  const rawValue = window.localStorage.getItem(getQuickStartProgressKey(slug));

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    window.localStorage.removeItem(getQuickStartProgressKey(slug));
    return [];
  }
}

export function setQuickStartProgress(slug: string, itemKeys: string[]) {
  window.localStorage.setItem(
    getQuickStartProgressKey(slug),
    JSON.stringify(itemKeys)
  );
}

export function clearQuickStartProgress(slug: string) {
  window.localStorage.removeItem(getQuickStartProgressKey(slug));
}
