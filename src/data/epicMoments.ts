export type EpicMoment = {
  id: string;
  labelKey: string;
};

export const epicMoments: EpicMoment[] = [
  { id: "leader-defeated", labelKey: "battle.moment.leaderDefeated" },
  { id: "leader-survived", labelKey: "battle.moment.leaderSurvived" },
  { id: "double-crit", labelKey: "battle.moment.doubleCrit" },
  { id: "objective-focus", labelKey: "battle.moment.objectiveFocus" },
  { id: "high-glory", labelKey: "battle.moment.highGlory" },
  { id: "perfect-victory", labelKey: "battle.moment.perfect" },
];
