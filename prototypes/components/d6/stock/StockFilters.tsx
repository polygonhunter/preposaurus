import { CATEGORIES } from "@/lib/categories";
import type { CategoryKey, Container, Product } from "@/lib/types";
import { CONTAINER_PLURAL } from "../data/format";
import { STOCK_VIEWS, type StockView } from "../data/stock-status";
import { LABEL, MONO } from "../theme/styles";
import { Chip } from "../ui/Controls";

export interface StockFilter {
  view: StockView;
  category: CategoryKey | null;
  container: Container | null;
}

interface StockFiltersProps {
  products: Product[];
  filter: StockFilter;
  counts: Record<StockView, number>;
  onChange: (filter: StockFilter) => void;
}

const ROW = "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]";

/** Drei Chip-Reihen: Status, Warengruppe und Behälter (z. B. „Alle Dosen“). */
export function StockFilters({ products, filter, counts, onChange }: StockFiltersProps) {
  const categories = CATEGORIES.filter((c) => products.some((p) => p.category === c.key));
  const containers = [...new Set(products.map((p) => p.container))];

  return (
    <div data-tile className="space-y-2">
      <p className={`${LABEL} px-1`}>Status</p>
      <div className={ROW}>
        {STOCK_VIEWS.map(({ key, label }) => (
          <Chip key={key} active={filter.view === key} onClick={() => onChange({ ...filter, view: key })}>
            {label} <span className={`${MONO} ml-0.5 opacity-70`}>{counts[key]}</span>
          </Chip>
        ))}
      </div>
      <p className={`${LABEL} px-1`}>Warengruppe</p>
      <div className={ROW}>
        <Chip active={filter.category === null} onClick={() => onChange({ ...filter, category: null })}>
          Alle Gruppen
        </Chip>
        {categories.map((c) => (
          <Chip key={c.key} active={filter.category === c.key} onClick={() => onChange({ ...filter, category: c.key })}>
            <span aria-hidden className="mr-1">{c.emoji}</span>
            {c.label}
          </Chip>
        ))}
      </div>
      <p className={`${LABEL} px-1`}>Behälter</p>
      <div className={ROW}>
        <Chip active={filter.container === null} onClick={() => onChange({ ...filter, container: null })}>
          Alle Behälter
        </Chip>
        {containers.map((container) => (
          <Chip key={container} active={filter.container === container} onClick={() => onChange({ ...filter, container })}>
            Alle {CONTAINER_PLURAL[container]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function applyStockFilter<T extends Pick<Product, "category" | "container">>(items: T[], filter: StockFilter): T[] {
  return items.filter(
    (p) => (filter.category === null || p.category === filter.category) && (filter.container === null || p.container === filter.container),
  );
}
