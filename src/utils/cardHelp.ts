import { getSupabaseClient } from "./supabase";

export const CARD_HELP_TAGS = ["攻击卡", "防守卡", "得分卡", "装备卡", "反应卡"] as const;
export const CARD_HELP_FORMATS = ["Unknown", "Rivals", "Nemesis", "Both"] as const;

export type CardHelpTag = (typeof CARD_HELP_TAGS)[number];
export type CardHelpFormat = (typeof CARD_HELP_FORMATS)[number];

export type CardHelpEntry = {
  id: string;
  card_name: string;
  chinese_summary: string;
  timing: string;
  beginner_tip: string | null;
  tags: CardHelpTag[];
  warband_name: string | null;
  deck_name: string | null;
  format: CardHelpFormat;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type CardHelpPayload = Omit<CardHelpEntry, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export function filterCardHelpEntries(entries: CardHelpEntry[], query: string, tag: string) {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    const matchesTag = !tag || entry.tags.includes(tag as CardHelpTag);
    const matchesQuery =
      !q ||
      [entry.card_name, entry.warband_name, entry.deck_name, entry.chinese_summary]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q));
    return matchesTag && matchesQuery;
  });
}

export async function fetchCardHelpEntries(hostPin?: string) {
  const client = getSupabaseClient();
  const query = hostPin
    ? client.rpc("card_help_list", { p_pin: hostPin })
    : client.from("card_help_entries").select("*").eq("is_public", true);
  const { data, error } = await query.order("card_name", { ascending: true });

  if (error) {
    throw new Error(
      error.message.includes("HOST_PIN_INVALID")
        ? "status.hostPinInvalid"
        : "companion.error.load"
    );
  }

  return (data ?? []) as CardHelpEntry[];
}

export async function saveCardHelpEntry(hostPin: string, entry: CardHelpPayload) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("card_help_save", {
    p_pin: hostPin,
    p_entry: entry
  });

  if (error) {
    throw new Error(
      error.message.includes("HOST_PIN_INVALID")
        ? "status.hostPinInvalid"
        : "companion.error.save"
    );
  }

  return data as CardHelpEntry;
}

export async function deleteCardHelpEntry(hostPin: string, id: string) {
  const client = getSupabaseClient();
  const { error } = await client.rpc("card_help_delete", {
    p_pin: hostPin,
    p_id: id
  });

  if (error) {
    throw new Error(
      error.message.includes("HOST_PIN_INVALID")
        ? "status.hostPinInvalid"
        : "status.hostActionError"
    );
  }
}
