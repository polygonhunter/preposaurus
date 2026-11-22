import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useSettingsContext } from "../state/context";

interface SettingsPageFrameProps {
  intro?: ReactNode;
  children: ReactNode;
}

/**
 * Inhalt einer Unterseite: kurze Einleitung, Lese-Hinweis und die Gruppen.
 * Mitglieder sehen Admin-Bereiche nur lesend: das `fieldset` sperrt alle Steuerelemente.
 */
export function SettingsPageFrame({ intro, children }: SettingsPageFrameProps) {
  const { readOnly } = useSettingsContext();
  return (
    <div className="space-y-5">
      {intro && <p data-tile className="px-1 text-sm leading-relaxed text-(--d6-muted)">{intro}</p>}
      {readOnly && (
        <p data-tile className="flex items-center gap-2 rounded-2xl bg-(--d6-track) px-3 py-2 text-xs text-(--d6-muted)">
          <Lock aria-hidden className="size-3.5 shrink-0" /> Nur Admins können das ändern. Du siehst die aktuellen Werte.
        </p>
      )}
      <fieldset disabled={readOnly} className="min-w-0 space-y-5">
        {children}
      </fieldset>
    </div>
  );
}
