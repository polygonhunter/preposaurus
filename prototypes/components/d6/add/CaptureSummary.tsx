import { Check } from "lucide-react";
import type { ResolvedMacros } from "@/lib/nutrition";
import { formatAmount, formatDate } from "@/lib/supply";
import { formatNumber } from "../data/format";
import type { StockDraft } from "../data/stock";
import { LABEL, MONO } from "../theme/styles";
import { MacroLine } from "../ui/MacroLine";

/** „10 × Nudeln 500 g = 5 kg · 17.950 kcal“ plus E/K/F und frühestes MHD. */
export function CaptureSummary({ draft, macros }: { draft: StockDraft; macros: ResolvedMacros }) {
  const count = draft.mhds.length;
  const total = count * draft.contentPerUnit;
  const kcal = Math.round((total * draft.kcalPer100) / 100);
  const earliest = [...draft.mhds].sort()[0];

  return (
    <div className="rounded-2xl border border-(--d6-accent)/40 bg-(--d6-accent-soft) p-4 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-(--d6-surplus) text-(--d6-on-ink) shadow-[0_0_24px_-4px_var(--d6-surplus)]">
        <Check size={24} strokeWidth={3} />
      </span>
      <p className={`${LABEL} mt-3`}>Zusammenfassung</p>
      <p className={`${MONO} mt-1 text-lg leading-snug`}>
        <strong className="font-semibold">
          {count} × {draft.name} {formatAmount(draft.contentPerUnit, draft.unit)}
        </strong>{" "}
        = {formatAmount(total, draft.unit)} · <span className="text-(--d6-accent-text)">{formatNumber(kcal)} kcal</span>
      </p>
      <MacroLine macros={macros} unit={draft.unit} className="mt-1.5 justify-center" />
      {draft.kcalEstimated && <p className="mt-1 text-[11px] text-(--d6-muted)">Nährwerte geschätzt (Ø der Kategorie im Vorrat)</p>}
      {earliest && <p className={`${MONO} mt-1 text-xs text-(--d6-muted)`}>frühestes MHD {formatDate(earliest)}</p>}
    </div>
  );
}
