import type { ReactNode } from "react";
import { LABEL, cx } from "../theme";

/** Gemeinsamer Stil für Eingabefelder und Selects. */
export const FIELD =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-(--d2-accent)/70 focus:shadow-[0_0_18px_-6px_var(--d2-accent)]";

interface FieldLabelProps {
  as?: "span" | "legend";
  children: ReactNode;
}

export function FieldLabel({ as: Tag = "span", children }: FieldLabelProps) {
  return <Tag className={cx(LABEL, "mb-1 block")}>{children}</Tag>;
}

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Beschriftetes Formularfeld. */
export function Field({ label, children, className }: FieldProps) {
  return (
    <label className={cx("grid", className)}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </label>
  );
}
