import { ChevronDown } from "lucide-react";
import { cx } from "../../theme/styles";

interface SelectOption<T extends string> {
  key: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  label: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/** Native Auswahl im Glas-Look (gut bedienbar am Handy). */
export function Select<T extends string>({ value, options, onChange, label, id, disabled, className }: SelectProps<T>) {
  return (
    <span className={cx("relative inline-flex", className)}>
      <select
        id={id}
        aria-label={id ? undefined : label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(options.find((o) => o.key === event.target.value)?.key ?? value)}
        className="w-full appearance-none rounded-full border border-(--d6-line) bg-(--d6-field) py-1.5 pl-3.5 pr-8 text-sm text-(--d6-text) outline-none transition focus:border-(--d6-accent) focus:shadow-[0_0_0_4px_var(--d6-accent-soft)] disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-(--d6-muted)" />
    </span>
  );
}
