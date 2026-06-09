import { achievementPoints } from "../data/achievements";
import { getLevelTitleKey } from "./levels";
import {
  EventRecord,
  getSupabaseClient,
  PlayerAchievementRecord,
  PlayerRecord
} from "./supabase";

export type RankedPlayer = PlayerRecord & {
  completedAchievementIds: string[];
  completedCount: number;
  score: number;
  titleKey: string;
};

function scoreAchievementIds(achievementIds: string[]) {
  return achievementIds.reduce(
    (total, achievementId) => total + (achievementPoints.get(achievementId) ?? 0),
    0
  );
}

function getErrorKey(error: unknown) {
  return error instanceof Error ? error.message : "status.saveError";
}

export async function fetchEventBySlug(slug: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("status.eventNotFound");
  }

  return data as EventRecord | null;
}

export async function joinPlayer(
  slug: string,
  joinCode: string,
  displayName: string,
  warband: string
) {
  try {
    const event = await fetchEventBySlug(slug);

    if (!event) {
      return { errorKey: "status.eventNotFound" };
    }

    if (event.is_locked) {
      return { errorKey: "status.eventLocked", event };
    }

    if (event.join_code.trim().toLowerCase() !== joinCode.trim().toLowerCase()) {
      return { errorKey: "status.invalidJoinCode", event };
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("players")
      .insert({
        event_id: event.id,
        display_name: displayName.trim(),
        warband: warband.trim()
      })
      .select("*")
      .single();

    if (error || !data) {
      return { errorKey: "status.joinError", event };
    }

    return {
      event,
      player: data as PlayerRecord
    };
  } catch (error) {
    return { errorKey: getErrorKey(error) };
  }
}

export async function fetchPlayer(playerId: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("players")
    .select("*")
    .eq("id", playerId)
    .maybeSingle();

  if (error) {
    throw new Error("status.playerMissing");
  }

  return data as PlayerRecord | null;
}

export async function fetchPlayerAchievementIds(
  eventId: string,
  playerId: string
) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("player_achievements")
    .select("achievement_id")
    .eq("event_id", eventId)
    .eq("player_id", playerId);

  if (error) {
    throw new Error("status.saveError");
  }

  return (data ?? []).map((row) => row.achievement_id as string);
}

export async function setAchievementCompleted(
  eventId: string,
  playerId: string,
  achievementId: string,
  completed: boolean
) {
  const client = getSupabaseClient();

  if (completed) {
    const { error } = await client.from("player_achievements").upsert(
      {
        event_id: eventId,
        player_id: playerId,
        achievement_id: achievementId
      },
      {
        onConflict: "event_id,player_id,achievement_id"
      }
    );

    if (error) {
      throw new Error("status.saveError");
    }

    return;
  }

  const { error } = await client
    .from("player_achievements")
    .delete()
    .eq("event_id", eventId)
    .eq("player_id", playerId)
    .eq("achievement_id", achievementId);

  if (error) {
    throw new Error("status.saveError");
  }
}

export async function fetchRankings(eventId: string) {
  const client = getSupabaseClient();
  const [{ data: players, error: playersError }, { data: achievements, error }] =
    await Promise.all([
      client
        .from("players")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true }),
      client
        .from("player_achievements")
        .select("*")
        .eq("event_id", eventId)
    ]);

  if (playersError || error) {
    throw new Error("status.saveError");
  }

  const achievementsByPlayer = new Map<string, string[]>();

  for (const achievement of (achievements ?? []) as PlayerAchievementRecord[]) {
    const playerAchievements =
      achievementsByPlayer.get(achievement.player_id) ?? [];
    playerAchievements.push(achievement.achievement_id);
    achievementsByPlayer.set(achievement.player_id, playerAchievements);
  }

  return ((players ?? []) as PlayerRecord[])
    .map((player) => {
      const completedAchievementIds = achievementsByPlayer.get(player.id) ?? [];
      const score = scoreAchievementIds(completedAchievementIds);

      return {
        ...player,
        completedAchievementIds,
        completedCount: completedAchievementIds.length,
        score,
        titleKey: getLevelTitleKey(score)
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.created_at.localeCompare(right.created_at);
    });
}

export async function resetPlayerAchievements(playerId: string) {
  const client = getSupabaseClient();
  const { error } = await client
    .from("player_achievements")
    .delete()
    .eq("player_id", playerId);

  if (error) {
    throw new Error("status.hostActionError");
  }
}

export async function deletePlayer(playerId: string) {
  const client = getSupabaseClient();
  const achievementsResult = await client
    .from("player_achievements")
    .delete()
    .eq("player_id", playerId);

  if (achievementsResult.error) {
    throw new Error("status.hostActionError");
  }

  const playerResult = await client.from("players").delete().eq("id", playerId);

  if (playerResult.error) {
    throw new Error("status.hostActionError");
  }
}

export async function setEventLocked(eventId: string, isLocked: boolean) {
  const client = getSupabaseClient();
  const { error } = await client
    .from("events")
    .update({
      is_locked: isLocked
    })
    .eq("id", eventId);

  if (error) {
    throw new Error("status.hostActionError");
  }
}
