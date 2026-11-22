import { formatDate } from "@/lib/supply";
import { LABEL, MONO } from "./theme";

interface TopBarProps {
  today: string;
  screenTitle: string;
}

/** Kopfzeile: Marke, aktueller Bereich, Datum mit „Live“-Lämpchen. */
export function TopBar({ today, screenTitle }: TopBarProps) {
  return (
    <header className="flex items-center justify-between pt-5 pb-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl border border-(--d2-accent)/40 bg-(--d2-accent-soft) font-(family-name:--d2-mono) text-sm font-semibold text-(--d2-accent) shadow-[0_0_20px_-6px_var(--d2-accent)]">
          PM
        </span>
        <div>
          <p className={LABEL}>Preposaurus · Kontrollzentrum</p>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-50">{screenTitle}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-1">
        <span className="size-1.5 animate-pulse rounded-full bg-(--d2-surplus) shadow-[0_0_8px_var(--d2-surplus)]" />
        <span className={`${MONO} text-[11px] text-zinc-400`}>{formatDate(today)}</span>
      </div>
    </header>
  );
}
