import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cx } from "../../theme/styles";
import { Toggle } from "./Toggle";

interface RowBase {
  label: string;
  detail?: ReactNode;
  icon?: LucideIcon;
  /** Emoji statt Symbol, z. B. Piktogramm eines Mitglieds */
  emoji?: string;
}

type SettingsRowProps = RowBase &
  (
    | { kind: "nav"; onClick: () => void; value?: ReactNode }
    | { kind: "toggle"; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }
    | { kind: "value"; value?: ReactNode; children?: ReactNode }
  );

const ROW = "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left";

function Leading({ icon: Icon, emoji }: Pick<RowBase, "icon" | "emoji">) {
  if (emoji) {
    return (
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-(--d6-glass-strong) text-base ring-1 ring-(--d6-line)">
        {emoji}
      </span>
    );
  }
  if (!Icon) return null;
  return (
    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-xl bg-(--d6-accent-soft) text-(--d6-accent-text)">
      <Icon size={16} />
    </span>
  );
}

function RowText({ label, detail }: Pick<RowBase, "label" | "detail">) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-[15px] font-medium leading-snug">{label}</span>
      {detail && <span className="block text-xs leading-snug text-(--d6-subtle)">{detail}</span>}
    </span>
  );
}

/** Zeile einer Einstellungsgruppe: Navigation (Chevron), Schalter oder Wert/Steuerelement. */
export function SettingsRow(props: SettingsRowProps) {
  const head = (
    <>
      <Leading icon={props.icon} emoji={props.emoji} />
      <RowText label={props.label} detail={props.detail} />
    </>
  );

  if (props.kind === "nav") {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className={cx(ROW, "transition hover:bg-(--d6-track) active:bg-(--d6-track) disabled:hover:bg-transparent")}
      >
        {head}
        {props.value && <span className="max-w-[45%] truncate text-right text-sm text-(--d6-muted)">{props.value}</span>}
        <ChevronRight aria-hidden size={16} className="shrink-0 text-(--d6-subtle)" />
      </button>
    );
  }

  if (props.kind === "toggle") {
    return (
      <div className={ROW}>
        {head}
        <Toggle checked={props.checked} onChange={props.onChange} label={props.label} disabled={props.disabled} />
      </div>
    );
  }

  return (
    <div className={cx(ROW, "flex-wrap")}>
      {head}
      {props.value !== undefined && <span className="text-right text-sm text-(--d6-muted)">{props.value}</span>}
      {props.children}
    </div>
  );
}
