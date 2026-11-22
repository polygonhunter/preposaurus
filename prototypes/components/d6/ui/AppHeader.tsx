import { Settings } from "lucide-react";
import { GLASS, LABEL, MONO, cx } from "../theme/styles";

interface AppHeaderProps {
  title: string;
  today: string;
  settingsOpen: boolean;
  /** Übergibt das Zahnrad als Quelle für den Flip-Übergang. */
  onToggleSettings: (source: HTMLElement | null) => void;
}

/** Kopf: Marke mit Glow, Datum mit Live-Lämpchen, Screen-Titel und Zahnrad zu den Einstellungen. */
export function AppHeader({ title, today, settingsOpen, onToggleSettings }: AppHeaderProps) {
  const dateLabel = new Date(today).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

  return (
    <header className="mb-5 flex items-center justify-between gap-3 px-1">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-(--d6-accent)/40 bg-(--d6-accent-soft) font-(family-name:--d6-mono) text-sm font-semibold text-(--d6-accent-text) shadow-[0_0_20px_-6px_var(--d6-glow)]">
          PM
        </span>
        <div className="min-w-0">
          <p className={`${LABEL} flex items-center gap-1.5`}>
            <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-(--d6-surplus) shadow-[0_0_8px_var(--d6-surplus)]" />
            <span className={MONO}>{dateLabel}</span>
          </p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight md:text-[28px]">{title}</h1>
        </div>
      </div>
      <button
        type="button"
        data-flip-id="tile-einstellungen"
        aria-pressed={settingsOpen}
        aria-label={settingsOpen ? "Einstellungen schließen" : "Einstellungen öffnen"}
        title="Einstellungen"
        onClick={(event) => onToggleSettings(event.currentTarget)}
        className={cx(
          GLASS,
          "grid size-10 shrink-0 place-items-center rounded-full transition active:scale-90",
          settingsOpen ? "text-(--d6-accent-text) shadow-[0_0_18px_-4px_var(--d6-glow)]" : "text-(--d6-text)",
        )}
      >
        <Settings
          size={18}
          strokeWidth={1.8}
          className={cx("motion-safe:transition-transform motion-safe:duration-500", settingsOpen && "rotate-90")}
        />
      </button>
    </header>
  );
}
