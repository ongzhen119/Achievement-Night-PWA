type PlayerHeaderProps = {
  displayName: string;
  warband: string;
  scoreText: string;
  titleLabel: string;
  title: string;
  warbandLabel: string;
  scoreLabel: string;
  progressPercent: number;
};

export default function PlayerHeader({
  displayName,
  warband,
  scoreText,
  titleLabel,
  title,
  warbandLabel,
  scoreLabel,
  progressPercent
}: PlayerHeaderProps) {
  return (
    <section className="player-header panel">
      <div>
        <p className="eyebrow">{warbandLabel}</p>
        <h1>{displayName}</h1>
        <p className="muted">{warband}</p>
      </div>
      <div className="player-stat-grid">
        <div>
          <span>{scoreLabel}</span>
          <strong>{scoreText}</strong>
        </div>
        <div>
          <span>{titleLabel}</span>
          <strong>{title}</strong>
        </div>
      </div>
      <div className="progress-track">
        <span style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  );
}
