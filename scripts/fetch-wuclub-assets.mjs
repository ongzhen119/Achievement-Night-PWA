// Downloads the card and fighter images used by the Digital Playmat from the
// wunderworlds.club open-source repo (PompolutZ/wuclub_monorepo) into public/.
//
// Usage:  node scripts/fetch-wuclub-assets.mjs
//
// Re-run any time (existing files are skipped; pass --force to re-download).
// Images are © Games Workshop; hosted by the wuclub fan project. Vendored
// locally so the playmat works offline and puts no load on wunderworlds.club.

import { mkdir, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW =
  "https://raw.githubusercontent.com/PompolutZ/wuclub_monorepo/main/apps/frontend_v2/public/assets";
const FORCE = process.argv.includes("--force");

/** deckId -> wuclub set code (32 cards each: <CODE>1 … <CODE>32) */
const CARD_SETS = {
  "blazing-assault": "BL",
  "emberstone-sentinel": "ES",
  "pillage-and-plunder": "PL",
  "countdown-to-cataclysm": "CC"
};

/** warbandId -> fighter slugs (wuclub filenames: <warband>-<slug>[-inspired].webp) */
const WARBANDS = {
  "gnarlspirit-pack": ["sarrakkar", "kheira", "lupan", "gorl"],
  "sons-of-velmorn": ["morlak", "thain", "faulk", "helmar", "jedran"],
  "grinkraks-looncourt": [
    "grinkrak",
    "snorbo",
    "nagz",
    "burk",
    "snark",
    "grib",
    "sholko-and-pronk"
  ]
  // drepurs-wraithcreepers: no images in the wuclub repo yet
};

// Extra non-deck cards worth having at the table.
const EXTRAS = [
  ["cards/CC/CCMap.webp", "public/cards/countdown-to-cataclysm/CCMap.webp"],
  ["cards/CC/CCPlot.webp", "public/cards/countdown-to-cataclysm/CCPlot.webp"]
];

const jobs = [];

for (const [deckId, code] of Object.entries(CARD_SETS)) {
  for (let n = 1; n <= 32; n += 1) {
    jobs.push([`cards/${code}/${code}${n}.webp`, `public/cards/${deckId}/${code}${n}.webp`]);
  }
}

for (const [warbandId, slugs] of Object.entries(WARBANDS)) {
  for (const slug of slugs) {
    jobs.push([
      `fighters/${warbandId}/${warbandId}-${slug}.webp`,
      `public/warbands/${warbandId}/${warbandId}-${slug}.webp`
    ]);
    jobs.push([
      `fighters/${warbandId}/${warbandId}-${slug}-inspired.webp`,
      `public/warbands/${warbandId}/${warbandId}-${slug}-inspired.webp`
    ]);
  }
  jobs.push([
    `fighters/${warbandId}/${warbandId}-warscroll.webp`,
    `public/warbands/${warbandId}/${warbandId}-warscroll.webp`
  ]);
}

jobs.push(...EXTRAS);

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const [remote, local] of jobs) {
  const target = join(ROOT, local);

  if (!FORCE) {
    try {
      await access(target);
      skipped += 1;
      continue;
    } catch {
      // not there yet — download it
    }
  }

  const url = `${RAW}/${remote}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await response.arrayBuffer()));
    downloaded += 1;
    console.log(`ok      ${local}`);
  } catch (error) {
    failed += 1;
    console.warn(`FAILED  ${local}  (${error.message})`);
  }
}

console.log(`\ndone: ${downloaded} downloaded, ${skipped} already present, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
