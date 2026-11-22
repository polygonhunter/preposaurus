import { APP_INFO } from "@/lib/mock-settings";
import { formatDayMonth } from "../data/format";
import { WEEKDAY_LABELS, dietLabel } from "./labels";
import type { SettingsPageKey } from "./routes";
import type { SettingsContextValue } from "./state/context";

/** Kurzer Wert rechts in der Startliste, damit man den Stand ohne Hineinklicken sieht. */
export function pageSummary(page: SettingsPageKey, { cockpit, settings, theme }: SettingsContextValue): string | undefined {
  const { goal, rules, diet } = cockpit;
  switch (page) {
    case "profil":
      return settings.currentUser?.email;
    case "benachrichtigungen": {
      const { weeklyDigest, digestDay, digestTime } = settings.notifications;
      return weeklyDigest ? `${WEEKDAY_LABELS[digestDay].slice(0, 2)} ${digestTime}` : "Wochenübersicht aus";
    }
    case "darstellung":
      return theme.theme === "dark" ? "Dunkel" : "Hell";
    case "mitglieder":
      return `${diet.members.length} Personen`;
    case "ernaehrung":
      return dietLabel(diet.householdDiet);
    case "ziel":
      return `${goal.days} Tage · ${formatDayMonth(goal.targetDate)}`;
    case "stammdaten":
      return `${settings.masterData.categories.length} Kategorien`;
    case "ampel":
      return `${rules.ampel.soonDays} / ${rules.ampel.urgentDays} Tage`;
    case "foto-ki":
      return settings.ai.enabled ? "an" : "aus";
    case "nutzer":
      return `${settings.users.length} Nutzer`;
    case "daten":
      return `v${APP_INFO.version}`;
    default:
      return undefined;
  }
}
