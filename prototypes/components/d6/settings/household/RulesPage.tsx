"use client";

import { SOON_DAY_OPTIONS, URGENT_DAY_OPTIONS, withSoonDays } from "@/lib/ampel-rules";
import { INVENTORY_MONTH_OPTIONS } from "@/lib/mock-settings";
import { AmpelDot } from "../../ui/Controls";
import { useSettingsContext } from "../state/context";
import { Select } from "../ui/Select";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";

const dayOptions = (days: number[]) => days.map((d) => ({ key: String(d), label: `≤ ${d} Tage` }));
const INVENTORY_OPTIONS = INVENTORY_MONTH_OPTIONS.map((m) => ({ key: String(m), label: m === 1 ? "jeden Monat" : `alle ${m} Monate` }));

/** Haushalt → Ampel & Regeln: Schwellen gelb/orange und Inventur-Intervall. Wirkt sofort im Vorrat. */
export function RulesPage() {
  const { cockpit } = useSettingsContext();
  const { rules, patchRules } = cockpit;
  const { ampel } = rules;
  const urgentOptions = dayOptions(URGENT_DAY_OPTIONS.filter((d) => d < ampel.soonDays));

  return (
    <SettingsPageFrame intro="Die Ampel zeigt je Einheit, wie dringend sie gegessen werden möchte.">
      <SettingsGroup title="MHD-Ampel" note="MHD ist kein Wegwerfdatum: anschauen, riechen, probieren.">
        <SettingsRow kind="value" label="Bald verbrauchen" detail={<AmpelDot ampel="gelb" withLabel />}>
          <Select
            label="Schwelle gelb"
            value={String(ampel.soonDays)}
            options={dayOptions(SOON_DAY_OPTIONS)}
            onChange={(days) => patchRules({ ampel: withSoonDays(ampel, Number(days)) })}
          />
        </SettingsRow>
        <SettingsRow kind="value" label="Dringend" detail={<AmpelDot ampel="orange" withLabel />}>
          <Select
            label="Schwelle orange"
            value={String(ampel.urgentDays)}
            options={urgentOptions}
            onChange={(days) => patchRules({ ampel: { ...ampel, urgentDays: Number(days) } })}
          />
        </SettingsRow>
        <SettingsRow kind="value" label="Gut haltbar" detail={<AmpelDot ampel="gruen" withLabel />} value={`> ${ampel.soonDays} Tage`} />
        <SettingsRow kind="value" label="Abgelaufen" detail={<AmpelDot ampel="rot" withLabel />} value="vor heute" />
      </SettingsGroup>
      <SettingsGroup title="Inventur" note="Kurzer Vorrats-Check, dauert etwa 5 Minuten.">
        <SettingsRow kind="value" label="Erinnern">
          <Select
            label="Inventur-Intervall"
            value={String(rules.inventoryMonths)}
            options={INVENTORY_OPTIONS}
            onChange={(months) => patchRules({ inventoryMonths: Number(months) })}
          />
        </SettingsRow>
      </SettingsGroup>
    </SettingsPageFrame>
  );
}
