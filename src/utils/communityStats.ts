import { BattleRecordRecord, getSupabaseClient } from "./supabase";

export type ProfileStats = {
  eventsPlayed: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  championCount: number;
  achievementsCompleted: number;
  favouriteWarband: string | null;
  currentStreak: number;
  longestStreak: number;
  latestActivity: string | null;
  recentBattles: BattleRecordRecord[];
  totalGlory: number;
  highlightsCount: number;
};

export type CommunityRecords = {
  mostGlory: { name: string; total: number } | null;
  mostGames: { name: string; count: number } | null;
  perfectVictories: number;
  doubleCrits: number;
};

export type CommunityRank = "Recruit" | "Veteran" | "Champion" | "Host" | "Founder";

export function getCommunityRank(stats: ProfileStats): CommunityRank {
  if (stats.championCount >= 1) return "Champion";
  if (stats.eventsPlayed >= 3) return "Veteran";
  if (stats.eventsPlayed >= 1) return "Veteran";
  return "Recruit";
}

export function getNextMilestone(
  stats: ProfileStats
): { key: string; values?: Record<string, number> } {
  if (stats.championCount >= 1) {
    return { key: "profile.milestone.alreadyChampion" };
  }
  if (stats.eventsPlayed >= 1) {
    return { key: "profile.milestone.toChampion" };
  }
  return { key: "profile.milestone.toVeteran" };
}

function calculateStreaks(battles: BattleRecordRecord[]): {
  current: number;
  longest: number;
} {
  if (!battles.length) return { current: 0, longest: 0 };

  let current = 0;
  for (const b of battles) {
    if (b.battle_result === "win") current++;
    else break;
  }

  let longest = 0;
  let streak = 0;
  for (const b of [...battles].reverse()) {
    if (b.battle_result === "win") {
      streak++;
      if (streak > longest) longest = streak;
    } else {
      streak = 0;
    }
  }

  return { current, longest };
}

