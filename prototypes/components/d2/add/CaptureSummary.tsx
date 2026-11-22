import { formatAmount } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { formatDecimal, mhdGroups, productKcal } from "../format";
import { LABEL, MONO } from "../theme";

interface CaptureSummaryProps {
  product: Product;
  kcalEstimated: boolean;
}

/** „10 × Nudeln 500 g = 5 kg · 17.950 kcal“ plus MHD-Gruppen. */
export function CaptureSummary({ product, kcalEstimated }: CaptureSummaryProps) {
  const count = product.units.length;
  const total = count * product.contentPerUnit;
  return (
    <div className="rounded-2xl border border-(--d2-accent)/30 bg-(--d2-accent-soft) p-4">
      <p className={LABEL}>Zusammenfassung</p>
      <p className={`${MONO} mt-2 text-lg leading-snug text-zinc-50`}>
        {count} × {product.name} {formatAmount(product.contentPerUnit, product.unit)} = {formatAmount(total, product.unit)}
        <span className="text-(--d2-accent)"> · {formatDecimal(productKcal(product))} kcal</span>
      </p>
      {kcalEstimated && <p className="mt-1 text-[11px] text-zinc-400">kcal geschätzt (ohne Nährwertfoto)</p>}
      <p className={`${MONO} mt-2 text-xs text-zinc-400`}>MHDs: {mhdGroups(product.units).join(", ")}</p>
    </div>
  );
}
