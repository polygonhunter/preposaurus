import { CATEGORIES } from "@/lib/categories";
import type { CategoryKey, Container, Product } from "@/lib/types";
import { CONTAINER_PLURAL } from "../format";
import { Chip } from "../ui/Chip";
import { LABEL } from "../theme";

export interface StockFilter {
  category: CategoryKey | null;
  container: Container | null;
}

interface StockFiltersProps {
  products: Product[];
  filter: StockFilter;
  onChange: (filter: StockFilter) => void;
}

const ROW = "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]";

/** Zwei Chip-Reihen: Warengruppe und Behälter (z. B. „Alle Dosen“). */
export function StockFilters({ products, filter, onChange }: StockFiltersProps) {
  const categories = CATEGORIES.filter((c) => products.some((p) => p.category === c.key));
  const containers = [...new Set(products.map((p) => p.container))];

  return (
    <div data-reveal className="grid gap-2">
      <p className={LABEL}>Warengruppe</p>
      <div className={ROW}>
        <Chip active={filter.category === null} onClick={() => onChange({ ...filter, category: null })}>
          Alle
        </Chip>
        {categories.map((c) => (
          <Chip key={c.key} active={filter.category === c.key} onClick={() => onChange({ ...filter, category: c.key })}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>
      <p className={LABEL}>Behälter</p>
      <div className={ROW}>
        <Chip active={filter.container === null} onClick={() => onChange({ ...filter, container: null })}>
          Alle Behälter
        </Chip>
        {containers.map((container) => (
          <Chip
            key={container}
            active={filter.container === container}
            onClick={() => onChange({ ...filter, container })}
          >
            Alle {CONTAINER_PLURAL[container]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function applyStockFilter(products: Product[], filter: StockFilter): Product[] {
  return products.filter(
    (p) =>
      (filter.category === null || p.category === filter.category) &&
      (filter.container === null || p.container === filter.container),
  );
}
