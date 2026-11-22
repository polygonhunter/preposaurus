import { Camera } from "lucide-react";
import type { TabKey } from "../data/tabs";
import type { Cockpit } from "../data/use-cockpit";
import type { SettingsRoute } from "../settings/routes";
import { CategoryTile } from "./CategoryTile";
import { ExpiringTile } from "./ExpiringTile";
import { GaugeTile } from "./GaugeTile";
import { GoalTile } from "./GoalTile";
import { HouseholdTile } from "./HouseholdTile";
import { MacroTile } from "./MacroTile";
import { QuickTile } from "./QuickTile";
import { RestockTile } from "./RestockTile";
import { WaterTile } from "./WaterTile";

interface OverviewScreenProps {
  cockpit: Cockpit;
  onNavigate: (tab: TabKey, source?: HTMLElement | null) => void;
  /** „Bearbeiten →“ springt direkt in den passenden Einstellungsbereich. */
  onEditSettings: (path: SettingsRoute[], source?: HTMLElement | null) => void;
}

/** Bento-Raster: 2 Spalten am Handy, 4 am Desktop. */
export function OverviewScreen({ cockpit, onNavigate, onEditSettings }: OverviewScreenProps) {
  const { live, goal } = cockpit;
  const open = (tab: TabKey) => (tile: HTMLElement | null) => onNavigate(tab, tile);
  const edit = (path: SettingsRoute[]) => (tile: HTMLElement | null) => onEditSettings(path, tile);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <GaugeTile live={live} goalDays={goal.days} onOpen={open("statistik")} />
      <GoalTile goal={goal} live={live} onEdit={edit([{ page: "ziel" }])} />
      <WaterTile live={live} />
      <QuickTile flipId="tile-hinzufuegen" icon={Camera} title="Foto aufnehmen" detail="Packung & MHD" onOpen={open("hinzufuegen")} />
      <CategoryTile live={live} goalDays={goal.days} targetDate={goal.targetDate} onOpen={open("vorrat")} />
      <ExpiringTile live={live} onOpen={open("vorrat")} />
      <RestockTile openItems={cockpit.openRestock} onOpen={open("nachkaufen")} />
      <MacroTile live={live} goalDays={goal.days} />
      <HouseholdTile diet={cockpit.diet} onEdit={edit([{ page: "mitglieder" }])} />
    </div>
  );
}
