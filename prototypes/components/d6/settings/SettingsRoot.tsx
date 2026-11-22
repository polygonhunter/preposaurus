"use client";

import { DemoRoleSwitch } from "./ui/DemoRoleSwitch";
import { SettingsGroup } from "./ui/SettingsGroup";
import { SettingsRow } from "./ui/SettingsRow";
import { ROLE_LABELS } from "./labels";
import { SETTINGS_GROUPS, SETTINGS_PAGES, canSee, isReadOnly } from "./routes";
import { useSettingsContext } from "./state/context";
import { pageSummary } from "./summaries";

/** Startliste der Einstellungen, gruppiert nach Mein Konto, Haushalt, Nutzerverwaltung, Daten & System. */
export function SettingsRoot() {
  const context = useSettingsContext();
  const { settings, nav } = context;
  const { viewAs, currentUser } = settings;
  const groups = SETTINGS_GROUPS.filter((g) => canSee(g.access, viewAs));

  return (
    <div className="space-y-5">
      <DemoRoleSwitch value={viewAs} onChange={settings.setViewAs} />
      {currentUser && (
        <p data-tile className="px-1 text-sm text-(--d6-muted)">
          Angemeldet als <span className="font-medium text-(--d6-text)">{currentUser.name}</span> · {ROLE_LABELS[currentUser.role]}
        </p>
      )}
      {groups.map((group) => (
        <SettingsGroup
          key={group.label}
          title={isReadOnly(group.access, viewAs) ? `${group.label} · nur lesen` : group.label}
          note={group.label === "Haushalt" ? "Gilt für alle im Haushalt." : undefined}
        >
          {group.pages.map((page) => (
            <SettingsRow
              key={page}
              kind="nav"
              icon={SETTINGS_PAGES[page].icon}
              label={SETTINGS_PAGES[page].title}
              value={pageSummary(page, context)}
              onClick={() => nav.push({ page })}
            />
          ))}
        </SettingsGroup>
      ))}
      {viewAs === "mitglied" && (
        <p data-tile className="px-1 text-xs leading-relaxed text-(--d6-subtle)">
          Nutzerverwaltung sowie Daten & System sehen nur Admins.
        </p>
      )}
    </div>
  );
}
