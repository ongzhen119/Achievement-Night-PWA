import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type EventRecord = {
  id: string;
  slug: string;
  name: string;
  event_date: string;
  join_code: string;
  host_pin: string;
  is_locked: boolean;
  created_at: string;
};

export type PlayerRecord = {
  id: string;
  event_id: string;
  display_name: string;
  warband: string;
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
    throw new Error("status.supabaseMissing");
  }

  return supabase;
}

export function subscribeToEventChanges(eventId: string, onChange: () => void) {
  const client = getSupabaseClient();
  const channel = client
    .channel(`event-${eventId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "events",
        filter: `id=eq.${eventId}`
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players",
        filter: `event_id=eq.${eventId}`
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "player_achievements",
        filter: `event_id=eq.${eventId}`
      },
      onChange
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
