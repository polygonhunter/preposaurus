"use client";

import { useRef, useState, type FormEvent } from "react";
import { CATEGORIES, CONTAINER_LABELS, getCategory } from "@/lib/categories";
import type { CategoryKey, Container, Product } from "@/lib/types";
import { burstConfetti } from "../confetti";
import { Chip } from "../ui/Chip";
import { ChunkyButton } from "../ui/ChunkyButton";
import { Stepper } from "../ui/Stepper";
import { buildProduct, endOfMonthIso } from "./add-helpers";
import { FIELD, LABEL } from "./form-styles";
import { MhdPicker, monthsFromToday } from "./MhdPicker";

interface ManualFormProps {
  today: string;
  onSaved: (product: Product) => void;
}

const CONTAINERS = Object.keys(CONTAINER_LABELS) as Container[];

/** Manuelle Erfassung: Kategorie, Bezeichnung, Behälter, Inhalt, Anzahl, MHD. */
export function ManualForm({ today, onSaved }: ManualFormProps) {
  const form = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState<CategoryKey>(CATEGORIES[0].key);
  const [name, setName] = useState("");
  const [container, setContainer] = useState<Container>("dose");
  const [content, setContent] = useState(400);
  const [count, setCount] = useState(1);
  const [mhd, setMhd] = useState(() => monthsFromToday(today, 12));
  const unit = getCategory(category).unit;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const draft = { name: name.trim(), category, container, contentPerUnit: content, unit, kcalPer100: 0 };
    const mhdIso = endOfMonthIso(mhd.year, mhd.month);
    burstConfetti(form.current, 40);
    onSaved(buildProduct(draft, Array.from({ length: count }, () => mhdIso)));
  };

  return (
    <form ref={form} onSubmit={submit} className="space-y-4">
      <div data-pop>
        <label htmlFor="d5-category" className={LABEL}>
          Kategorie
        </label>
        <select id="d5-category" className={FIELD} value={category} onChange={(e) => setCategory(e.target.value as CategoryKey)}>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </div>
      <div data-pop>
        <label htmlFor="d5-name" className={LABEL}>
          Bezeichnung
        </label>
        <input id="d5-name" required className={FIELD} placeholder="z. B. Kichererbsen" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <fieldset data-pop>
        <legend className={LABEL}>Behälter</legend>
        <div className="flex flex-wrap gap-2">
          {CONTAINERS.map((c) => (
            <Chip key={c} tone="blue" active={container === c} onClick={() => setContainer(c)}>
              {CONTAINER_LABELS[c]}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div data-pop className="grid grid-cols-2 items-end gap-3">
        <div>
          <label htmlFor="d5-content" className={LABEL}>
            Inhalt ({unit})
          </label>
          <input
            id="d5-content"
            type="number"
            min={1}
            inputMode="numeric"
            className={FIELD}
            value={content}
            onChange={(e) => setContent(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div>
          <span className={LABEL}>Anzahl</span>
          <Stepper label="Anzahl" value={count} onChange={setCount} />
        </div>
      </div>
      <div data-pop>
        <MhdPicker value={mhd} today={today} onChange={setMhd} />
      </div>
      <ChunkyButton type="submit" tone="green" size="lg" disabled={name.trim() === ""}>
        Speichern ✨
      </ChunkyButton>
    </form>
  );
}
