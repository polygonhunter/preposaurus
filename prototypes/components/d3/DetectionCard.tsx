import { Sparkles } from "lucide-react";
import { PRIMARY_BUTTON } from "./styles";

interface DetectionCardProps {
  title: string;
  detail: string;
  ready: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  optional?: boolean;
  onSkip?: () => void;
}

/** Ergebnis eines simulierten Erkennungsschritts. */
export function DetectionCard({ title, detail, ready, primaryLabel, onPrimary, optional, onSkip }: DetectionCardProps) {
  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 rounded-2xl bg-white/70 p-3.5 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-40"}`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{ready ? title : "Wird erkannt …"}</p>
          <p className="truncate text-xs text-slate-500">
            {optional && <span className="mr-1 rounded-full bg-slate-900/5 px-1.5 py-0.5">optional</span>}
            {detail}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {onSkip && (
          <button type="button" onClick={onSkip} className="flex-1 rounded-full bg-white/70 px-4 py-3 text-sm font-medium transition active:scale-[0.97]">
            Überspringen
          </button>
        )}
        <button type="button" onClick={onPrimary} disabled={!ready} className={`${PRIMARY_BUTTON} flex-1`}>
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
