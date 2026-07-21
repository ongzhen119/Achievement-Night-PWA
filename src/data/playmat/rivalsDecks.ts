// ============================================================================
// RIVALS DECKS — the four fixed card decks (REAL DATA).
// ============================================================================
// Card data and images courtesy of the wunderworlds.club project
// (https://github.com/PompolutZ/wuclub_monorepo) — thank you PompolutZ!
// Warhammer Underworlds is © Games Workshop. This is unofficial fan content
// for personal community play; no challenge to GW's rights is intended.
//
// Generated from packages/wudb — regenerate images with:
//   node scripts/fetch-wuclub-assets.mjs
//
// A Rivals deck is a fixed 32-card set (12 objectives + 20 power cards).
// Players use one directly in RIVALS format, or combine two of them into a
// custom deck in NEMESIS format (see deckRules.ts + the Deck Builder).
//
// Card attributes used by the Nemesis deck builder:
//   objective:  glory (points), surge (max 6 per Nemesis deck)
//   gambit:     ploy  (Ploys may fill at most half a Nemesis power deck)
// ============================================================================

export type PlaymatCardType = "objective" | "gambit" | "upgrade";

export interface PlaymatCardDef {
  /** Unique within the deck. Also the image filename base. */
  id: string;
  name: string;
  type: PlaymatCardType;
  /** Objectives: glory scored. Upgrades: printed glory value (bounty). */
  glory?: number;
  /** Objectives only: is this a Surge objective? */
  surge?: boolean;
  /** Gambits only: is this a Ploy? */
  ploy?: boolean;
  /** Card rules text (shown in the zoom view). */
  rule?: string;
  /** Explicit image path under public/. */
  image?: string;
}

export interface PlaymatRivalsDeckDef {
  id: string;
  name: string;
  cards: PlaymatCardDef[];
}

// Opening hands dealt automatically when the game starts.
export const OPENING_POWER_HAND = 5;
export const OPENING_OBJECTIVE_HAND = 3;
// A standard game lasts 3 rounds; the playmat allows continuing past this.
export const STANDARD_ROUNDS = 3;

