import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Info,
  ShieldCheck
} from "lucide-react";
import { getQuickStartItemKey } from "../data/quickStartGuide";

type QuickStartStepCardProps = {
  checklistItems: string[];
  checklistLabel: string;
  completeLabel: string;
  completedItemKeys: ReadonlySet<string>;
  details: string[];
  expanded: boolean;
  hideDetailsLabel: string;
  isComplete: boolean;
  onToggleDetails: () => void;
  onToggleItem: (itemKey: string) => void;
  reminders: string[];
  reminderLabel: string;
  showDetailsLabel: string;
  stepId: string;
  stepLabel: string;
  summary: string;
  title: string;
  warningLabel: string;
  warningNotes: string[];
};

export default function QuickStartStepCard({
  checklistItems,
  checklistLabel,
  completeLabel,
  completedItemKeys,
  details,
  expanded,
  hideDetailsLabel,
  isComplete,
  onToggleDetails,
  onToggleItem,
  reminders,
  reminderLabel,
  showDetailsLabel,
  stepId,
  stepLabel,
  summary,
  title,
  warningLabel,
  warningNotes
}: QuickStartStepCardProps) {
  const hasExtraContent =
    details.length > 0 || reminders.length > 0 || warningNotes.length > 0;

  return (
    <section className={`quick-step-card ${isComplete ? "complete" : ""}`}>
      <div className="quick-step-header">
        <div>
          <p className="eyebrow">{stepLabel}</p>
          <h2>{title}</h2>
          <p className="muted">{summary}</p>
        </div>
        {isComplete ? (
          <span className="quick-step-state">
            <CheckCircle2 size={16} aria-hidden="true" />
            {completeLabel}
          </span>
        ) : null}
      </div>

      <div className="quick-checklist" aria-label={checklistLabel}>
        {checklistItems.map((item, index) => {
          const itemKey = getQuickStartItemKey(stepId, index);

          return (
            <label className="quick-check-item" key={itemKey}>
              <input
                checked={completedItemKeys.has(itemKey)}
                onChange={() => onToggleItem(itemKey)}
                type="checkbox"
              />
              <span>{item}</span>
            </label>
          );
        })}
      </div>

      {hasExtraContent ? (
        <button
          aria-expanded={expanded}
          className="quick-details-toggle"
          onClick={onToggleDetails}
          type="button"
        >
          <ChevronDown
            className={expanded ? "expanded" : ""}
            size={18}
            aria-hidden="true"
          />
          <span>{expanded ? hideDetailsLabel : showDetailsLabel}</span>
        </button>
      ) : null}

      {expanded && hasExtraContent ? (
        <div className="quick-extra-content">
          {details.length > 0 ? (
            <ul className="quick-detail-list">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}

          {reminders.length > 0 ? (
            <div className="quick-note-list">
              {reminders.map((reminder) => (
                <div className="quick-note" key={reminder}>
                  <Info size={16} aria-hidden="true" />
                  <div>
                    <strong>{reminderLabel}</strong>
                    <p>{reminder}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {warningNotes.length > 0 ? (
            <div className="quick-warning-block">
              <div className="quick-warning-title">
                <CircleAlert size={16} aria-hidden="true" />
                <strong>{warningLabel}</strong>
              </div>
              <div className="quick-warning-chips">
                {warningNotes.map((warning) => (
                  <span key={warning}>
                    <ShieldCheck size={14} aria-hidden="true" />
                    {warning}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
