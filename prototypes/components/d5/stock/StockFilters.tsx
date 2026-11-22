import { getCategory } from "@/lib/categories";
import type { CategoryKey, Container } from "@/lib/types";
import { CATEGORY_TONE } from "../theme";
import { Chip } from "../ui/Chip";

interface StockFiltersProps {
  categories: CategoryKey[];
  containers: Container[];
  category: CategoryKey | null;
  container: Container | null;
  onCategory: (key: CategoryKey | null) => void;
  onContainer: (container: Container | null) => void;
}

const CONTAINER_PLURAL: Record<Container, string> = {
  dose: "Dosen",
  glas: "Gläser",
  packung: "Packungen",
  flasche: "Flaschen",
  tetrapak: "Tetrapaks",
  beutel: "Beutel",
};

const ROW = "-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]";

/** Zwei horizontal scrollbare Chip-Reihen: Warengruppe und Behälter. */
export function StockFilters({ categories, containers, category, container, onCategory, onContainer }: StockFiltersProps) {
  return (
    <div className="space-y-1" data-pop>
      <div className={ROW} role="group" aria-label="Nach Kategorie filtern">
        <Chip active={category === null} onClick={() => onCategory(null)}>
          Alle
        </Chip>
        {categories.map((key) => {
          const { emoji, label } = getCategory(key);
          return (
            <Chip key={key} tone={CATEGORY_TONE[key]} active={category === key} onClick={() => onCategory(key)}>
              {emoji} {label}
            </Chip>
          );
        })}
      </div>
      <div className={ROW} role="group" aria-label="Nach Behälter filtern">
        <Chip tone="blue" active={container === null} onClick={() => onContainer(null)}>
          Alle Behälter
        </Chip>
        {containers.map((c) => (
          <Chip key={c} tone="blue" active={container === c} onClick={() => onContainer(c)}>
            Alle {CONTAINER_PLURAL[c]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
