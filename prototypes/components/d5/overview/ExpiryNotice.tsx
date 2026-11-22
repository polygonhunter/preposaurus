import { formatDate } from "@/lib/supply";
import { getCategory } from "@/lib/categories";
import { AmpelBadge } from "../ui/AmpelBadge";
import type { LiveSupply } from "../useLiveSupply";
import { CARD } from "../theme";

interface ExpiryNoticeProps {
  items: LiveSupply["expiringBeforeGoal"];
  goalDate: string;
}

/** Freundlicher Hinweis auf Packungen, die vor dem Zieldatum ablaufen. */
export function ExpiryNotice({ items, goalDate }: ExpiryNoticeProps) {
  if (items.length === 0) return null;
  return (
    <section data-pop className={`${CARD} p-4`}>
      <h2 className="font-[family-name:var(--font-d5-display)] text-xl font-extrabold">⏰ Läuft vor dem {formatDate(goalDate)} ab</h2>
      <p className="mb-3 text-sm font-semibold text-(--d5-muted)">
        {items.length} Packungen zählen am Zieldatum nicht mehr mit. Am besten bald aufbrauchen und nachkaufen.
      </p>
      <ul className="space-y-2">
        {items.map(({ product, unit, ampel }) => (
          <li key={unit.id} className="flex items-center justify-between gap-2 rounded-2xl bg-(--d5-soft) px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 font-extrabold">
              <span aria-hidden>{getCategory(product.category).emoji}</span>
              <span className="truncate">{product.name}</span>
            </span>
            <AmpelBadge ampel={ampel} detail={formatDate(unit.mhd)} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
