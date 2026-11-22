import { cx } from "../../theme/styles";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** Schalter im Glas-Look; der Knopf gleitet nur, wenn Bewegung erwünscht ist. */
export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border p-0.5 motion-safe:transition-colors disabled:opacity-40",
        checked
          ? "border-(--d6-accent)/60 bg-(--d6-accent) shadow-[0_0_16px_-4px_var(--d6-glow)]"
          : "border-(--d6-line) bg-(--d6-track)",
      )}
    >
      <span
        aria-hidden
        className={cx(
          "size-[22px] rounded-full bg-white shadow-[0_2px_6px_-1px_rgb(0_0_0/0.35)] motion-safe:transition-transform motion-safe:duration-300",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
