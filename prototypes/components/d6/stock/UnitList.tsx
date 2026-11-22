"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck, Trash2, Utensils, type LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/supply";
import { sortByMhd, type UnitChecks, type UnitOutcome } from "@/lib/unit-history";
import type { Ampel, StockUnit } from "@/lib/types";
import { formatShortDate } from "../data/format";
import { MONO, cx } from "../theme/styles";
import { AmpelDot } from "../ui/Controls";

export interface UnitActions {
  checks: UnitChecks;
  onResolve: (unitId: string, outcome: UnitOutcome) => void;
  onCheck: (unitId: string) => void;
}

interface IconActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

function IconAction({ icon: Icon, label, onClick }: IconActionProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-7 shrink-0 place-items-center rounded-full border border-(--d6-line) bg-(--d6-glass-strong) text-(--d6-muted) transition hover:text-(--d6-accent-text) active:scale-90"
    >
      <Icon className="size-3.5" />
    </button>
  );
}

interface UnitListProps extends UnitActions {
  units: StockUnit[];
  ampelOf: (mhd: string) => Ampel;
}

/** Aufklappbare Einheiten-Liste einer Produkt-Kachel. */
export function UnitDisclosure({ initiallyOpen, ...listProps }: UnitListProps & { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-1 text-xs font-medium text-(--d6-muted) hover:text-(--d6-text)"
      >
        Einheiten ({listProps.units.length})
        <ChevronDown aria-hidden className={cx("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && <UnitList {...listProps} />}
    </div>
  );
}

/** Jede Einheit mit eigenem MHD und Aktionen: verbraucht, entsorgt, bei Abgelaufenem „noch gut“. */
function UnitList({ units, ampelOf, checks, onResolve, onCheck }: UnitListProps) {
  return (
    <ul className="space-y-1" aria-label="Einheiten">
      {sortByMhd(units).map((unit) => {
        const checkedAt = checks[unit.id];
        const ampel = ampelOf(unit.mhd);
        const expired = ampel === "rot";
        return (
          <li key={unit.id} className="flex items-center gap-1.5 rounded-xl bg-(--d6-track) py-1 pl-2 pr-1">
            <AmpelDot ampel={ampel} />
            <span className="min-w-0 flex-1 leading-tight">
              <span className={cx(MONO, "block text-[11px]")} title={formatDate(unit.mhd)}>
                {formatShortDate(unit.mhd)}
              </span>
              {checkedAt && <span className="block text-[10px] text-(--d6-subtle)">geprüft {formatShortDate(checkedAt)}</span>}
            </span>
            {expired && !checkedAt && <IconAction icon={ShieldCheck} label="Noch gut (geprüft)" onClick={() => onCheck(unit.id)} />}
            <IconAction icon={Utensils} label="Verbraucht" onClick={() => onResolve(unit.id, "verbraucht")} />
            <IconAction icon={Trash2} label="Entsorgt" onClick={() => onResolve(unit.id, "entsorgt")} />
          </li>
        );
      })}
    </ul>
  );
}
