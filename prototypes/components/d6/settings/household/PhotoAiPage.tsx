"use client";

import { CircleCheck, ShieldCheck } from "lucide-react";
import { AI_COST_THIS_MONTH } from "@/lib/mock-settings";
import type { AiModel, PhotoKind } from "@/lib/settings-types";
import { formatNumber } from "../../data/format";
import { MODEL_LABELS, PHOTO_KIND_LABELS, optionsFrom } from "../labels";
import { useSettingsContext } from "../state/context";
import { Select } from "../ui/Select";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";

const MODEL_OPTIONS = optionsFrom<AiModel>(MODEL_LABELS);
const PHOTO_KINDS = Object.keys(PHOTO_KIND_LABELS) as PhotoKind[];

/** Haushalt → Foto-Erkennung: KI an/aus, Modell je Foto-Art, Schlüssel-Status, Datenschutz, Kosten. */
export function PhotoAiPage() {
  const { settings } = useSettingsContext();
  const { ai, patchAi } = settings;

  return (
    <SettingsPageFrame intro="Fotos sind immer freiwillig. Alles geht auch manuell, und KI-Ergebnisse sind nur Vorschläge.">
      <SettingsGroup>
        <SettingsRow kind="toggle" label="Foto-Erkennung mit KI" checked={ai.enabled} onChange={(enabled) => patchAi({ enabled })} />
      </SettingsGroup>
      <SettingsGroup title="Modell je Foto-Art" note="Sonnet liest kleine Schrift genauer, Haiku ist schneller und günstiger.">
        {PHOTO_KINDS.map((kind) => (
          <SettingsRow key={kind} kind="value" label={PHOTO_KIND_LABELS[kind]}>
            <Select
              label={`Modell für ${PHOTO_KIND_LABELS[kind]}`}
              value={ai.models[kind]}
              options={MODEL_OPTIONS}
              disabled={!ai.enabled}
              onChange={(model) => patchAi({ models: { ...ai.models, [kind]: model } })}
            />
          </SettingsRow>
        ))}
      </SettingsGroup>
      <SettingsGroup title="Zugang" note="Der Schlüssel selbst steht nur in der .env auf deinem Server, nie in der Oberfläche.">
        <SettingsRow
          kind="value"
          icon={CircleCheck}
          label="API-Schlüssel"
          value={<span className="font-medium text-(--d6-ok-text)">hinterlegt ✓</span>}
        />
      </SettingsGroup>
      <SettingsGroup title="Datenschutz">
        <SettingsRow kind="value" icon={ShieldCheck} label="Fotos werden zur Erkennung an Anthropic (USA) gesendet." detail="Nur bei aktiver KI und nur das jeweilige Foto." />
      </SettingsGroup>
      <SettingsGroup title="Kosten diesen Monat" note="Demo-Werte.">
        <SettingsRow
          kind="value"
          label={`${formatNumber(AI_COST_THIS_MONTH.euro, 2)} €`}
          detail={`${AI_COST_THIS_MONTH.photos} Fotos erkannt`}
        />
      </SettingsGroup>
    </SettingsPageFrame>
  );
}
