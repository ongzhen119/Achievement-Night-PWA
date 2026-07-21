import { useMemo } from "react";
import { useLanguage } from "../../i18n/useLanguage";
import { formatText } from "../../utils/format";
import { describePlaymatEvent } from "../../utils/playmat/eventLog";
import { PlaymatEventRecord, PlaymatPlayerRecord } from "../../utils/playmat/types";
import PlaymatModal from "./PlaymatModal";

interface EventLogPanelProps {
  events: PlaymatEventRecord[];
  players: PlaymatPlayerRecord[];
  onClose: () => void;
}

/** Human-readable battle log built from the synced event stream. */
export default function EventLogPanel({ events, players, onClose }: EventLogPanelProps) {
  const { t } = useLanguage();

  const lines = useMemo(() => {
    return events
      .map((event: PlaymatEventRecord) => describePlaymatEvent(event, players))
      .filter((line): line is NonNullable<typeof line> => line !== null)
      .reverse();
  }, [events, players]);

  return (
    <PlaymatModal onClose={onClose} title={t("playmat.logTitle")}>
      {lines.length ? (
        <ul className="playmat-log">
          {lines.map((line) => (
            <li key={line.id}>
              <span className="log-time">
                {new Date(line.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
              <span>{formatText(t(line.key), line.values)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pile-empty">{t("playmat.logEmpty")}</p>
      )}
    </PlaymatModal>
  );
}
