import { RotateCcw, Trash2 } from "lucide-react";

type HostPlayerRowProps = {
  displayName: string;
  warband: string;
  scoreText: string;
  title: string;
  deleteLabel: string;
  resetLabel: string;
  onDelete: () => void;
  onReset: () => void;
};

export default function HostPlayerRow({
  displayName,
  warband,
  scoreText,
  title,
  deleteLabel,
  resetLabel,
  onDelete,
  onReset
}: HostPlayerRowProps) {
  return (
    <article className="host-player-row">
      <div>
        <h3>{displayName}</h3>
        <p>{warband}</p>
        <small>{title}</small>
      </div>
      <strong>{scoreText}</strong>
      <div className="row-actions">
        <button className="icon-button" onClick={onReset} type="button">
          <RotateCcw size={17} aria-hidden="true" />
          <span>{resetLabel}</span>
        </button>
        <button className="icon-button danger" onClick={onDelete} type="button">
          <Trash2 size={17} aria-hidden="true" />
          <span>{deleteLabel}</span>
        </button>
      </div>
    </article>
  );
}
