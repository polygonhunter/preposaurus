import { describe, expect, it } from 'vitest'
import { parseContentQuantity } from '@/shared/lib/quantities'
import { assessPackageQuantity } from './quantity-plausibility'

const assessText = (text: string) => {
  const parsed = parseContentQuantity(text)
  if (!parsed.ok) throw new Error(`nicht lesbar: ${text}`)
  return assessPackageQuantity(parsed.value)
}

describe('assessPackageQuantity', () => {
  it.each(['500 g', '1,5 l', '25 kg', '25 l', '1 g', '1 ml'])('%s ist plausibel', (text) => {
    expect(assessText(text)).toEqual({ status: 'ok' })
  })

  it.each(['1.500 l', '25.001 g', '30 kg'])('%s ist zu groß und wird markiert', (text) => {
    expect(assessText(text)).toEqual({ status: 'review', reason: 'too-large' })
  })

  it.each(['0,5 g', '0,0005 l'])('%s ist zu klein und wird markiert', (text) => {
    expect(assessText(text)).toEqual({ status: 'review', reason: 'too-small' })
  })
})
