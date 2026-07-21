// AI Card Coach seeder.
//
// Writes src/data/playmat/cardCoach.ts into Supabase card_help_entries via
// the existing card_help_save RPC — same auth path the Host Card Help UI
// already uses (host PIN + anon key), so no service-role key or LLM API key
// needed. Re-run any time cardCoach.ts changes; upserts by card_uid.
//
// Usage (--experimental-strip-types lets Node import the .ts files directly):
//   node --experimental-strip-types scripts/generate-card-coach.mjs <hostPin>
//
// Run docs/supabase-card-help.sql and docs/supabase-card-help-coach.sql
// against your Supabase project first.

import { createClient } from "@supabase/supabase-js";
import { rivalsDecks } from "../src/data/playmat/rivalsDecks.ts";
import { cardCoach } from "../src/data/playmat/cardCoach.ts";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const hostPin = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing env vars. Required: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)");
  process.exit(1);
}
if (!hostPin) {
  console.error("Usage: node --experimental-strip-types scripts/generate-card-coach.mjs <hostPin>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const cards = rivalsDecks.flatMap((deck) =>
  deck.cards.map((card) => ({ uid: `${deck.id}:${card.id}`, deckName: deck.name, ...card }))
);

async function main() {
  let done = 0;
  let missing = 0;

  for (const card of cards) {
    const coach = cardCoach[card.uid];
    if (!coach) {
      missing += 1;
      console.warn(`No coach text for ${card.name} (${card.uid}) — skipped`);
      continue;
    }

    const { error } = await supabase.rpc("card_help_save", {
      p_pin: hostPin,
      p_entry: {
        card_uid: card.uid,
        card_name: card.name,
        chinese_summary: coach.summary,
        timing: coach.timing,
        beginner_tip: null,
        tags: [],
        warband_name: null,
        deck_name: card.deckName,
        format: "Rivals",
        is_public: true
      }
    });

    if (error) {
      console.error(`Failed on ${card.name} (${card.uid}):`, error.message);
      continue;
    }
    done += 1;
    console.log(`[${done}/${cards.length}] ${card.name}`);
  }

  console.log(`Done. ${done}/${cards.length} cards written. ${missing} missing coach text.`);
}

main();
