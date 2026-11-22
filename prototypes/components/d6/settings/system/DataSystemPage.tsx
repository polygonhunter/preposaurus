"use client";

import { Archive, Download, ExternalLink, HardDrive, Upload } from "lucide-react";
import { APP_INFO, BACKUP_STATUS, BBK_URL, SOURCES, THIRD_PARTY } from "@/lib/mock-settings";
import { BUTTON_SECONDARY } from "../../theme/styles";
import { formatDateTime } from "../labels";
import { useSettingsContext } from "../state/context";
import { FeedbackLine, useDemoFeedback } from "../ui/DemoFeedback";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";

const ACTIVE_SOURCE = SOURCES[0];

function SourceLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-(--d6-accent-text)">
      {children} <ExternalLink aria-hidden className="size-3.5" />
    </a>
  );
}

/** Daten & System: Export/Import, Backup, Verlauf, Version, Lizenz und Quellen. */
export function DataSystemPage() {
  const { settings } = useSettingsContext();
  const feedback = useDemoFeedback();
  const demo = (text: string) => () => feedback.show(`${text} (Demo)`);

  return (
    <SettingsPageFrame intro={`Deine Daten liegen auf deinem eigenen Server. Angemeldet als ${settings.currentUser?.name ?? "Admin"}.`}>
      <SettingsGroup title="Export & Import">
        <div className="flex flex-wrap gap-2 p-3">
          <button type="button" className={BUTTON_SECONDARY} onClick={demo("JSON-Export komplett vorbereitet")}>
            <Download aria-hidden className="size-4" /> JSON komplett
          </button>
          <button type="button" className={BUTTON_SECONDARY} onClick={demo("CSV-Export des Vorrats vorbereitet")}>
            <Download aria-hidden className="size-4" /> CSV Vorrat
          </button>
          <button type="button" className={BUTTON_SECONDARY} onClick={demo("Import-Dialog geöffnet")}>
            <Upload aria-hidden className="size-4" /> Importieren
          </button>
        </div>
      </SettingsGroup>
      <FeedbackLine message={feedback.message} />
      <SettingsGroup title="Backup" note={`Ziel: ${BACKUP_STATUS.target} · ${BACKUP_STATUS.schedule}`}>
        <SettingsRow kind="value" icon={HardDrive} label="Letztes Backup" value={formatDateTime(BACKUP_STATUS.lastBackup)} />
      </SettingsGroup>
      <SettingsGroup title="Verlauf" note="Archivierte Einträge zählen weiter in die Statistik, stehen aber nicht mehr in der Liste.">
        <SettingsRow kind="nav" icon={Archive} label="Historie älter als 1 Jahr archivieren" onClick={demo("Alte Historie archiviert")} />
      </SettingsGroup>
      <SettingsGroup title="Über Preposaurus">
        <SettingsRow kind="value" label="Version" value={APP_INFO.version} />
        <SettingsRow kind="value" label="Lizenz" detail={APP_INFO.license} />
        <SettingsRow kind="value" label={ACTIVE_SOURCE.label} detail={`Stand ${ACTIVE_SOURCE.stand}`}>
          <span className="flex gap-3">
            <SourceLink href={ACTIVE_SOURCE.url}>BLE</SourceLink>
            <SourceLink href={BBK_URL}>BBK</SourceLink>
          </span>
        </SettingsRow>
      </SettingsGroup>
      <SettingsGroup title="Lizenzen Dritter">
        {THIRD_PARTY.map((item) => (
          <SettingsRow key={item.name} kind="value" label={item.name} value={item.license} />
        ))}
      </SettingsGroup>
    </SettingsPageFrame>
  );
}
