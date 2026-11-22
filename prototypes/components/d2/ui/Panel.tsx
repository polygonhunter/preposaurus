import type { ReactNode } from "react";
import { LABEL, cx } from "../theme";

interface PanelProps {
  label?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Glasfreie, dunkle Instrumenten-Kachel mit feiner Kante und Beschriftung. */
export function Panel({ label, aside, className, children }: PanelProps) {
  return (
    <section
      data-reveal
      className={cx(
        "relative rounded-2xl border border-white/[0.07] bg-(--d2-panel)/90 p-4 backdrop-blur-sm",
        "transition-[border-color,box-shadow] duration-300 hover:border-(--d2-accent)/30",
        "hover:shadow-[0_0_32px_-12px_var(--d2-accent)]",
        className,
      )}
    >
      {(label || aside) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {label && <h2 className={LABEL}>{label}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}