function getFavouriteWarband(
  rows: { warband: string }[]
): string | null {
  if (!rows.length) return null;
  const counts = new Map<string, number>();
  for (const row of rows) {
    const w = row.warband.trim();
    if (w) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  let best: [string, number] | null = null;
  for (const entry of counts.entries()) {
    if (!best || entry[1] > best[1]) best = [entry[0], entry[1]];
  }
  return best?.[0] ?? null;
}

const EMPTY_STATS: ProfileStats = {
  eventsPlayed: 0,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  winRate: 0,
  championCount: 0,
  achievementsCompleted: 0,
  favouriteWarband: null,
  currentStreak: 0,
  longestStreak: 0,
  latestActivity: null,
  recentBattles: [],
  totalGlory: 0,
  highlightsCount: 0
};

export async function fetchProfileStats(
  communityPlayerId: string
): Promise<ProfileStats> {
  const client = getSupabaseClient();

  const { data: playerRows, error: playersError } = await client
    .from("players")
    .select("id, event_id, warband, created_at")
    .eq("community_player_id", communityPlayerId);

  if (playersError) return EMPTY_STATS;

  const players = (playerRows ?? []) as {
    id: string;
    event_id: string;
    warband: string;
    created_at: string;
  }[];

  const eventsPlayed = new Set(players.map((p) => p.event_id)).size;
  const favouriteWarband = getFavouriteWarband(players);

  const latestEventDate =
    players.length > 0
      ? players.sort((a, b) =>
          b.created_at.localeCompare(a.created_at)
        )[0].created_at
      : null;

  const playerIds = players.map((p) => p.id);

  const [achievementsResult, hofResult, battlesResult] = await Promise.all([
    playerIds.length > 0
      ? client
          .from("player_achievements")
          .select("id", { count: "exact", head: true })
          .in("player_id", playerIds)
      : Promise.resolve({ count: 0, error: null }),
    client
      .from("hall_of_fame")
      .select("id", { count: "exact", head: true })
      .eq("community_player_id", communityPlayerId),
    client
      .from("battle_records")
      .select("*")
      .eq("community_player_id", communityPlayerId)
      .order("created_at", { ascending: false })
      .limit(500)
  ]);

  const achievementsCompleted = achievementsResult.count ?? 0;
  const championCount = hofResult.error ? 0 : (hofResult.count ?? 0);
  const battles = battlesResult.error
    ? []
    : ((battlesResult.data ?? []) as BattleRecordRecord[]);

  const wins = battles.filter((b) => b.battle_result === "win").length;
  const losses = battles.filter((b) => b.battle_result === "loss").length;
  const draws = battles.filter((b) => b.battle_result === "draw").length;
  const gamesPlayed = battles.length;
  const winRate =
    gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  const { current: currentStreak, longest: longestStreak } =
    calculateStreaks(battles);

  const latestBattleDate = battles[0]?.created_at ?? null;
  const latestActivity =
    latestBattleDate && latestEventDate
      ? latestBattleDate > latestEventDate
        ? latestBattleDate
        : latestEventDate
      : latestBattleDate ?? latestEventDate;

  const totalGlory = battles.reduce((sum, b) => sum + (b.glory_score ?? 0), 0);
  const highlightsCount = battles.reduce(
    (sum, b) => sum + (b.epic_moments?.length ?? 0), 0
  );

  return {
    eventsPlayed,
    gamesPlayed,
    wins,
    losses,
    draws,
    winRate,
    championCount,
    achievementsCompleted,
    favouriteWarband,
    currentStreak,
    longestStreak,
    latestActivity,
    recentBattles: battles.slice(0, 5),
    totalGlory,
    highlightsCount
  };
}

export async function submitBattleRecord(record: {
  communityPlayerId: string;
  displayName?: string;
  eventId?: string;
  eventSlug?: string;
  battleResult: "win" | "loss" | "draw";
  warband: string;
  opponentWarband?: string;
  format?: string;
  epicMoments?: string[];
  gloryScore?: number;
  notes?: string;
}) {
  const client = getSupabaseClient();
  const { error } = await client.from("battle_records").insert({
    community_player_id: record.communityPlayerId,
    display_name: record.displayName ?? null,
    event_id: record.eventId ?? null,
    event_slug: record.eventSlug ?? null,
    battle_result: record.battleResult,
    warband: record.warband,
    opponent_warband: record.opponentWarband ?? null,
    format: record.format ?? null,
    epic_moments: record.epicMoments?.length ? record.epicMoments : null,
    glory_score: record.gloryScore ?? null,
    notes: record.notes ?? null
  });

  if (error) throw new Error("status.saveError");
}

export async function fetchCommunityRecords(): Promise<CommunityRecords> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("battle_records")
    .select("community_player_id, display_name, glory_score, epic_moments")
    .limit(1000);

  if (error || !data) return { mostGlory: null, mostGames: null, perfectVictories: 0, doubleCrits: 0 };

  const records = data as {
    community_player_id: string;
    display_name: string | null;
    glory_score: number | null;
    epic_moments: string[] | null;
  }[];

  const gloryMap = new Map<string, { name: string; total: number }>();
  const gamesMap = new Map<string, { name: string; count: number }>();

  for (const r of records) {
    const key = r.community_player_id;
    const name = r.display_name ?? "—";

    if (r.glory_score) {
      const g = gloryMap.get(key);
      if (g) g.total += r.glory_score;
      else gloryMap.set(key, { name, total: r.glory_score });
    }

    const g2 = gamesMap.get(key);
    if (g2) g2.count++;
    else gamesMap.set(key, { name, count: 1 });
  }

  let mostGlory: { name: string; total: number } | null = null;
  for (const v of gloryMap.values()) {
    if (!mostGlory || v.total > mostGlory.total) mostGlory = v;
  }

  let mostGames: { name: string; count: number } | null = null;
  for (const v of gamesMap.values()) {
    if (!mostGames || v.count > mostGames.count) mostGames = v;
  }

  const perfectVictories = records.filter(r => r.epic_moments?.includes("perfect-victory")).length;
  const doubleCrits = records.filter(r => r.epic_moments?.includes("double-crit")).length;

  return { mostGlory, mostGames, perfectVictories, doubleCrits };
}
