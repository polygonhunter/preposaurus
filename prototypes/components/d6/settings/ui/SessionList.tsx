import { LogOut, MonitorSmartphone } from "lucide-react";
import type { Session } from "@/lib/settings-types";
import { formatDateTime } from "../labels";
import { SettingsGroup } from "./SettingsGroup";
import { SettingsRow } from "./SettingsRow";

interface SessionListProps {
  sessions: Session[];
  onEnd: (sessionId: string) => void;
}

/** Aktive Geräte/Sitzungen; „dieses Gerät“ lässt sich hier nicht beenden. */
export function SessionList({ sessions, onEnd }: SessionListProps) {
  return (
    <SettingsGroup title="Geräte & Sitzungen">
      {sessions.length === 0 && <SettingsRow kind="value" icon={MonitorSmartphone} label="Keine aktiven Sitzungen" />}
      {sessions.map((s) => (
        <SettingsRow
          key={s.id}
          kind="value"
          icon={MonitorSmartphone}
          label={s.device}
          detail={s.current ? "dieses Gerät · aktiv" : `zuletzt ${formatDateTime(s.lastActive)}`}
        >
          {!s.current && (
            <button
              type="button"
              onClick={() => onEnd(s.id)}
              className="inline-flex items-center gap-1 rounded-full border border-(--d6-line) px-3 py-1 text-xs font-medium text-(--d6-muted) transition hover:text-(--d6-accent-text) active:scale-95"
            >
              <LogOut aria-hidden className="size-3" /> Beenden
            </button>
          )}
        </SettingsRow>
      ))}
    </SettingsGroup>
  );
}
