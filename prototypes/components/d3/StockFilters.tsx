import { CATEGORIES } from "@/lib/categories";
import type { CategoryKey, Container, Product } from "@/lib/types";
import { CONTAINER_PLURAL } from "./stock";
import { CHIP } from "./styles";

export type CategoryFilter = CategoryKey | "alle";
export type ContainerFilter = Container | "alle";

interface StockFiltersProps {
  products: Product[];
  category: CategoryFilter;
  container: ContainerFilter;
  onCategory: (value: CategoryFilter) => void;
  onContainer: (value: ContainerFilter) => void;
}

function chipClass(active: boolean): string {
  return `${CHIP} ${active ? "bg-slate-900 text-white shadow-md shadow-slate-900/15" : "bg-white/60 text-slate-700 hover:bg-white"}`;
}

export function StockFilters({ products, category, container, onCategory, onContainer }: StockFiltersProps) {
  const categories = CATEGORIES.filter((c) => products.some((p) => p.category === c.key));
  const containers = [...new Set(products.map((p) => p.container))];

  return (
    <div className="space-y-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label="Nach Kategorie filtern">
        <button type="button" className={chipClass(category === "alle")} onClick={() => onCategory("alle")}>
          Alle Gruppen
        </button>
        {categories.map((c) => (
          <button key={c.key} type="button" className={chipClass(category === c.key)} onClick={() => onCategory(c.key)}>
            <span aria-hidden className="mr-1">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label="Nach Behälter filtern">
        <button type="button" className={chipClass(container === "alle")} onClick={() => onContainer("alle")}>
          Alle Behälter
        </button>
        {containers.map((key) => (
          <button key={key} type="button" className={chipClass(container === key)} onClick={() => onContainer(key)}>
            Alle {CONTAINER_PLURAL[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
