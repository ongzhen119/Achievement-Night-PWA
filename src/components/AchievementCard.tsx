import { CheckCircle2, Circle, Sparkles } from "lucide-react";

type AchievementCardProps = {
  title: string;
  pointsText: string;
  completed: boolean;
  disabled: boolean;
  onToggle: () => void;
};

export default function AchievementCard({
  title,
  pointsText,
  completed,
  disabled,
  onToggle
}: AchievementCardProps) {
  return (
    <button
      aria-pressed={completed}
      className={`achievement-card ${completed ? "completed" : ""}`}
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      <span className="achievement-icon" aria-hidden="true">
        {completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
      </span>
      <span className="achievement-copy">
        <span>{title}</span>
        <small>{pointsText}</small>
      </span>
      {completed ? (
        <Sparkles className="achievement-glow" size={18} aria-hidden="true" />
      ) : null}
    </button>
  );
}
