import { AppearancePage } from "./account/AppearancePage";
import { NotificationsPage } from "./account/NotificationsPage";
import { ProfilePage } from "./account/ProfilePage";
import { DietPage } from "./household/DietPage";
import { GoalPage } from "./household/GoalPage";
import { MasterDataPage } from "./household/MasterDataPage";
import { MemberEditPage } from "./household/MemberEditPage";
import { MembersPage } from "./household/MembersPage";
import { PhotoAiPage } from "./household/PhotoAiPage";
import { RulesPage } from "./household/RulesPage";
import type { SettingsRoute } from "./routes";
import { SettingsRoot } from "./SettingsRoot";
import { DataSystemPage } from "./system/DataSystemPage";
import { InvitePage } from "./users/InvitePage";
import { UserDetailPage } from "./users/UserDetailPage";
import { UsersPage } from "./users/UsersPage";

/** Wählt die Seite zur aktuellen Station im Einstellungs-Stapel. */
export function SettingsPage({ route }: { route: SettingsRoute }) {
  switch (route.page) {
    case "root":
      return <SettingsRoot />;
    case "profil":
      return <ProfilePage />;
    case "benachrichtigungen":
      return <NotificationsPage />;
    case "darstellung":
      return <AppearancePage />;
    case "mitglieder":
      return <MembersPage />;
    case "mitglied":
      return <MemberEditPage memberId={route.param ?? ""} />;
    case "ernaehrung":
      return <DietPage />;
    case "ziel":
      return <GoalPage />;
    case "stammdaten":
      return <MasterDataPage />;
    case "ampel":
      return <RulesPage />;
    case "foto-ki":
      return <PhotoAiPage />;
    case "nutzer":
      return <UsersPage />;
    case "nutzer-detail":
      return <UserDetailPage userId={route.param ?? ""} />;
    case "einladen":
      return <InvitePage />;
    case "daten":
      return <DataSystemPage />;
  }
}
