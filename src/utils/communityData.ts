import { getSupabaseClient } from "./supabase";

export type BattleFormat = "Rivals" | "Nemesis";
export type BattleResult = "win" | "loss" | "draw";

export type CommunityPlayer = {
  id: string;
  nickname: string;
  favouriteWarband: string | null;
  joinedYear: number | null;
  createdAt: string;
};

export type Battle = {
  id: string;
  date: string;
  playerId: string;
  opponentId: string;
  playerName: string;
  opponentName: string;
  playerWarband: string;
  opponentWarband: string;
  format: BattleFormat;
  result: BattleResult;
  playerGlory: number;
  opponentGlory: number;
  notes: string | null;
  createdAt: string;
};

export type PlayerStats = {
  player: CommunityPlayer;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalGlory: number;
  lastPlayed: string | null;
};

export type CommunityData = {
  players: CommunityPlayer[];
  battles: Battle[];
};

export type BattleInput = {
  date: string;
  playerId: string;
  opponentId: string;
  playerWarband: string;
  opponentWarband: string;
  format: BattleFormat;
  result: BattleResult;
  playerGlory: number;
  opponentGlory: number;
  notes?: string;
};

type PlayerRow = {
  id: string;
  nickname: string;
  favourite_warband: string | null;
  joined_year: number | null;
  created_at: string;
};

type BattleRow = {
  id: string;
  played_on: string | null;
  player_id: string | null;
  opponent_id: string | null;
  player_warband: string | null;
  opponent_warband: string | null;
  format: string | null;
  result: string | null;
  player_glory: number | null;
  opponent_glory: number | null;
  notes: string | null;
  created_at: string;
};

function toPlayer(row: PlayerRow): CommunityPlayer {
  return {
    id: row.id,
    nickname: row.nickname,
    favouriteWarband: row.favourite_warband,
    joinedYear: row.joined_year,
    createdAt: row.created_at
  };
}

export async function fetchCommunityData(): Promise<CommunityData> {
  const client = getSupabaseClient();
  const [playersResult, battlesResult] = await Promise.all([
    client
      .from("community_players")
      .select("id,nickname,favourite_warband,joined_year,created_at")
      .eq("is_active", true)
      .order("nickname", { ascending: true }),
    client
      .from("battle_records")
      .select(
        "id,played_on,player_id,opponent_id,player_warband,opponent_warband,format,result,player_glory,opponent_glory,notes,created_at"
      )
      .order("played_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1000)
  ]);

  if (playersResult.error || battlesResult.error) {
    throw new Error("companion.error.schema");
  }

  const players = ((playersResult.data ?? []) as PlayerRow[]).map(toPlayer);
  const playerNames = new Map(players.map((player) => [player.id, player.nickname]));

  const battles = ((battlesResult.data ?? []) as BattleRow[])
    .filter(
      (row) =>
        row.played_on &&
        row.player_id &&
        row.opponent_id &&
        row.player_warband &&
        row.opponent_warband &&
        (row.format === "Rivals" || row.format === "Nemesis") &&
        (row.result === "win" || row.result === "loss" || row.result === "draw") &&
        row.player_glory !== null &&
        row.opponent_glory !== null
    )
    .map((row) => ({
      id: row.id,
      date: row.played_on!,
      playerId: row.player_id!,
      opponentId: row.opponent_id!,
      playerName: playerNames.get(row.player_id!) ?? "Unknown player",
      opponentName: playerNames.get(row.opponent_id!) ?? "Unknown player",
      playerWarband: row.player_warband!,
      opponentWarband: row.opponent_warband!,
      format: row.format as BattleFormat,
      result: row.result as BattleResult,
      playerGlory: row.player_glory!,
      opponentGlory: row.opponent_glory!,
      notes: row.notes,
      createdAt: row.created_at
    }));

  return { players, battles };
}

export async function createCommunityPlayer(input: {
  nickname: string;
  favouriteWarband?: string;
  joinedYear?: number;
}) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("community_players")
    .insert({
      nickname: input.nickname.trim(),
      favourite_warband: input.favouriteWarband?.trim() || null,
      joined_year: input.joinedYear ?? null
    })
    .select("id,nickname,favourite_warband,joined_year,created_at")
    .single();

  if (error || !data) {
    throw new Error(
      error?.code === "23505"
        ? "companion.error.duplicatePlayer"
        : "companion.error.save"
    );
  }

  return toPlayer(data as PlayerRow);
}

export function validateBattle(input: BattleInput) {
  return Boolean(
    input.date &&
      input.playerId &&
      input.opponentId &&
      input.playerId !== input.opponentId &&
      input.playerWarband.trim() &&
      input.opponentWarband.trim() &&
      (input.format === "Rivals" || input.format === "Nemesis") &&
      (input.result === "win" || input.result === "loss" || input.result === "draw") &&
      Number.isInteger(input.playerGlory) &&
      input.playerGlory >= 0 &&
      Number.isInteger(input.opponentGlory) &&
      input.opponentGlory >= 0
  );
}

