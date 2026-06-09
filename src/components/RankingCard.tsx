type RankingCardProps = {
  rankText: string;
  displayName: string;
  warband: string;
  scoreText: string;
  title: string;
  progressPercent: number;
};

export default function RankingCard({
  rankText,
  displayName,
  warband,
  scoreText,
  title,
  progressPercent
}: RankingCardProps) {
  return (
    <article className="ranking-card">
      <div className="rank-badge">{rankText}</div>
      <div className="ranking-main">
        <h2>{displayName}</h2>
        <p>{warband}</p>
        <div className="progress-track compact">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      <div className="ranking-score">
        <strong>{scoreText}</strong>
        <span>{title}</span>
      </div>
    </article>
  );
}
