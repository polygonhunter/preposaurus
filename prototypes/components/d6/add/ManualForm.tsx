"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES, CONTAINER_LABELS, getCategory } from "@/lib/categories";
import { estimateMacrosPer100 } from "@/lib/nutrition";
import type { CategoryKey, Container } from "@/lib/types";
import { endOfMonthIso, shiftMonths, type MonthYear } from "../data/format";
import { EMPTY_MACRO_INPUT, parseMacroInput, type MacroInput } from "../data/macro-input";
import { estimateKcalPer100, type StockDraft, type StockProduct } from "../data/stock";
import { BADGE, BUTTON_PRIMARY, FIELD, MONO, cx } from "../theme/styles";
import { Chip, FormField, Stepper } from "../ui/Controls";
import { MacroFields } from "./MacroFields";
import { MhdPicker } from "./MhdPicker";

const CONTAINERS = Object.keys(CONTAINER_LABELS) as Container[];
const DEFAULT_SHELF_MONTHS = 12;

interface ManualFormProps {
  today: string;
  products: StockProduct[];
  onAdd: (draft: StockDraft) => void;
}

/** Manuelle Erfassung; ohne Nährwertangabe zählt der Durchschnitt der Kategorie („geschätzt“). */
export function ManualForm({ today, products, onAdd }: ManualFormProps) {
  const [category, setCategory] = useState<CategoryKey>(CATEGORIES[0].key);
  const [name, setName] = useState("");
  const [container, setContainer] = useState<Container>("dose");
  const [content, setContent] = useState(400);
  const [count, setCount] = useState(1);
  const [kcalInput, setKcalInput] = useState("");
  const [macroInput, setMacroInput] = useState<MacroInput>(EMPTY_MACRO_INPUT);
  const [mhd, setMhd] = useState<MonthYear>(() => shiftMonths(today, DEFAULT_SHELF_MONTHS));
  const { unit, label: categoryLabel } = getCategory(category);
  const estimate = estimateKcalPer100(products, category);
  const kcalEstimated = kcalInput.trim() === "";
  const kcalPer100 = kcalEstimated ? estimate.kcalPer100 : Number(kcalInput);
  const macrosPer100 = parseMacroInput(macroInput);
  const isValid = name.trim().length > 0 && content > 0 && kcalPer100 >= 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    onAdd({
      name: name.trim(),
      category,
      container,
      contentPerUnit: content,
      unit,
      kcalPer100,
      kcalEstimated,
      macrosPer100,
      mhds: Array<string>(count).fill(endOfMonthIso(mhd)),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Kategorie" htmlFor="d6-category">
        <select id="d6-category" className={FIELD} value={category} onChange={(e) => setCategory(e.target.value as CategoryKey)}>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Bezeichnung" htmlFor="d6-name">
        <input id="d6-name" className={FIELD} value={name} placeholder="z. B. Kichererbsen" onChange={(e) => setName(e.target.value)} />
      </FormField>

      <FormField label="Behälter">
        <div className="flex flex-wrap gap-2">
          {CONTAINERS.map((key) => (
            <Chip key={key} active={container === key} onClick={() => setContainer(key)}>
              {CONTAINER_LABELS[key]}
            </Chip>
          ))}
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={`Inhalt (${unit})`} htmlFor="d6-content">
          <input id="d6-content" type="number" inputMode="numeric" min={1} className={`${FIELD} ${MONO}`} value={content}
            onChange={(e) => setContent(Number(e.target.value))} />
        </FormField>
        <FormField label="Anzahl">
          <Stepper label="Anzahl" value={count} onChange={setCount} />
        </FormField>
      </div>

      <FormField label={`kcal je 100 ${unit} (optional)`} htmlFor="d6-kcal">
        <input id="d6-kcal" type="number" inputMode="numeric" min={0} className={`${FIELD} ${MONO}`} value={kcalInput}
          placeholder={`≈ ${estimate.kcalPer100}`} onChange={(e) => setKcalInput(e.target.value)} />
        {kcalEstimated && (
          <p className="px-1 text-[11px] text-(--d6-muted)">
            <span className={cx(BADGE, "mr-1")}>geschätzt</span>
            {estimate.fromCategory ? `Ø ${categoryLabel} im Vorrat` : "Ø des ganzen Vorrats (Kategorie noch leer)"}:{" "}
            <span className={MONO}>{estimate.kcalPer100} kcal</span>
          </p>
        )}
      </FormField>

      <MacroFields value={macroInput} onChange={setMacroInput} estimate={estimateMacrosPer100(products, category)} unit={unit} />
      {!macrosPer100 && (
        <p className="-mt-2 px-1 text-[11px] text-(--d6-muted)">
          <span className={cx(BADGE, "mr-1")}>geschätzt</span>
          Solange nicht alle drei Werte da sind, zählt der Ø der Warengruppe.
        </p>
      )}

      <MhdPicker today={today} value={mhd} onChange={setMhd} />

      <button type="submit" disabled={!isValid} className={`${BUTTON_PRIMARY} w-full`}>
        Zum Vorrat hinzufügen
      </button>
    </form>
  );
}
