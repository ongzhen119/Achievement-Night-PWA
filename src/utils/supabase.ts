import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Legacy types remain only so archived achievement pages still type-check.
// No legacy page is registered in the active router.
export type EventRecord = {
  id: string;
  slug: string;
  name: string;
  event_date: string;
  join_code: string;
  host_pin: string;
  is_locked: boolean;
  season_label: string | null;
  created_at: string;
};

export type HallOfFameRecord = {
  id: string;
  season_label: string;
  event_id: string;
  event_name: string;
  event_date: string;
  champion_name: string;
  warband: string;
  score: number;
  community_player_id: string | null;
  created_at: string;
};

export type PlayerRecord = {
  id: string;
  event_id: string;
  display_name: string;
  warband: string;
  community_player_id: string | null;
  created_at: string;
};

export type BattleRecordRecord = {
  id: string;
  community_player_id: string;
  event_id: string | null;
  event_slug: string | null;
  battle_result: "win" | "loss" | "draw";
  warband: string;
  opponent_warband: string | null;
  format: string | null;
  epic_moments: string[] | null;
  glory_score: number | null;
  notes: string | null;
  display_name: string | null;
  created_at: string;
};

export type PlayerAchievementRecord = {
  id: string;
  event_id: string;
  player_id: string;
  achievement_id: string;
  created_at: string;
};

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error("companion.error.supabase");
  }

  return supabase;
}

export function subscribeToEventChanges(eventId: string, onChange: () => void) {
  const client = getSupabaseClient();
  const channel = client
    .channel(`legacy-event-${eventId}-${Date.now()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `id=eq.${eventId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `event_id=eq.${eventId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "player_achievements", filter: `event_id=eq.${eventId}` }, onChange)
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