export async function createBattle(input: BattleInput, playerName: string) {
  if (!validateBattle(input)) {
    throw new Error("companion.error.invalidBattle");
  }

  const client = getSupabaseClient();
  const { error } = await client.from("battle_records").insert({
    played_on: input.date,
    player_id: input.playerId,
    opponent_id: input.opponentId,
    player_warband: input.playerWarband.trim(),
    opponent_warband: input.opponentWarband.trim(),
    format: input.format,
    result: input.result,
    player_glory: input.playerGlory,
    opponent_glory: input.opponentGlory,
    notes: input.notes?.trim() || null,
    // Keep legacy required columns populated while old rows remain preserved.
    community_player_id: input.playerId,
    display_name: playerName,
    battle_result: input.result,
    warband: input.playerWarband.trim(),
    glory_score: input.playerGlory
  });

  if (error) {
    throw new Error("companion.error.save");
  }
}

export function resultForPlayer(battle: Battle, playerId: string): BattleResult {
  if (battle.result === "draw") return "draw";
  if (battle.playerId === playerId) return battle.result;
  return battle.result === "win" ? "loss" : "win";
}

export function calculatePlayerStats(
  players: CommunityPlayer[],
  battles: Battle[]
): PlayerStats[] {
  return players.map((player) => {
    const playerBattles = battles.filter(
      (battle) => battle.playerId === player.id || battle.opponentId === player.id
    );
    const results = playerBattles.map((battle) => resultForPlayer(battle, player.id));
    const wins = results.filter((result) => result === "win").length;
    const losses = results.filter((result) => result === "loss").length;
    const draws = results.filter((result) => result === "draw").length;
    const totalGlory = playerBattles.reduce(
      (total, battle) =>
        total + (battle.playerId === player.id ? battle.playerGlory : battle.opponentGlory),
      0
    );

    return {
      player,
      games: playerBattles.length,
      wins,
      losses,
      draws,
      winRate: playerBattles.length ? Math.round((wins / playerBattles.length) * 100) : 0,
      totalGlory,
      lastPlayed: playerBattles[0]?.date ?? null
    };
  });
}

export function getCommunityTotals(players: CommunityPlayer[], battles: Battle[]) {
  return {
    players: players.length,
    battles: battles.length,
    glory: battles.reduce(
      (total, battle) => total + battle.playerGlory + battle.opponentGlory,
      0
    )
  };
}

export function getHallOfFame(players: CommunityPlayer[], battles: Battle[]) {
  const stats = calculatePlayerStats(players, battles);
  const byGames = [...stats].filter((item) => item.games > 0).sort((a, b) => b.games - a.games);
  const byWinRate = [...byGames].sort(
    (a, b) => b.winRate - a.winRate || b.games - a.games
  );
  const byGlory = [...byGames].sort((a, b) => b.totalGlory - a.totalGlory);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const activity = new Map(players.map((player) => [player.id, 0]));

  for (const battle of battles) {
    if (new Date(`${battle.date}T00:00:00`) < cutoff) continue;
    activity.set(battle.playerId, (activity.get(battle.playerId) ?? 0) + 1);
    activity.set(battle.opponentId, (activity.get(battle.opponentId) ?? 0) + 1);
  }

  const mostActive = [...stats].sort(
    (a, b) =>
      (activity.get(b.player.id) ?? 0) - (activity.get(a.player.id) ?? 0) ||
      b.games - a.games
  )[0];
  const latestDecisiveBattle = battles.find((battle) => battle.result !== "draw");
  const latestWinnerId = latestDecisiveBattle
    ? latestDecisiveBattle.result === "win"
      ? latestDecisiveBattle.playerId
      : latestDecisiveBattle.opponentId
    : null;

  return {
    mostGames: byGames[0] ?? null,
    topWinRate: byWinRate[0] ?? null,
    mostGlory: byGlory[0] ?? null,
    mostRecentWinner: players.find((player) => player.id === latestWinnerId) ?? null,
    mostActive:
      mostActive && (activity.get(mostActive.player.id) ?? 0) > 0 ? mostActive : null
  };
}

if (import.meta.env.DEV) {
  const testPlayers: CommunityPlayer[] = [
    { id: "a", nickname: "A", favouriteWarband: null, joinedYear: null, createdAt: "" },
    { id: "b", nickname: "B", favouriteWarband: null, joinedYear: null, createdAt: "" }
  ];
  const testBattle: Battle = {
    id: "1",
    date: "2026-01-01",
    playerId: "a",
    opponentId: "b",
    playerName: "A",
    opponentName: "B",
    playerWarband: "Alpha",
    opponentWarband: "Beta",
    format: "Rivals",
    result: "win",
    playerGlory: 12,
    opponentGlory: 8,
    notes: null,
    createdAt: ""
  };
  const testStats = calculatePlayerStats(testPlayers, [testBattle]);
  if (
    testStats[0].wins !== 1 ||
    testStats[1].losses !== 1 ||
    testStats[0].totalGlory !== 12 ||
    testStats[1].totalGlory !== 8
  ) {
    throw new Error("Battle statistics self-check failed.");
  }
}
