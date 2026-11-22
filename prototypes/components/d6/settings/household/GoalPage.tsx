"use client";

import { ExternalLink } from "lucide-react";
import { GOAL_DAY_PRESETS, SOURCES } from "@/lib/mock-settings";
import type { CalcMode } from "@/lib/settings-types";
import { formatDayMonth } from "../../data/format";
import { FIELD, MONO, cx } from "../../theme/styles";
import { Chip, Stepper } from "../../ui/Controls";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { CALC_MODE_LABELS, optionsFrom } from "../labels";
import { useSettingsContext } from "../state/context";
import { Select } from "../ui/Select";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";

const SOURCE_OPTIONS = SOURCES.map((s) => ({ key: s.id, label: s.available ? s.label : `${s.label} (vorbereitet)`, disabled: !s.available }));
const MODE_OPTIONS = optionsFrom<CalcMode>(CALC_MODE_LABELS);
const MODE_NOTES: Record<CalcMode, string> = {
  offiziell: "2.200 kcal und 2 l Wasser pro Person und Tag (Kinder bis 12: 1 l), quellentreu.",
  individuell: "DGE-Werte nach Alter, Geschlecht und Aktivität. Im Prototyp wird weiterhin offiziell gerechnet.",
};

/** Haushalt → Ziel & Empfehlung: Quelle, Rechenmodus, Zieldauer, Zieldatum, Etappen. */
export function GoalPage() {
  const { cockpit, today } = useSettingsContext();
  const { goal, patchGoal } = cockpit;
  const source = SOURCES.find((s) => s.id === goal.sourceId) ?? SOURCES[0];

  return (
    <SettingsPageFrame intro="Die Übersicht rechnet sofort mit den neuen Werten.">
      <SettingsGroup title="Empfehlung" note={source.publisher}>
        <SettingsRow kind="value" label="Quelle">
          <Select label="Quelle" value={goal.sourceId} options={SOURCE_OPTIONS} onChange={(sourceId) => patchGoal({ sourceId })} />
        </SettingsRow>
        <SettingsRow kind="value" label="Stand" detail={source.stand}>
          {source.url && (
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-(--d6-accent-text)">
              Quelle <ExternalLink aria-hidden className="size-3.5" />
            </a>
          )}
        </SettingsRow>
      </SettingsGroup>
      <SettingsGroup title="Rechenmodus" note={MODE_NOTES[goal.mode]}>
        <div className="p-3">
          <SegmentedControl label="Rechenmodus" value={goal.mode} options={MODE_OPTIONS} onChange={(mode) => patchGoal({ mode })} className="w-full" />
        </div>
      </SettingsGroup>
      <SettingsGroup title="Ziel" note="Gezählt wird nur, was am Zieldatum noch haltbar ist.">
        <SettingsRow kind="value" label="Zieldauer" detail={`${goal.days} Tage`}>
          <div className="flex w-full flex-wrap items-center gap-2">
            {GOAL_DAY_PRESETS.map((days) => (
              <Chip key={days} active={goal.days === days} onClick={() => patchGoal({ days })}>
                {days} Tage
              </Chip>
            ))}
            <Stepper label="Eigene Zieldauer" value={goal.days} min={1} max={90} onChange={(days) => patchGoal({ days })} />
          </div>
        </SettingsRow>
        <SettingsRow kind="value" label="Zieldatum" detail={formatDayMonth(goal.targetDate)}>
          <input
            type="date"
            aria-label="Zieldatum"
            min={today}
            value={goal.targetDate}
            onChange={(e) => e.target.value && patchGoal({ targetDate: e.target.value })}
            className={cx(FIELD, MONO, "w-auto rounded-full py-1.5 text-sm")}
          />
        </SettingsRow>
      </SettingsGroup>
      <SettingsGroup title="Etappen" note="Im Prototyp fest hinterlegt. Sie lösen die Hinweise unter Benachrichtigungen → Etappen aus.">
        {[...goal.milestones, { days: goal.days, date: goal.targetDate }].map((m) => (
          <SettingsRow key={`${m.days}-${m.date}`} kind="value" label={`${m.days} Tage`} value={`bis ${formatDayMonth(m.date)}`} />
        ))}
      </SettingsGroup>
    </SettingsPageFrame>
  );
}
