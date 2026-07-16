import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/useLanguage";

interface PlaymatModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/** Shared bottom-sheet style overlay for all playmat dialogs. */
export default function PlaymatModal({ title, onClose, children, wide }: PlaymatModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="playmat-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`playmat-sheet${wide ? " wide" : ""}`}>
        <div className="playmat-sheet-head">
          <h2>{title}</h2>
          <button
            aria-label={t("playmat.close")}
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="playmat-sheet-body">{children}</div>
      </div>
    </div>
  );
}
