import { AI_MODEL_CHOICES } from '@/shared/config/ai-roles'
import { RadioChips } from '@/shared/ui/RadioChips'
import { Toggle } from '@/shared/ui/Toggle'
import type { RoleOverview } from '../domain/ai-settings-overview'
import { modelLabel, ROLE_HINTS, ROLE_LABELS } from './ai-labels'

type ConnectionChoice = Readonly<{ id: string; name: string }>

type RoleChoiceFieldsProps = Readonly<{
  role: RoleOverview
  /** Auswahl der Verbindung nur bei mehr als einer Verbindung */
  connections: readonly ConnectionChoice[]
}>

function modelOptions(role: RoleOverview) {
  const models: string[] = [...AI_MODEL_CHOICES]
  // Ein anderes Modell aus einer früheren Zuweisung bleibt wählbar
  if (!models.includes(role.model)) models.push(role.model)
  return models.map((model) => ({
    value: model,
    label: model === role.recommendedModel ? `${modelLabel(model)} · empfohlen` : modelLabel(model),
  }))
}

function recommendationText(role: RoleOverview): string {
  const deviation = role.model === role.recommendedModel ? '' : ' Ihr weicht davon ab.'
  const hint = ROLE_HINTS[role.role]
  return `Empfohlen: ${modelLabel(role.recommendedModel)}.${deviation}${hint ? ` ${hint}` : ''}`
}

// Modell, Verbindung und an/aus einer Foto-Rolle (#108). Die Empfehlung steht immer dabei.
export function RoleChoiceFields({ role, connections }: RoleChoiceFieldsProps) {
  const label = ROLE_LABELS[role.role]
  return (
    <div className="mx-4 flex flex-col gap-2 pt-5 breit:mx-6">
      {role.isSwitchable ? (
        <div className="rounded-group bg-surface px-4 breit:border breit:border-line">
          <Toggle
            label={`${label} nutzen`}
            name={`aktiv-${role.role}`}
            value="an"
            defaultChecked={role.isActive}
          />
        </div>
      ) : null}
      <RadioChips
        legend={`Modell für ${label}`}
        name={`modell-${role.role}`}
        options={modelOptions(role)}
        defaultValue={role.model}
      />
      {connections.length > 1 ? (
        <RadioChips
          legend={`Verbindung für ${label}`}
          name={`verbindung-${role.role}`}
          options={connections.map(({ id, name }) => ({ value: id, label: name }))}
          defaultValue={role.assignedConnectionId ?? undefined}
        />
      ) : null}
      <p className="px-4 text-footnote text-fg2">{recommendationText(role)}</p>
    </div>
  )
}
