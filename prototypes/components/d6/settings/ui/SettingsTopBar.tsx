import { ChevronLeft } from "lucide-react";
import { SETTINGS_PAGES, groupOf, routeKey, type SettingsRoute } from "../routes";
import { GLASS, cx } from "../../theme/styles";

interface SettingsTopBarProps {
  stack: SettingsRoute[];
  /** Titel der aktuellen Seite (z. B. Name des Mitglieds) */
  title: string;
  onBack: () => void;
  onCrumb: (depth: number) => void;
}

/** Zurück-Knopf plus Brotkrumen „Einstellungen › Haushalt › Mitglieder“; die Gruppe steht direkt nach der Wurzel. */
export function SettingsTopBar({ stack, title, onBack, onCrumb }: SettingsTopBarProps) {
  const current = stack[stack.length - 1];
  const group = current.page === "root" ? null : groupOf(current.page);
  const parents = stack.slice(0, -1);

  return (
    <div data-tile className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label={parents.length > 0 ? "Zurück" : "Einstellungen schließen"}
        className={cx(GLASS, "grid size-10 shrink-0 place-items-center rounded-full transition active:scale-90")}
      >
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-0">
        <nav aria-label="Brotkrumen" className="flex min-w-0 flex-wrap items-center gap-x-1 text-xs text-(--d6-subtle)">
          {parents.map((route, depth) => (
            <span key={routeKey(route)} className="inline-flex items-center gap-1">
              <button type="button" onClick={() => onCrumb(depth)} className="hover:text-(--d6-accent-text)">
                {SETTINGS_PAGES[route.page].title}
              </button>
              ›{depth === 0 && group && <span>{group} ›</span>}
            </span>
          ))}
        </nav>
        <h2 className="truncate text-lg font-semibold leading-tight">{title}</h2>
      </div>
    </div>
  );
}
