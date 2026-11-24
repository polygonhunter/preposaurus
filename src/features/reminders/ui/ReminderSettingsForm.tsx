'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Field } from '@/shared/ui/Field'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { RadioChips } from '@/shared/ui/RadioChips'
import { Toggle } from '@/shared/ui/Toggle'
import { REMINDER_FORM_IDLE, type ReminderFormValues } from '../actions/reminder-form-state'
import { saveReminderSettingsAction } from '../actions/save-reminder-settings-action'
import type { ReminderSettings } from '../domain/reminder-settings'
import { URGENT_EXPLANATION, WEEKLY_SUMMARY_EXPLANATION } from './reminder-explanations'
import { WEEKDAY_OPTIONS } from './reminder-format'

type ReminderSettingsFormProps = Readonly<{ settings: ReminderSettings }>

const SWITCH_BOX = 'mx-4 rounded-group bg-surface px-4 breit:mx-6 breit:border breit:border-line'

const toValues = ({ weeklySummary, isUrgentEnabled }: ReminderSettings): ReminderFormValues => ({
  isWeeklySummaryEnabled: weeklySummary.isEnabled,
  weekday: String(weeklySummary.weekday),
  time: weeklySummary.time,
  isUrgentEnabled,
})

// Erinnerungen des Haushalts (ERI-02, ERI-03, #89): Wochenübersicht mit Tag und Uhrzeit und
// „Dringend“. Ein Formular mit einem „Speichern“, weil beide zusammen höchstens eine Nachricht am
// Tag ergeben. Nur der Admin sieht es, Mitglieder bekommen die Werte lesend.
export function ReminderSettingsForm({ settings }: ReminderSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveReminderSettingsAction,
    REMINDER_FORM_IDLE,
  )
  const values = state.values ?? toValues(settings)
  const { errors } = state
  return (
    <ActionForm
      result={state}
      announcement={errors.time ?? errors.weekday}
      action={formAction}
      submit={{ label: 'Speichern', isPending, status: state, isInset: true }}
      aria-label="Erinnerungen"
      className="flex flex-col"
    >
      <GroupHeader id="wochenuebersicht">Wochenübersicht</GroupHeader>
      <div className={SWITCH_BOX}>
        <Toggle
          label="Wochenübersicht"
          name="wochenuebersicht"
          value="an"
          defaultChecked={values.isWeeklySummaryEnabled}
        />
      </div>
      <div className="mx-4 flex flex-col gap-4 pt-4 breit:mx-6">
        <RadioChips
          legend="Wochentag"
          name="wochentag"
          options={WEEKDAY_OPTIONS}
          defaultValue={values.weekday}
          error={errors.weekday}
        />
        <Field
          label="Uhrzeit"
          name="uhrzeit"
          type="time"
          required
          defaultValue={values.time}
          error={errors.time}
        />
      </div>
      <GroupFooter>{WEEKLY_SUMMARY_EXPLANATION}</GroupFooter>
      <GroupHeader id="dringend">Dringend</GroupHeader>
      <div className={SWITCH_BOX}>
        <Toggle
          label="Dringend"
          name="dringend"
          value="an"
          defaultChecked={values.isUrgentEnabled}
        />
      </div>
      <GroupFooter>{URGENT_EXPLANATION}</GroupFooter>
    </ActionForm>
  )
}
