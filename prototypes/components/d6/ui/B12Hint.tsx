import { Leaf } from "lucide-react";
import { cx } from "../theme/styles";

/** Freundlicher Merkzettel, sobald jemand vegan isst. */
export function B12Hint({ className }: { className?: string }) {
  return (
    <p className={cx("flex items-center gap-2 rounded-2xl bg-(--d6-accent-soft) px-3 py-2 text-xs text-(--d6-accent-text)", className)}>
      <Leaf aria-hidden className="size-3.5 shrink-0" />
      Vegan im Haushalt: Vitamin B12 mitdenken.
    </p>
  );
}
