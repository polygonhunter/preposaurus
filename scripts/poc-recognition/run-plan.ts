// Welche Varianten je Foto-Rolle gemessen werden: je gewähltem Modell ein Durchlauf, beim MHD ohne
// Zweitversuch, damit jedes Modell für sich steht. Dazu beim MHD die Standard-Strategie der App
// (#114): erstes Modell laut Empfehlung, Zweitversuch mit dem Modell von mhd_zweitversuch.
import { AI_ROLE_DEFAULT_MODELS, type AiRole } from '../../src/shared/config/ai-roles'
import type { PhotoRole } from '../../src/shared/config/constants'

export interface Variant {
  role: PhotoRole
  /** Name im Bericht: die Modell-ID oder „Standard …“ */
  label: string
  /** Wie PreparedRecognition.models: Fehlt mhd_zweitversuch, gibt es keinen Zweitversuch */
  models: Partial<Record<AiRole, string>>
}

interface PlanInput {
  roles: readonly PhotoRole[]
  modelsByRole: Readonly<Record<PhotoRole, readonly string[]>>
  withStandard: boolean
}

function standardBestBefore(): Variant {
  const first = AI_ROLE_DEFAULT_MODELS.mhd
  const second = AI_ROLE_DEFAULT_MODELS.mhd_zweitversuch
  return {
    role: 'mhd',
    label: `Standard: ${first}, Zweitversuch ${second}`,
    models: { mhd: first, mhd_zweitversuch: second },
  }
}

export function planVariants({ roles, modelsByRole, withStandard }: PlanInput): Variant[] {
  return roles.flatMap((role) => {
    const single = modelsByRole[role].map((model) => ({
      role,
      label: model,
      models: { [role]: model },
    }))
    return role === 'mhd' && withStandard ? [...single, standardBestBefore()] : single
  })
}
