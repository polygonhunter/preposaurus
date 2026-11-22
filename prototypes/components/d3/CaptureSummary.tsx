import { Check } from "lucide-react";
import { formatAmount, formatDate } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { formatNumber } from "./stock";
import { PRIMARY_BUTTON } from "./styles";

interface CaptureSummaryProps {
  product: Product;
  mhds: string[];
  onConfirm: () => void;
}

export function CaptureSummary({ product, mhds, onConfirm }: CaptureSummaryProps) {
  const count = mhds.length;
  const total = count * product.contentPerUnit;
  const kcal = Math.round((total * product.kcalPer100) / 100);
  const earliest = [...mhds].sort()[0];

  return (
    <div className="space-y-4 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-400/90 text-white shadow-lg shadow-emerald-400/40">
        <Check size={26} />
      </span>
      <p className="text-lg leading-snug">
        <strong className="font-semibold">{count} × {product.name} {formatAmount(product.contentPerUnit, product.unit)}</strong>
        <span className="text-slate-500"> = </span>
        {formatAmount(total, product.unit)} · {formatNumber(kcal)} kcal
      </p>
      {earliest && <p className="text-sm text-slate-500">frühestes MHD {formatDate(earliest)}</p>}
      <button type="button" onClick={onConfirm} className={`${PRIMARY_BUTTON} w-full`}>
        In den Vorrat legen
      </button>
    </div>
  );
}
