// Adressen der Einstellungen (#37), an einer Stelle für Seiten, Links und Weiterleitungen der Actions.

export const SETTINGS_PATH = '/einstellungen'
export const ACCOUNT_PATH = '/einstellungen/konto'
export const MEMBERS_PATH = '/einstellungen/mitglieder'
export const NEW_MEMBER_PATH = '/einstellungen/mitglieder/neu'
export const GOAL_PATH = '/einstellungen/ziel'
export const RULES_PATH = '/einstellungen/regeln'
export const REMINDERS_PATH = '/einstellungen/erinnerungen'
export const STORAGE_LOCATIONS_PATH = '/einstellungen/lagerorte'
export const CATEGORIES_PATH = '/einstellungen/kategorien'
export const NEW_CATEGORY_PATH = '/einstellungen/kategorien/neu'
export const FOOD_TYPES_PATH = '/einstellungen/lebensmittelarten'
export const NEW_FOOD_TYPE_PATH = '/einstellungen/lebensmittelarten/neu'
export const USERS_PATH = '/einstellungen/nutzer'
export const NEW_USER_PATH = '/einstellungen/nutzer/neu'
export const SYSTEM_PATH = '/einstellungen/system'
export const AI_SETTINGS_PATH = '/einstellungen/foto-erkennung'

export const memberPath = (memberId: string) => `${MEMBERS_PATH}/${memberId}`

export const userPath = (userId: string) => `${USERS_PATH}/${userId}`

export const storageLocationPath = (locationId: string) => `${STORAGE_LOCATIONS_PATH}/${locationId}`

export const categoryPath = (categoryId: string) => `${CATEGORIES_PATH}/${categoryId}`

export const foodTypePath = (foodTypeId: string) => `${FOOD_TYPES_PATH}/${foodTypeId}`

/** Neue Lebensmittelart, mit der Kategorie schon gewählt */
export const newFoodTypeInCategoryPath = (categoryId: string) =>
  `${NEW_FOOD_TYPE_PATH}?kategorie=${categoryId}`
