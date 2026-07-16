// ============================================================================
// WARBANDS — the fighters (miniatures) a player brings. (REAL DATA)
// ============================================================================
// Fighter card images courtesy of the wunderworlds.club project
// (https://github.com/PompolutZ/wuclub_monorepo) — thank you PompolutZ!
// Warhammer Underworlds is © Games Workshop. This is unofficial fan content
// for personal community play; no challenge to GW's rights is intended.
//
// A warband is INDEPENDENT of the card deck. A player picks a warband (these
// fighters) and separately picks a deck of cards (see rivalsDecks.ts).
//
// `wounds` = the Wounds characteristic printed on each fighter card.
// Each warband may have 3 to 7 fighters.
//
// Drepur's Wraithcreepers has no card images in the wuclub repo yet — those
// fighters show text placeholders until you drop scans into
// public/warbands/drepurs-wraithcreepers/ (filenames below).
// ============================================================================

export interface PlaymatFighterDef {
  /** Unique within the warband. Also the image filename base. */
  id: string;
  name: string;
  /** Wounds characteristic printed on the fighter card. */
  wounds: number;
  /** Explicit image path under public/, otherwise /warbands/<warbandId>/<id>.jpg */
  image?: string;
  inspiredImage?: string;
}

export interface PlaymatWarbandDef {
  /** Stable id used in the database and image paths. */
  id: string;
  name: string;
  fighters: PlaymatFighterDef[];
}

// Minimum / maximum fighters a warband may define.
export const MIN_FIGHTERS = 3;
export const MAX_FIGHTERS = 7;

function wuclubFighter(
  warbandId: string,
  slug: string,
  name: string,
  wounds: number
): PlaymatFighterDef {
  return {
    id: slug,
    name,
    wounds,
    image: `/warbands/${warbandId}/${warbandId}-${slug}.webp`,
    inspiredImage: `/warbands/${warbandId}/${warbandId}-${slug}-inspired.webp`
  };
}

// ----------------------------------------------------------------------------
// THE FOUR WARBANDS
// ----------------------------------------------------------------------------

export const playmatWarbands: PlaymatWarbandDef[] = [
  {
    id: "gnarlspirit-pack",
    name: "The Gnarlspirit Pack",
    fighters: [
      wuclubFighter("gnarlspirit-pack", "sarrakkar", "Sarrakkar", 4),
      wuclubFighter("gnarlspirit-pack", "kheira", "Kheira", 4),
      wuclubFighter("gnarlspirit-pack", "lupan", "Lupan", 4),
      wuclubFighter("gnarlspirit-pack", "gorl", "Gorl", 4)
    ]
  },
  {
    id: "sons-of-velmorn",
    name: "Sons of Velmorn",
    fighters: [
      wuclubFighter("sons-of-velmorn", "morlak", "Morlak", 4),
      wuclubFighter("sons-of-velmorn", "thain", "Thain", 2),
      wuclubFighter("sons-of-velmorn", "faulk", "Faulk", 2),
      wuclubFighter("sons-of-velmorn", "helmar", "Helmar", 2),
      wuclubFighter("sons-of-velmorn", "jedran", "Jedran", 5)
    ]
  },
  {
    id: "grinkraks-looncourt",
    name: "Grinkrak's Looncourt",
    fighters: [
      wuclubFighter("grinkraks-looncourt", "grinkrak", "Grinkrak", 3),
      wuclubFighter("grinkraks-looncourt", "snorbo", "Snorbo", 2),
      wuclubFighter("grinkraks-looncourt", "nagz", "Nagz", 2),
      wuclubFighter("grinkraks-looncourt", "burk", "Burk", 2),
      wuclubFighter("grinkraks-looncourt", "snark", "Snark", 2),
      wuclubFighter("grinkraks-looncourt", "grib", "Grib", 3),
      wuclubFighter("grinkraks-looncourt", "sholko-and-pronk", "Skolko & Pronk", 3)
    ]
  },
  {
    // TODO: no card images available for this warband yet — drop scans into
    // public/warbands/drepurs-wraithcreepers/ named <id>.jpg (or .png/.webp
    // via the image fields) and set the real printed Wounds values.
    id: "drepurs-wraithcreepers",
    name: "Drepur's Wraithcreepers",
    fighters: [
      { id: "drepur", name: "Drepur", wounds: 4 },
      { id: "wraithcreeper-1", name: "Wraithcreeper 1", wounds: 3 },
      { id: "wraithcreeper-2", name: "Wraithcreeper 2", wounds: 3 },
      { id: "wraithcreeper-3", name: "Wraithcreeper 3", wounds: 3 }
    ]
  }
];

// ----------------------------------------------------------------------------
// Lookup helpers
// ----------------------------------------------------------------------------

export function getWarband(warbandId: string | null | undefined) {
  return playmatWarbands.find((warband) => warband.id === warbandId) ?? null;
}

export function getFighter(warbandId: string | null | undefined, fighterId: string) {
  return getWarband(warbandId)?.fighters.find((fighter) => fighter.id === fighterId) ?? null;
}

export function fighterImagePath(
  warbandId: string,
  fighter: PlaymatFighterDef,
  inspired: boolean
) {
  if (inspired) {
    return fighter.inspiredImage ?? `/warbands/${warbandId}/${fighter.id}-inspired.jpg`;
  }

  return fighter.image ?? `/warbands/${warbandId}/${fighter.id}.jpg`;
}
