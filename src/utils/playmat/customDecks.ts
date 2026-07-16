// Supabase CRUD for Nemesis custom decks, scoped to a community player.

import { getSupabaseClient } from "../supabase";
import { CustomDeckDraft } from "./deckRules";

export interface CustomDeckRecord {
  id: string;
  community_player_id: string;
  name: string;
  format: "nemesis";
  source_deck_ids: string[];
  objective_uids: string[];
  power_uids: string[];
  created_at: string;
  updated_at: string;
}

export function draftFromRecord(record: CustomDeckRecord): CustomDeckDraft {
  return {
    name: record.name,
    sourceDeckIds: record.source_deck_ids ?? [],
    objectiveUids: record.objective_uids ?? [],
    powerUids: record.power_uids ?? []
  };
}

export async function fetchCustomDecks(
  communityPlayerId: string
): Promise<CustomDeckRecord[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("playmat_custom_decks")
    .select()
    .eq("community_player_id", communityPlayerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("playmat.error.loadDecks");
  }

  return (data as CustomDeckRecord[]) ?? [];
}

export async function fetchCustomDeck(deckId: string): Promise<CustomDeckRecord | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("playmat_custom_decks")
    .select()
    .eq("id", deckId)
    .maybeSingle();

  if (error) {
    throw new Error("playmat.error.loadDecks");
  }

  return (data as CustomDeckRecord | null) ?? null;
}

export async function createCustomDeck(
  communityPlayerId: string,
  draft: CustomDeckDraft
): Promise<CustomDeckRecord> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("playmat_custom_decks")
    .insert({
      community_player_id: communityPlayerId,
      name: draft.name.trim() || "Untitled deck",
      format: "nemesis",
      source_deck_ids: draft.sourceDeckIds,
      objective_uids: draft.objectiveUids,
      power_uids: draft.powerUids
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("playmat.error.saveDeck");
  }

  return data as CustomDeckRecord;
}

export async function updateCustomDeck(
  deckId: string,
  draft: CustomDeckDraft
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from("playmat_custom_decks")
    .update({
      name: draft.name.trim() || "Untitled deck",
      source_deck_ids: draft.sourceDeckIds,
      objective_uids: draft.objectiveUids,
      power_uids: draft.powerUids,
      updated_at: new Date().toISOString()
    })
    .eq("id", deckId);

  if (error) {
    throw new Error("playmat.error.saveDeck");
  }
}

export async function duplicateCustomDeck(
  record: CustomDeckRecord,
  copyLabel: string
): Promise<CustomDeckRecord> {
  return createCustomDeck(record.community_player_id, {
    name: `${record.name} ${copyLabel}`.trim(),
    sourceDeckIds: record.source_deck_ids ?? [],
    objectiveUids: record.objective_uids ?? [],
    powerUids: record.power_uids ?? []
  });
}

export async function deleteCustomDeck(deckId: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from("playmat_custom_decks").delete().eq("id", deckId);

  if (error) {
    throw new Error("playmat.error.deleteDeck");
  }
}
