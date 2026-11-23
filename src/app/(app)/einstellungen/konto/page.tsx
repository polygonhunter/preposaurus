import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { readShortcutsEnabled } from '@/features/auth/application/shortcut-preference'
import { getOwnProfile } from '@/features/auth/application/manage-profile'
import { profileServices } from '@/features/auth/application/profile-services'
import type { ProfileView } from '@/features/auth/domain/profile'
import { ChangePasswordForm } from '@/features/auth/ui/ChangePasswordForm'
import { CheckInForm } from '@/features/auth/ui/CheckInForm'
import { ProfileForm } from '@/features/auth/ui/ProfileForm'
import { ShortcutsForm } from '@/features/auth/ui/ShortcutsForm'
import { formatSignInTime } from '@/features/auth/ui/user-format'
import { requirePageHousehold } from '@/server/auth/household'
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Mein Konto · Preposaurus' }

// „Passwort zuletzt geändert am … von …“ (EINSTELLUNGEN_NUTZER §3.2), damit jeder merkt, wenn ein
// Admin es zurückgesetzt hat.
function passwordNote(profile: ProfileView): string {
  if (profile.passwordChangedAt === null) return 'Dein Passwort stammt aus der Einrichtung.'
  const name = profile.passwordChangedByName
  const by = name === null ? 'per Kommandozeile' : `von ${name}`
  const note = `Zuletzt geändert am ${formatSignInTime(profile.passwordChangedAt)}, ${by}.`
  return profile.isPasswordTemporary ? `${note} Magst du ein eigenes Passwort setzen?` : note
}

function checkInNote(profile: ProfileView): string | null {
  if (!profile.isMailConfigured) {
    return 'Auf diesem Server ist kein Mailversand eingerichtet. Das richtet ein Admin ein.'
  }
  if (profile.reminderEmail === null)
    return 'Trag oben eine Adresse ein, dann lässt sie sich wählen.'
  return null
}

// Mein Konto (#75, #89, #254): Anzeigename, Adresse für Erinnerungen, Passwort, Check-in-Mail und
// Tastenkürzel. Jeder sieht und ändert nur sich selbst.
export default async function AccountPage() {
  const { userId } = await requirePageHousehold()
  const profile = await getOwnProfile(await profileServices(), userId)
  if (profile === null) notFound()
  const note = checkInNote(profile)
  const areShortcutsOn = await readShortcutsEnabled()
  return (
    <>
      <PageHeader title="Mein Konto" back={{ href: SETTINGS_PATH, label: 'Einstellungen' }} />
      <GroupHeader id="anmeldung">Anmeldung</GroupHeader>
      <Group labelledBy="anmeldung">
        <Row title="Benutzername" trailing={profile.username} />
      </Group>
      <GroupFooter>Mit dem Benutzernamen meldest du dich an. Er bleibt, wie er ist.</GroupFooter>
      <GroupHeader id="profil">Profil</GroupHeader>
      <ProfileForm displayName={profile.displayName} reminderEmail={profile.reminderEmail} />
      <GroupHeader id="passwort">Passwort</GroupHeader>
      <ChangePasswordForm />
      <GroupFooter>{passwordNote(profile)}</GroupFooter>
      <GroupHeader id="mails">Mails</GroupHeader>
      {note === null ? (
        <CheckInForm cadence={profile.checkInCadence} />
      ) : (
        <>
          <Group labelledBy="mails">
            <Row title="Check-in-Mail" trailing="nicht verfügbar" />
          </Group>
          <GroupFooter>{note}</GroupFooter>
        </>
      )}
      <GroupHeader id="darstellung">Darstellung</GroupHeader>
      <ShortcutsForm isOn={areShortcutsOn} />
    </>
  )
}
