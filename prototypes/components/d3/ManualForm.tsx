"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES, CONTAINER_LABELS, getCategory } from "@/lib/categories";
import type { CategoryKey, Container } from "@/lib/types";
import { FormField, INPUT } from "./FormField";
import { MhdPicker, type MonthYear } from "./MhdPicker";
import { Stepper } from "./Stepper";
import { endOfMonthIso, shiftMonths, type StockDraft } from "./stock";
import { CHIP, PRIMARY_BUTTON } from "./styles";

const CONTAINERS = Object.keys(CONTAINER_LABELS) as Container[];

interface ManualFormProps {
  today: string;
  onAdd: (draft: StockDraft) => void;
}

export function ManualForm({ today, onAdd }: ManualFormProps) {
  const [category, setCategory] = useState<CategoryKey>(CATEGORIES[0].key);
  const [name, setName] = useState("");
  const [container, setContainer] = useState<Container>("dose");
  const [content, setContent] = useState(400);
  const [count, setCount] = useState(1);
  const [mhd, setMhd] = useState<MonthYear>(() => shiftMonths(today, 12));
  const { unit } = getCategory(category);
  const isValid = name.trim().length > 0 && content > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    const date = endOfMonthIso(mhd.year, mhd.month);
    onAdd({
      name: name.trim(), category, container, contentPerUnit: content, unit, kcalPer100: 0,
      mhds: Array<string>(count).fill(date),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Kategorie" htmlFor="d3-category">
        <select id="d3-category" className={INPUT} value={category} onChange={(e) => setCategory(e.target.value as CategoryKey)}>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Bezeichnung" htmlFor="d3-name">
        <input id="d3-name" className={INPUT} value={name} placeholder="z. B. Kichererbsen"
          onChange={(e) => setName(e.target.value)} />
      </FormField>

      <FormField label="Behälter">
        <div className="flex flex-wrap gap-2">
          {CONTAINERS.map((key) => (
            <button key={key} type="button" aria-pressed={container === key} onClick={() => setContainer(key)}
              className={`${CHIP} ${container === key ? "bg-slate-900 text-white" : "bg-white/70 text-slate-700"}`}>
              {CONTAINER_LABELS[key]}
            </button>
          ))}
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={`Inhalt (${unit})`} htmlFor="d3-content">
          <input id="d3-content" type="number" inputMode="numeric" min={1} className={INPUT} value={content}
            onChange={(e) => setContent(Number(e.target.value))} />
        </FormField>
        <FormField label="Anzahl">
          <Stepper label="Anzahl" value={count} onChange={setCount} />
        </FormField>
      </div>

      <MhdPicker today={today} value={mhd} onChange={setMhd} />

      <button type="submit" disabled={!isValid} className={`${PRIMARY_BUTTON} w-full`}>
        Zum Vorrat hinzufügen
      </button>
      <p className="text-center text-xs text-slate-500">Nährwerte kannst du später per Foto ergänzen.</p>
    </form>
  );
}
