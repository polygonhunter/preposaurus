// Adressen der Einstellungen (#37), an einer Stelle für Seiten, Links und Weiterleitungen der Actions.

export const SETTINGS_PATH = '/einstellungen'
export const MEMBERS_PATH = '/einstellungen/mitglieder'
export const NEW_MEMBER_PATH = '/einstellungen/mitglieder/neu'
export const GOAL_PATH = '/einstellungen/ziel'
export const RULES_PATH = '/einstellungen/regeln'
export const USERS_PATH = '/einstellungen/nutzer'
export const NEW_USER_PATH = '/einstellungen/nutzer/neu'
export const SYSTEM_PATH = '/einstellungen/system'

export const memberPath = (memberId: string) => `${MEMBERS_PATH}/${memberId}`

export const userPath = (userId: string) => `${USERS_PATH}/${userId}`