export const rivalsDecks: PlaymatRivalsDeckDef[] = [
  {
    id: "blazing-assault",
    name: "Blazing Assault",
    cards: [
      { id: "BL1", name: "Strike the Head", type: "objective", glory: 1, surge: true, rule: "Score this immediately after an enemy fighter is slain by a friendly fighter if the target was a **leader** or the target's Health characteristic was equal to or greater than the attacker's.", image: "/cards/blazing-assault/BL1.webp" },
      { id: "BL2", name: "Branching Fate", type: "objective", glory: 1, surge: true, rule: "Score this immediately after you make an Attack roll that contained 3 or more dice if each result was a different symbol. If you are the **underdog**, the Attack roll can contain 2 or more dice instead.", image: "/cards/blazing-assault/BL2.webp" },
      { id: "BL3", name: "Perfect Strike", type: "objective", glory: 1, surge: true, rule: "Score this immediately after you make an Attack roll if all of the results were successes.", image: "/cards/blazing-assault/BL3.webp" },
      { id: "BL4", name: "Critical Effort", type: "objective", glory: 1, surge: true, rule: "Score this immediately after you make an Attack roll if any of the results was a :atCrit:.", image: "/cards/blazing-assault/BL4.webp" },
      { id: "BL5", name: "Get Stuck In", type: "objective", glory: 1, surge: true, rule: "Score this immediately after a friendly fighter's Attack if the target was in enemy territory.", image: "/cards/blazing-assault/BL5.webp" },
      { id: "BL6", name: "Strong Start", type: "objective", glory: 1, surge: true, rule: "Score this immediately after an enemy fighter is slain if that fighter was the first fighter slain this combat phase.", image: "/cards/blazing-assault/BL6.webp" },
      { id: "BL7", name: "Keep Choppin'", type: "objective", glory: 1, rule: "Score this in an end phase if your warband Attacked 3 or more times this combat phase.", image: "/cards/blazing-assault/BL7.webp" },
      { id: "BL8", name: "Fields of Blood", type: "objective", glory: 1, rule: "Score this in an end phase if 4 or more fighters are damaged and/or slain.", image: "/cards/blazing-assault/BL8.webp" },
      { id: "BL9", name: "Go All Out", type: "objective", glory: 1, rule: "Score this in an end phase if 5 or more fighters have Move and/or Charge tokens.", image: "/cards/blazing-assault/BL9.webp" },
      { id: "BL10", name: "On the Edge", type: "objective", glory: 1, rule: "Score this in an end phase if any enemy fighters are vulnerable.", image: "/cards/blazing-assault/BL10.webp" },
      { id: "BL11", name: "Denial", type: "objective", glory: 1, rule: "Score this in an end phase if there are no enemy fighters in friendly territory.", image: "/cards/blazing-assault/BL11.webp" },
      { id: "BL12", name: "Annihilation", type: "objective", glory: 5, rule: "Score this in an end phase if each enemy fighter is slain.", image: "/cards/blazing-assault/BL12.webp" },
      { id: "BL13", name: "Determined Effort", type: "gambit", ploy: true, rule: "Play this immediately after you pick a weapon as part of an Attack. That weapon has +1 Attack dice for that Attack. If you are the **underdog**, that weapon has +2 Attack dice for that Attack instead.", image: "/cards/blazing-assault/BL13.webp" },
      { id: "BL14", name: "Twist the Knife", type: "gambit", ploy: true, rule: "Play this immediately after you pick a melee weapon as part of an Attack. That weapon has **Grievous** for that Attack.", image: "/cards/blazing-assault/BL14.webp" },
      { id: "BL15", name: "Lure of Battle", type: "gambit", ploy: true, rule: "Pick 1 friendly fighter that is within 2 hexes of another fighter. Push the other fighter 1 hex closer to that friendly fighter.", image: "/cards/blazing-assault/BL15.webp" },
      { id: "BL16", name: "Sidestep", type: "gambit", ploy: true, rule: "Pick a friendly fighter. Push that fighter 1 hex.", image: "/cards/blazing-assault/BL16.webp" },
      { id: "BL17", name: "Commanding Stride", type: "gambit", ploy: true, rule: "Push your **leader** up to 3 hexes. That push must end in a starting hex.", image: "/cards/blazing-assault/BL17.webp" },
      { id: "BL18", name: "Illusory Fighter", type: "gambit", ploy: true, rule: "Pick a friendly fighter. Remove that fighter from the battlefield, and then place that fighter in an empty starting hex in friendly territory.", image: "/cards/blazing-assault/BL18.webp" },
      { id: "BL19", name: "Wings of War", type: "gambit", ploy: true, rule: "Play this immediately after you pick a fighter to Move. That fighter has +2 Move for that Move.", image: "/cards/blazing-assault/BL19.webp" },
      { id: "BL20", name: "Shields Up!", type: "gambit", ploy: true, rule: "Pick a friendly fighter. Give that fighter a Guard token.", image: "/cards/blazing-assault/BL20.webp" },
      { id: "BL21", name: "Scream of Anger", type: "gambit", ploy: true, rule: "Pick a friendly fighter. Inflict 2 damage on that fighter and then remove 1 of that fighter's Move or Charge tokens.", image: "/cards/blazing-assault/BL21.webp" },
      { id: "BL22", name: "Healing Potion", type: "gambit", ploy: true, rule: "Pick a friendly fighter. Heal that fighter. If you are the **underdog**, you can roll a Save dice. On a :dfBlock: or :dfCrit:, heal that fighter again.", image: "/cards/blazing-assault/BL22.webp" },
      { id: "BL23", name: "Brawler", type: "upgrade", glory: 1, rule: "This fighter cannot be Flanked or Surrounded.", image: "/cards/blazing-assault/BL23.webp" },
      { id: "BL24", name: "Hidden Aid", type: "upgrade", glory: 1, rule: "Enemy fighters adjacent to this fighter are Flanked.", image: "/cards/blazing-assault/BL24.webp" },
      { id: "BL25", name: "Accurate", type: "upgrade", glory: 1, rule: "**Strike True:** After you make an Attack roll for this fighter, you can immediately re-roll 1 Attack dice in that Attack roll.", image: "/cards/blazing-assault/BL25.webp" },
      { id: "BL26", name: "Great Strength", type: "upgrade", glory: 2, rule: "This fighter's melee weapons have **Grievous**.", image: "/cards/blazing-assault/BL26.webp" },
      { id: "BL27", name: "Deadly Aim", type: "upgrade", glory: 1, rule: "This fighter's weapons have **Ensnare**.", image: "/cards/blazing-assault/BL27.webp" },
      { id: "BL28", name: "Sharpened Points", type: "upgrade", glory: 1, rule: "This fighter's weapons have **Cleave**.", image: "/cards/blazing-assault/BL28.webp" },
      { id: "BL29", name: "Duellist", type: "upgrade", glory: 1, rule: "**Footwork:** Immediately after this fighter has Attacked, you can push this fighter 1 hex.", image: "/cards/blazing-assault/BL29.webp" },
      { id: "BL30", name: "Tough", type: "upgrade", glory: 2, rule: "No more than 3 damage can be inflicted on this fighter in the same turn.", image: "/cards/blazing-assault/BL30.webp" },
      { id: "BL31", name: "Great Fortitude", type: "upgrade", glory: 2, rule: "This fighter has +1 Health.", image: "/cards/blazing-assault/BL31.webp" },
      { id: "BL32", name: "Keen Eye", type: "upgrade", glory: 2, rule: "This fighter's melee weapons have +1 Attack dice.", image: "/cards/blazing-assault/BL32.webp" },
    ]
  },
  {
    id: "emberstone-sentinel",
    name: "Emberstone Sentinels",
    cards: [
      { id: "ES1", name: "Sally Forth", type: "objective", glory: 1, surge: true, rule: "Score this immediately after your opponent's Action step if a friendly fighter with any Charge tokens hold a treasure token in enemy territory.", image: "/cards/emberstone-sentinel/ES1.webp" },
      { id: "ES2", name: "Stand Firm", type: "objective", glory: 1, surge: true, rule: "Score this immediately after your opponent's Action step if a friendly fighter with any Stagger tokens holds a treasure token in enemy territory.", image: "/cards/emberstone-sentinel/ES2.webp" },
      { id: "ES3", name: "Step by Step", type: "objective", glory: 1, surge: true, rule: "Score this immediately after your opponent's Action step if a friendly fighter with any Move tokens holds a treasure token in enemy territory. If you are the **underdog**, that friendly fighter can have any Charge tokens instead.", image: "/cards/emberstone-sentinel/ES3.webp" },
      { id: "ES4", name: "Unassailable", type: "objective", glory: 1, surge: true, rule: "Score this immediately after an enemy fighter's Attack if a friendly fighter holding a treasure token was the target of that Attack.", image: "/cards/emberstone-sentinel/ES4.webp" },
      { id: "ES5", name: "Aggressive Defender", type: "objective", glory: 1, surge: true, rule: "Score this immediately after a friendly fighter's Attack if the attacker is holding a treasure token.", image: "/cards/emberstone-sentinel/ES5.webp" },
      { id: "ES6", name: "Careful Advance", type: "objective", glory: 1, surge: true, rule: "Score this immediately after a friendly fighter Moves if 2 or more friendly fighters that have Move tokens are in enemy territory.", image: "/cards/emberstone-sentinel/ES6.webp" },
      { id: "ES7", name: "Hold Treasure Token 1 or 2", type: "objective", glory: 1, rule: "Score this in an end phase if a friendly fighter holds treasure token 1 or 2.", image: "/cards/emberstone-sentinel/ES7.webp" },
      { id: "ES8", name: "Hold Treasure Token 3 or 4", type: "objective", glory: 1, rule: "Score this in an end phase if a friendly fighter holds treasure token 3 or 4.", image: "/cards/emberstone-sentinel/ES8.webp" },
      { id: "ES9", name: "Hold Treasure Token 5", type: "objective", glory: 1, rule: "Score this in an end phase if a friendly fighter holds treasure token 5.", image: "/cards/emberstone-sentinel/ES9.webp" },
      { id: "ES10", name: "Slow Advance", type: "objective", glory: 2, rule: "Score this in an end phase if your warband holds any treasure tokens in both neutral territory and enemy territory.", image: "/cards/emberstone-sentinel/ES10.webp" },
      { id: "ES11", name: "Iron Grasp", type: "objective", glory: 2, rule: "Score this in an end phase if your warband holds all of the treasure tokens in a friendly and/or enemy territory.", image: "/cards/emberstone-sentinel/ES11.webp" },
      { id: "ES12", name: "Supremacy", type: "objective", glory: 3, rule: "Score this in an end phase if 2 or more friendly fighters with a total Bounty characteristic of 3 or more hold treasure tokens.", image: "/cards/emberstone-sentinel/ES12.webp" },
      { id: "ES13", name: "Switch Things Up", type: "gambit", ploy: true, rule: "Pick 2 treasure tokens. Swap the positions of those treasure tokens.", image: "/cards/emberstone-sentinel/ES13.webp" },
      { id: "ES14", name: "Sidestep", type: "gambit", ploy: true, rule: "Pick a friendly fighter. Push that fighter 1 hex.", image: "/cards/emberstone-sentinel/ES14.webp" },
      { id: "ES15", name: "The Extra Mile", type: "gambit", ploy: true, rule: "Play this immediately after a friendly fighter Moves. Push that fighter 1 hex. That push must end on a feature token.", image: "/cards/emberstone-sentinel/ES15.webp" },
      { id: "ES16", name: "Settle In", type: "gambit", ploy: true, rule: "Pick a friendly fighter on a feature token. Give that fighter a Guard token.", image: "/cards/emberstone-sentinel/ES16.webp" },
      { id: "ES17", name: "Healing Potion", type: "gambit", ploy: true, rule: "Pick a friendly fighter. Heal that fighter. If you are the **underdog**, you can roll a Save dice. On a :dfBlock: or :dfCrit:, heal that fighter again.", image: "/cards/emberstone-sentinel/ES17.webp" },
      { id: "ES18", name: "Hidden Paths", type: "gambit", ploy: true, rule: "Pick a friendly fighter in an edge hex. Remove that fighter from the battlefield, and then place that fighter in a different empty edge hex. Then, give that fighter a Move token, unless you are the **underdog**.", image: "/cards/emberstone-sentinel/ES18.webp" },
      { id: "ES19", name: "Confusion", type: "gambit", ploy: true, rule: "Pick 2 adjacent fighters. Remove those fighters from the battlefield and then place each in the hex the other was removed from.", image: "/cards/emberstone-sentinel/ES19.webp" },
      { id: "ES20", name: "Hold the Line!", type: "gambit", ploy: true, rule: "Fighters cannot be driven back. This effect persists until the end of the next Action step.", image: "/cards/emberstone-sentinel/ES20.webp" },
      { id: "ES21", name: "Shoulder Throw", type: "gambit", ploy: true, rule: "Play this immediately after a friendly fighter's successful Attack if the target is adjacent. Remove the target from the battlefield, and then place them in a different empty hex adjacent to the attacker.", image: "/cards/emberstone-sentinel/ES21.webp" },
      { id: "ES22", name: "By the Numbers", type: "gambit", ploy: true, rule: "Draw a number of Power cards equal to the number of treasure tokens held by your warband.", image: "/cards/emberstone-sentinel/ES22.webp" },
      { id: "ES23", name: "Stubborn to the End", type: "upgrade", glory: 1, rule: "If this fighter is the target of an Attack, the attacker cannot use Overrun.", image: "/cards/emberstone-sentinel/ES23.webp" },
      { id: "ES24", name: "Inviolate", type: "upgrade", glory: 1, rule: "This fighter cannot be Flanked or Surrounded while they hold a treasure token.", image: "/cards/emberstone-sentinel/ES24.webp" },
      { id: "ES25", name: "Great Speed", type: "upgrade", rule: "This fighter has +1 Move.", image: "/cards/emberstone-sentinel/ES25.webp" },
      { id: "ES26", name: "Sharp Reflexes", type: "upgrade", glory: 2, rule: "This fighter has +1 Save, to a maximum of 2.", image: "/cards/emberstone-sentinel/ES26.webp" },
      { id: "ES27", name: "Brute Momentum", type: "upgrade", glory: 1, rule: "This fighter cannot be driven back while they have any Charge tokens.", image: "/cards/emberstone-sentinel/ES27.webp" },
      { id: "ES28", name: "Agile", type: "upgrade", glory: 2, rule: "**Deft:** After you make a Save roll for this fighter, you can immediately re-roll 1 Save dice in that Save roll.", image: "/cards/emberstone-sentinel/ES28.webp" },
      { id: "ES29", name: "Duellist", type: "upgrade", glory: 1, rule: "**Footwork:** Immediately after this fighter has Attacked, you can push this fighter 1 hex.", image: "/cards/emberstone-sentinel/ES29.webp" },
      { id: "ES30", name: "Great Fortitude", type: "upgrade", glory: 2, rule: "This fighter has +1 Health.", image: "/cards/emberstone-sentinel/ES30.webp" },
      { id: "ES31", name: "Keen Eye", type: "upgrade", glory: 2, rule: "This fighter's melee weapons have +1 Attack dice.", image: "/cards/emberstone-sentinel/ES31.webp" },
      { id: "ES32", name: "Great Strength", type: "upgrade", glory: 2, rule: "This fighter's melee weapons have **Grievous**.", image: "/cards/emberstone-sentinel/ES32.webp" },
    ]
  },
  {
    id: "pillage-and-plunder",
    name: "Pillage and Plunder",
    cards: [
      { id: "PL1", name: "Broken Prospects", type: "objective", glory: 2, rule: "Score this in an end phase if 3 or more different treasure tokens were Delved by your warband this battle round or if a treasure token held by an enemy fighter at the start of the battle round was Delved by your warband this battle round.", image: "/cards/pillage-and-plunder/PL1.webp" },
      { id: "PL2", name: "Against the Odds", type: "objective", glory: 1, rule: "Score this in an end phase if an odd-numbered treasure token was Delved by your warband this battle round.", image: "/cards/pillage-and-plunder/PL2.webp" },
      { id: "PL3", name: "Lost in the Depths", type: "objective", glory: 1, rule: "Score this in an end phase if no friendly fighters are adjacent and any friendly fighters are not slain.", image: "/cards/pillage-and-plunder/PL3.webp" },
      { id: "PL4", name: "Desolate Homeland", type: "objective", glory: 1, rule: "Score this in an end phase if there are 1 or fewer treasure tokens in friendly territory.", image: "/cards/pillage-and-plunder/PL4.webp" },
      { id: "PL5", name: "Torn Landscape", type: "objective", glory: 2, rule: "Score this in an end phase if there are 2 or fewer treasure tokens on the battlefield.", image: "/cards/pillage-and-plunder/PL5.webp" },
      { id: "PL6", name: "Strip the Realm", type: "objective", glory: 3, rule: "Score this in an end phase if there are no treasure tokens on the battlefield or if no enemy fighters hold any treasure tokens.", image: "/cards/pillage-and-plunder/PL6.webp" },
      { id: "PL7", name: "Aggressive Claimant", type: "objective", glory: 1, surge: true, rule: "Score this immediately after a friendly fighter's successful Attack if the target was in neutral territory, or the target was holding a treasure token when you picked them to be the target of that Attack and is no longer holding that treasure token.", image: "/cards/pillage-and-plunder/PL7.webp" },
      { id: "PL8", name: "Claim the Prize", type: "objective", glory: 1, surge: true, rule: "Score this immediately after a friendly fighter Delves in enemy territory. If you are the **underdog**, that Delve can be in friendly territory instead.", image: "/cards/pillage-and-plunder/PL8.webp" },
      { id: "PL9", name: "Delving for Wealth", type: "objective", glory: 1, surge: true, rule: "Score this immediately after your warband Delves for the third or subsequent time this combat phase.", image: "/cards/pillage-and-plunder/PL9.webp" },
      { id: "PL10", name: "Share the Load", type: "objective", glory: 1, surge: true, rule: "Score this immediately after a friendly fighter Moves, if that fighter and any other friendly fighters are each on feature tokens.", image: "/cards/pillage-and-plunder/PL10.webp" },
      { id: "PL11", name: "Hostile Takeover", type: "objective", glory: 1, surge: true, rule: "Score this immediately after the second or subsequent Attack made by your warband that was not part of a Charge.", image: "/cards/pillage-and-plunder/PL11.webp" },
      { id: "PL12", name: "Careful Survey", type: "objective", glory: 1, surge: true, rule: "Score this immediately after an Action step if there is a friendly fighter in each territory.", image: "/cards/pillage-and-plunder/PL12.webp" },
      { id: "PL13", name: "Sidestep", type: "gambit", ploy: true, rule: "Pick a friendly fighter. Push that fighter 1 hex.", image: "/cards/pillage-and-plunder/PL13.webp" },
      { id: "PL14", name: "Prideful Duellist", type: "gambit", ploy: true, rule: "Play this immediately after a friendly fighter's Attack if the attacker is in enemy territory. Heal the attacker.", image: "/cards/pillage-and-plunder/PL14.webp" },
      { id: "PL15", name: "Commanding Stride", type: "gambit", ploy: true, rule: "Push your **leader** up to 3 hexes. That push must end in a starting hex.", image: "/cards/pillage-and-plunder/PL15.webp" },
      { id: "PL16", name: "Crumbling Mine", type: "gambit", ploy: true, rule: "Pick a treasure token that is not held. Flip that treasure token.", image: "/cards/pillage-and-plunder/PL16.webp" },
      { id: "PL17", name: "Explosive Charges", type: "gambit", ploy: true, rule: "**Domain:** Friendly fighters have +1 Move while using Charge abilities. This effect persists until the end of the battle round or until another Domain card is played.", image: "/cards/pillage-and-plunder/PL17.webp" },
      { id: "PL18", name: "Wary Delver", type: "gambit", ploy: true, rule: "Pick a friendly fighter with any Charge tokens. Give that fighter a Guard token.", image: "/cards/pillage-and-plunder/PL18.webp" },
      { id: "PL19", name: "Brash Scout", type: "gambit", ploy: true, rule: "Play this immediately after you make an Attack roll for a fighter in enemy territory. Re-roll 1 dice in that Attack roll. If you are the **underdog**, you can re-roll each dice in that Attack roll instead.", image: "/cards/pillage-and-plunder/PL19.webp" },
      { id: "PL20", name: "Sudden Blast", type: "gambit", ploy: true, rule: "Pick an enemy fighter adjacent to a friendly fighter. Give that enemy fighter a Stagger token.", image: "/cards/pillage-and-plunder/PL20.webp" },
      { id: "PL21", name: "Tunnelling Terror", type: "gambit", ploy: true, rule: "Pick a friendly fighter with no Move or Charge tokens. Remove that fighter from the battlefield, and then place that fighter in an empty stagger hex. Then, give that fighter a Charge token. If you are the **underdog**, you can give that fighter a Move token instead.", image: "/cards/pillage-and-plunder/PL21.webp" },
      { id: "PL22", name: "Trapped Cache", type: "gambit", ploy: true, rule: "Pick an undamaged enemy fighter within 1 hex of a treasure token. Inflict 1 damage on that fighter.", image: "/cards/pillage-and-plunder/PL22.webp" },
      { id: "PL23", name: "Great Speed", type: "upgrade", rule: "This fighter have +1 Move.", image: "/cards/pillage-and-plunder/PL23.webp" },
      { id: "PL24", name: "Swift Step", type: "upgrade", glory: 1, rule: "**Quick:** Immediately after this fighter has Charged, you can push this fighter 1 hex.", image: "/cards/pillage-and-plunder/PL24.webp" },
      { id: "PL25", name: "Burrowing Strike", type: "upgrade", glory: 1, rule: "**Melee Attack action** \\n [:Hex: 2 - :atFury: 2 - :boom: 2] \\n This weapon has +1 Attack dice while this fighter has any Stagger tokens or is on a feature token.", image: "/cards/pillage-and-plunder/PL25.webp" },
      { id: "PL26", name: "Tough Enough", type: "upgrade", glory: 1, rule: "While this fighter is in enemy territory, Save rolls for this fighter cannot be affected by **Cleave** and **Ensnare**.", image: "/cards/pillage-and-plunder/PL26.webp" },
      { id: "PL27", name: "Canny Sapper", type: "upgrade", rule: "**Sneaky:** Immediately after you play a Ploy in a Power step, you can remove this fighter from the battlefield. Place this fighter in an empty stagger hex or in an empty starting hex in friendly territory, and then discard this card.", image: "/cards/pillage-and-plunder/PL27.webp" },
      { id: "PL28", name: "Impossibly Quick", type: "upgrade", glory: 1, rule: "This fighter has +1 Save. \\n Immediately discard this Upgrade after an enemy fighter's failed Attack if this fighter was the target.", image: "/cards/pillage-and-plunder/PL28.webp" },
      { id: "PL29", name: "Linebreaker", type: "upgrade", glory: 1, rule: "This fighter's weapons have **Brutal**.", image: "/cards/pillage-and-plunder/PL29.webp" },
      { id: "PL30", name: "Excavating Blast", type: "upgrade", glory: 1, rule: "**Ranged Attack action** \\n [:Hex: 3 - :atSmash: 2 - :boom: 1] \\n This weapon has **Stagger** while this fighter is in enemy territory.", image: "/cards/pillage-and-plunder/PL30.webp" },
      { id: "PL31", name: "Gloryseeker", type: "upgrade", glory: 1, rule: "This fighter's melee weapons have **Grievous** if the target has a Health characteristic of 4 or more.", image: "/cards/pillage-and-plunder/PL31.webp" },
      { id: "PL32", name: "Frenzy of Greed", type: "upgrade", glory: 2, rule: "While this fighter is on a treasure token in enemy territory or is in a stagger hex, Save rolls for this fighter are not affected by **Cleave** and **Ensnare** and this fighter cannot be given Stagger tokens.", image: "/cards/pillage-and-plunder/PL32.webp" },
    ]
  },
  {
    id: "countdown-to-cataclysm",
    name: "Countdown to Cataclysm",
    cards: [
      { id: "CC1", name: "Spread Havoc", type: "objective", rule: "Score this in an end phase. Gain a number of Glory points equal to your Cataclysm value, to a maximum of 2.", image: "/cards/countdown-to-cataclysm/CC1.webp" },
      { id: "CC2", name: "Hounds of War", type: "objective", glory: 1, rule: "Score this in an end phase if 2 or more enemy fighters are slain and/or damaged and any of those fighters were slain in the preceding combat phase.", image: "/cards/countdown-to-cataclysm/CC2.webp" },
      { id: "CC3", name: "Set Explosives", type: "objective", glory: 2, rule: "Score this in an end phase if your warband holds 2 or more treasure tokens and holds all of the treasure tokens in any territories.", image: "/cards/countdown-to-cataclysm/CC3.webp" },
      { id: "CC4", name: "Wreckers", type: "objective", glory: 2, rule: "Score this in an end phase if the number of damaged and/or slain enemy fighters is greater than your Cataclysm value.", image: "/cards/countdown-to-cataclysm/CC4.webp" },
      { id: "CC5", name: "Uneven Contest", type: "objective", glory: 2, rule: "Score this in an end phase if your warband holds each odd-numbered treasure token.", image: "/cards/countdown-to-cataclysm/CC5.webp" },
      { id: "CC6", name: "Loaded for Bear", type: "objective", glory: 1, rule: "Score this in an end phase if any friendly fighters are each equipped with 3 or more Upgrades.", image: "/cards/countdown-to-cataclysm/CC6.webp" },
      { id: "CC7", name: "Collateral Damage", type: "objective", glory: 1, surge: true, rule: "Score this immediately after you advance your Cataclysm tracker 1 step as a result of a friendly fighter being slain. If you are the **underdog**, score this after you advance your Cataclysm tracker 1 step for any reason instead.", image: "/cards/countdown-to-cataclysm/CC7.webp" },
      { id: "CC8", name: "Too Close for Comfort", type: "objective", glory: 1, surge: true, rule: "Score this immediately after your opponent's Power step if each friendly fighter is within 2 hexes of any enemy fighters.", image: "/cards/countdown-to-cataclysm/CC8.webp" },
      { id: "CC9", name: "Shocking Assault", type: "objective", glory: 1, surge: true, rule: "Score this immediately after your opponent's Action step if your warband holds all of the treasure tokens in neutral territory.", image: "/cards/countdown-to-cataclysm/CC9.webp" },
      { id: "CC10", name: "Nowhere to Run", type: "objective", glory: 1, surge: true, rule: "Score this immediately after an Action step if all friendly fighters have Move and/or Charge tokens and there is a friendly fighter in each territory.", image: "/cards/countdown-to-cataclysm/CC10.webp" },
      { id: "CC11", name: "The Perfect Cut", type: "objective", glory: 1, surge: true, rule: "Score this immediately after a friendly fighter's successful melee Attack if no result in the target's Save roll was a success.", image: "/cards/countdown-to-cataclysm/CC11.webp" },
      { id: "CC12", name: "Overwhelming Force", type: "objective", glory: 1, surge: true, rule: "Score this immediately after a friendly fighter's successful melee Attack if the Attack roll contained 4 or more dice.", image: "/cards/countdown-to-cataclysm/CC12.webp" },
      { id: "CC13", name: "Savage Blow", type: "gambit", ploy: true, rule: "Play this immediately after you pick a weapon as part of an Attack. Rolls of :atSup2: count as successes for that Attack.", image: "/cards/countdown-to-cataclysm/CC13.webp" },
      { id: "CC14", name: "The End is Nigh", type: "gambit", ploy: true, rule: "**Domain:** After each Action step, the player whose turn it is rolls a number of Attack dice equal to their Cataclysm value, or 1 Attack dice if they have no such value. \\n If the roll contains any :atFury: or :atCrit:, their opponent must discard a Power card. This effect persists until the end of the battle round, until another Domain card is played, or until you advance your Cataclysm tracker.", image: "/cards/countdown-to-cataclysm/CC14.webp" },
      { id: "CC15", name: "Growing Concerns", type: "gambit", ploy: true, rule: "Enemy fighters have -X Move in the next Action step, where X is your Cataclysm value.", image: "/cards/countdown-to-cataclysm/CC15.webp" },
      { id: "CC16", name: "Total Collapse", type: "gambit", ploy: true, rule: "Roll a number of Attack dice equal to your Cataclysm value. If the roll contains :atFury: or :atCrit:, pick a fighter. \\n Inflict 1 damage on that fighter. If you picked a friendly fighter, you can inflict damage on that fighter up to your Cataclysm value instead.", image: "/cards/countdown-to-cataclysm/CC16.webp" },
      { id: "CC17", name: "Violent Blast", type: "gambit", ploy: true, rule: "Pick a stagger hex. Push each fighter within 1 hex of that stagger hex 1 hex.", image: "/cards/countdown-to-cataclysm/CC17.webp" },
      { id: "CC18", name: "Sunder the Realm", type: "gambit", ploy: true, rule: "Roll a number of Attack dice equal to your Cataclysm value for each fighter within 1 hex of neutral territory. \\n If the roll contains any :atSmash: or :atCrit:, inflict 1 damage on that fighter.", image: "/cards/countdown-to-cataclysm/CC18.webp" },
      { id: "CC19", name: "Raging Tremors", type: "gambit", ploy: true, rule: "Pick a number of enemy fighters up to your Cataclysm value. Give each of those fighters a Stagger token.", image: "/cards/countdown-to-cataclysm/CC19.webp" },
      { id: "CC20", name: "Counter-charge", type: "gambit", ploy: true, rule: "Play this immediately after a friendly fighter is picked to be the target of an Attack. Pick another friendly fighter. Push that fighter up to 3 hexes. That push must end adjacent to the attacker.", image: "/cards/countdown-to-cataclysm/CC20.webp" },
      { id: "CC21", name: "Do or Die", type: "gambit", ploy: true, rule: "Pick a friendly fighter. Inspire that fighter. This effect persists for X Action steps where X is your Cataclysm value. After that effect ends, do not discard this card. Instead, Uninspire that fighter. That fighter cannot be Inspired again. This effect persists until the end of the game.", image: "/cards/countdown-to-cataclysm/CC21.webp" },
      { id: "CC22", name: "Improvised Attack", type: "gambit", ploy: true, rule: "Pick a friendly fighter. That fighter immediately Attacks with the following weapon, where X is your Cataclysm value. \\n **Ranged Attack action** \\n [:Hex: 3 - :atSmash: X - :boom: 1] \\n This weapon cannot be modified.", image: "/cards/countdown-to-cataclysm/CC22.webp" },
      { id: "CC23", name: "Bringer of Doom", type: "upgrade", glory: 1, rule: "**Tick Tock:** After this card is discarded during a Combat Phase, you can immediately advance your Cataclysm tracker 1 step.", image: "/cards/countdown-to-cataclysm/CC23.webp" },
      { id: "CC24", name: "Visions of Ruin", type: "upgrade", glory: 1, rule: "This fighter has +X Move, where X is your cataclysm value. \\n Immediately after this fighter Moves, give this fighter a Stagger token.", image: "/cards/countdown-to-cataclysm/CC24.webp" },
      { id: "CC25", name: "Extinction's Edge", type: "upgrade", glory: 1, rule: "**Ever Closer:** Immediately advance your Cataclysm tracker 1 step after an enemy fighter is slain by this fighter. Then, if your Cataclysm value is 2 or greater, discard this card.", image: "/cards/countdown-to-cataclysm/CC25.webp" },
      { id: "CC26", name: "Driven by Pain", type: "upgrade", glory: 1, rule: "**Insensate:** Immediately after this fighter is driven back, you can heal this fighter.", image: "/cards/countdown-to-cataclysm/CC26.webp" },
      { id: "CC27", name: "Inescapable Grasp", type: "upgrade", glory: 1, rule: "This fighter's melee weapons have **Ensnare**.", image: "/cards/countdown-to-cataclysm/CC27.webp" },
      { id: "CC28", name: "Utter Conviction", type: "upgrade", glory: 1, rule: "This fighter's Save characteristic is X, where X is your Cataclysm value, and cannot be modified further. \\n This fighter cannot use Critical Weapon abilities.", image: "/cards/countdown-to-cataclysm/CC28.webp" },
      { id: "CC29", name: "Burnt Out", type: "upgrade", glory: 1, rule: "**Smoulder:** Pick a friendly fighter. Give that fighter a Stagger token. Then, draw 2 Power cards. If you are the **underdog**, draw 3 Power cards instead.", image: "/cards/countdown-to-cataclysm/CC29.webp" },
      { id: "CC30", name: "Great Fortitude", type: "upgrade", glory: 2, rule: "This fighter has +1 Health.", image: "/cards/countdown-to-cataclysm/CC30.webp" },
      { id: "CC31", name: "Hurled Weapon", type: "upgrade", glory: 1, rule: "**Ranged Attack action** \\n [:Hex: 3 - :atSmash: 2 - :boom: 1 -(:atCrit: **Cleave**)-]", image: "/cards/countdown-to-cataclysm/CC31.webp" },
      { id: "CC32", name: "Desperate Rage", type: "upgrade", glory: 1, rule: "**Melee Attack action** \\n [:Hex: 1 - :atSmash: 2 - :boom: 3] \\n Immediately after this fighter has Attacked with this weapon, inflict 1 damage on this fighter.", image: "/cards/countdown-to-cataclysm/CC32.webp" },
    ]
  },
];

export function getRivalsDeck(deckId: string | null | undefined) {
  return rivalsDecks.find((deck) => deck.id === deckId) ?? null;
}
