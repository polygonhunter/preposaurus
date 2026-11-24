import { describe, expect, it } from 'vitest'
import { reminderFormSchema, toReminderSettings } from '../schemas'

const valid = {
  isWeeklySummaryEnabled: true,
  weekday: '2',
  time: '18:30',
  isUrgentEnabled: false,
}

describe('reminderFormSchema', () => {
  it('liest Wochentag und Uhrzeit aus dem Formular', () => {
    const parsed = reminderFormSchema.parse(valid)
    expect(toReminderSettings(parsed)).toEqual({
      weeklySummary: { isEnabled: true, weekday: 2, time: '18:30' },
      isUrgentEnabled: false,
    })
  })

  it.each(['', '0', '8', '2.5', 'Samstag'])('lehnt den Wochentag „%s“ ab', (weekday) => {
    const result = reminderFormSchema.safeParse({ ...valid, weekday })
    expect(result.error?.issues[0]?.message).toBe('Bitte einen Wochentag wählen.')
  })

  it.each(['', '24:00', '9:00', '10:60', '10:00:00'])('lehnt die Uhrzeit „%s“ ab', (time) => {
    const result = reminderFormSchema.safeParse({ ...valid, time })
    expect(result.error?.issues[0]?.message).toBe('Bitte eine Uhrzeit wie 10:00 eintragen.')
  })

  it('nimmt Mitternacht und 23:59 an', () => {
    expect(reminderFormSchema.safeParse({ ...valid, time: '00:00' }).success).toBe(true)
    expect(reminderFormSchema.safeParse({ ...valid, time: '23:59' }).success).toBe(true)
  })
})
