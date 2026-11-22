import { formatAmount } from "@/lib/supply";
import { CARD } from "../theme";
import { ChunkyButton } from "../ui/ChunkyButton";
import { groupByMonth, totalKcal, type ProductDraft } from "./add-helpers";

interface CaptureSummaryProps {
  draft: ProductDraft;
  dates: string[];
  emoji: string;
  onSave: () => void;
  onBack?: () => void;
}

/** Zusammenfassung vor dem Speichern: „10 × Nudeln 500 g = 5 kg · 17.950 kcal“. */
export function CaptureSummary({ draft, dates, emoji, onSave, onBack }: CaptureSummaryProps) {
  const count = dates.length;
  const total = formatAmount(count * draft.contentPerUnit, draft.unit);
  const kcal = totalKcal(draft, count).toLocaleString("de-DE");

  return (
    <section data-result className={`${CARD} space-y-4 p-5 text-center`}>
      <p className="text-6xl" aria-hidden>
        {emoji}
      </p>
      <p className="font-[family-name:var(--font-d5-display)] text-2xl leading-tight font-extrabold">
        {count} × {draft.name} {formatAmount(draft.contentPerUnit, draft.unit)}
      </p>
      <p className="text-lg font-black text-[#2F9E4C]">
        = {total}
        {draft.kcalPer100 > 0 ? ` · ${kcal} kcal` : " · ohne Nährwerte"}
      </p>
      <p className="rounded-2xl bg-(--d5-soft) px-3 py-2 text-sm font-bold">MHD: {groupByMonth(dates)}</p>
      <ChunkyButton tone="green" size="lg" onClick={onSave}>
        In den Vorrat legen 🎉
      </ChunkyButton>
      {onBack && (
        <button type="button" onClick={onBack} className="text-sm font-extrabold text-(--d5-muted) underline">
          Zurück zur MHD-Serie
        </button>
      )}
    </section>
  );
}
