"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES, CONTAINER_LABELS, getCategory } from "@/lib/categories";
import type { CategoryKey, Container, Product } from "@/lib/types";
import { endOfMonthIso } from "../format";
import { BUTTON_PRIMARY } from "../theme";
import { Stepper } from "../ui/Stepper";
import { FIELD, Field, FieldLabel } from "./Field";
import { MhdPicker, addMonths, type MonthYear } from "./MhdPicker";

interface ManualFormProps {
  today: string;
  onSave: (product: Product) => void;
}

/** Durchschnittlicher Energiewert, wenn kein Nährwertfoto vorliegt (Prototyp-Schätzung). */
const ESTIMATED_KCAL_PER_100 = 150;
const DEFAULT_SHELF_MONTHS = 12;
const DEFAULT_LOCATION = "Keller";
const CONTAINERS = Object.keys(CONTAINER_LABELS) as Container[];

/** Manuelle Erfassung: Kategorie, Bezeichnung, Behälter, Inhalt, Anzahl, MHD. */
export function ManualForm({ today, onSave }: ManualFormProps) {
  const [category, setCategory] = useState<CategoryKey>(CATEGORIES[0].key);
  const [name, setName] = useState("");
  const [container, setContainer] = useState<Container>("dose");
  const [content, setContent] = useState(400);
  const [count, setCount] = useState(1);
  const [mhd, setMhd] = useState<MonthYear>(() => addMonths(today, DEFAULT_SHELF_MONTHS));
  const unit = getCategory(category).unit;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const stamp = Date.now();
    const mhdIso = endOfMonthIso(mhd.year, mhd.month);
    onSave({
      id: `manual-${stamp}`,
      name: name.trim(),
      category,
      container,
      contentPerUnit: content,
      unit,
      kcalPer100: ESTIMATED_KCAL_PER_100,
      location: DEFAULT_LOCATION,
      units: Array.from({ length: count }, (_, i) => ({ id: `manual-${stamp}-${i}`, mhd: mhdIso })),
    });
    setName("");
    setCount(1);
  };

  return (
    <form data-reveal onSubmit={submit} className="grid gap-4 rounded-2xl border border-white/[0.07] bg-(--d2-panel)/90 p-4">
      <Field label="Kategorie">
        <select className={FIELD} value={category} onChange={(e) => setCategory(e.target.value as CategoryKey)}>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Bezeichnung">
        <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Kichererbsen" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Behälter">
          <select className={FIELD} value={container} onChange={(e) => setContainer(e.target.value as Container)}>
            {CONTAINERS.map((c) => (
              <option key={c} value={c}>
                {CONTAINER_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Inhalt (${unit})`}>
          <input
            className={`${FIELD} font-(family-name:--d2-mono)`}
            type="number"
            inputMode="numeric"
            min={1}
            value={content}
            onChange={(e) => setContent(Number(e.target.value))}
            required
          />
        </Field>
      </div>
      <div className="flex items-center justify-between">
        <FieldLabel>Anzahl</FieldLabel>
        <Stepper value={count} onChange={setCount} label="Anzahl" />
      </div>
      <MhdPicker value={mhd} today={today} onChange={setMhd} />
      <button type="submit" className={BUTTON_PRIMARY}>
        In den Vorrat legen
      </button>
    </form>
  );
}
