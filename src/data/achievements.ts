// Edit this file to customise achievement wording / sections.
// Use translation keys here, then edit the visible English and Chinese text in src/i18n/translations.ts.
export type AchievementSection = {
  id: string;
  titleKey: string;
};

export type AchievementDefinition = {
  id: string;
  sectionKey: string;
  titleKey: string;
  points: number;
};

export const achievementSections: AchievementSection[] = [
  {
    id: "first-steps",
    titleKey: "section.firstSteps"
  },
  {
    id: "battle-moments",
    titleKey: "section.battleMoments"
  },
  {
    id: "objective-play",
    titleKey: "section.objectivePlay"
  },
  {
    id: "glory-moments",
    titleKey: "section.gloryMoments"
  }
];

export const achievements: AchievementDefinition[] = [
  {
    id: "complete-first-game",
    sectionKey: "section.firstSteps",
    titleKey: "achievement.completeFirstGame",
    points: 1
  },
  {
    id: "successful-move-or-charge",
    sectionKey: "section.firstSteps",
    titleKey: "achievement.successfulMoveOrCharge",
    points: 1
  },
  {
    id: "play-power-card",
    sectionKey: "section.firstSteps",
    titleKey: "achievement.playPowerCard",
    points: 1
  },
  {
    id: "first-glory-point",
    sectionKey: "section.firstSteps",
    titleKey: "achievement.firstGloryPoint",
    points: 1
  },
  {
    id: "land-successful-attack",
    sectionKey: "section.battleMoments",
    titleKey: "achievement.landSuccessfulAttack",
    points: 1
  },
  {
    id: "roll-critical-success",
    sectionKey: "section.battleMoments",
    titleKey: "achievement.rollCriticalSuccess",
    points: 1
  },
  {
    id: "take-down-enemy",
    sectionKey: "section.battleMoments",
    titleKey: "achievement.takeDownEnemy",
    points: 1
  },
  {
    id: "leader-survives",
    sectionKey: "section.battleMoments",
    titleKey: "achievement.leaderSurvives",
    points: 1
  },
  {
    id: "score-one-objective",
    sectionKey: "section.objectivePlay",
    titleKey: "achievement.scoreOneObjective",
    points: 1
  },
  {
    id: "gain-three-glory",
    sectionKey: "section.objectivePlay",
    titleKey: "achievement.gainThreeGlory",
    points: 1
  },
  {
    id: "hold-objective-token",
    sectionKey: "section.objectivePlay",
    titleKey: "achievement.holdObjectiveToken",
    points: 1
  },
  {
    id: "score-two-objectives",
    sectionKey: "section.objectivePlay",
    titleKey: "achievement.scoreTwoObjectives",
    points: 1
  },
  {
    id: "comeback-story",
    sectionKey: "section.gloryMoments",
    titleKey: "achievement.comebackStory",
    points: 1
  },
  {
    id: "help-with-rule",
    sectionKey: "section.gloryMoments",
    titleKey: "achievement.helpWithRule",
    points: 1
  },
  {
    id: "table-reacts",
    sectionKey: "section.gloryMoments",
    titleKey: "achievement.tableReacts",
    points: 1
  },
  {
    id: "wants-next-time",
    sectionKey: "section.gloryMoments",
    titleKey: "achievement.wantsNextTime",
    points: 1
  }
];

export const maxAchievementScore = achievements.reduce(
  (total, achievement) => total + achievement.points,
  0
);

export const achievementPoints = new Map(
  achievements.map((achievement) => [achievement.id, achievement.points])
);
