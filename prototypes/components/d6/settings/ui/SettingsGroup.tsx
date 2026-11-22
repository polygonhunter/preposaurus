import type { ReactNode } from "react";
import { GLASS, LABEL, cx } from "../../theme/styles";

interface SettingsGroupProps {
  title?: string;
  /** ruhiger Hinweis unter der Gruppe */
  note?: ReactNode;
  children: ReactNode;
}

/** Gruppierte Glas-Liste wie in iOS-Einstellungen; Zeilen werden durch feine Linien getrennt. */
export function SettingsGroup({ title, note, children }: SettingsGroupProps) {
  return (
    <section data-tile className="space-y-1.5">
      {title && <h2 className={cx(LABEL, "px-4")}>{title}</h2>}
      <div className={cx(GLASS, "divide-y divide-(--d6-line) overflow-hidden rounded-[24px]")}>{children}</div>
      {note && <div className="px-4 text-[11px] leading-relaxed text-(--d6-subtle)">{note}</div>}
    </section>
  );
}
