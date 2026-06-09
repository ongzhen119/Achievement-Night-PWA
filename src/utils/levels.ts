export type LevelBand = {
  min: number;
  max: number;
  titleKey: string;
};

export const levelBands: LevelBand[] = [
  {
    min: 0,
    max: 4,
    titleKey: "level.arenaInitiate"
  },
  {
    min: 5,
    max: 8,
    titleKey: "level.risingChallenger"
  },
  {
    min: 9,
    max: 12,
    titleKey: "level.gloryHunter"
  },
  {
    min: 13,
    max: 16,
    titleKey: "level.tonightsLegend"
  }
];

export function getLevelTitleKey(score: number) {
  return (
    levelBands.find((band) => score >= band.min && score <= band.max)
      ?.titleKey ?? "level.tonightsLegend"
  );
}

export function getProgressPercent(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((score / maxScore) * 100));
}
