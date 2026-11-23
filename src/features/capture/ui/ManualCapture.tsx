'use client'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Button } from '@/shared/ui/Button'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import type { CaptureOptions } from '../domain/capture-options'
import { CaptureSaved } from './CaptureSaved'
import { NUTRITION_FIELDS, type CaptureErrors, type CaptureField } from './manual-capture-draft'
import { deriveView } from './manual-capture-view'
import { ManualCaptureFields } from './ManualCaptureFields'
import { useManualCapture } from './use-manual-capture'

type ManualCaptureProps = Readonly<{ options: CaptureOptions }>

/** name-Attribut des Eingabefelds je Feld, damit der Fokus beim Speichern dorthin springt */
const FIELD_INPUTS: Record<Exclude<CaptureField, 'form'>, string> = {
  foodTypeId: 'lebensmittelart',
  content: 'inhalt',
  units: 'mhd',
  kcal: 'kcal',
  protein: 'eiweiss',
  carbs: 'kohlenhydrate',
  fat: 'fett',
}

const isNutritionField = (field: CaptureField) =>
  (NUTRITION_FIELDS as readonly CaptureField[]).includes(field)

const firstMessage = (errors: CaptureErrors) => Object.values(errors).find(Boolean) ?? null

// Manuelles Erfassen (#52, #53, #54): ein Formular, danach Bestätigung mit „Noch eins“.
export function ManualCapture({ options }: ManualCaptureProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isNutritionOpen, setNutritionOpen] = useState(false)

  function focusField(field: CaptureField) {
    if (field === 'form') return
    // Liegt das Feld im zugeklappten Bereich, erst aufklappen, dann fokussieren.
    if (isNutritionField(field)) {
      flushSync(() => {
        setNutritionOpen(true)
      })
    }
    const input = formRef.current?.elements.namedItem(FIELD_INPUTS[field])
    if (input instanceof HTMLElement) input.focus()
  }

  const capture = useManualCapture(options, focusField)
  const view = deriveView(options, capture.draft)

  if (capture.savedUnits !== null) {
    return (
      <CaptureSaved
        unitCount={capture.savedUnits}
        productName={view.productName}
        isFirst={options.isStockEmpty}
        onAnother={() => {
          capture.restart()
          setNutritionOpen(false)
          // Vorbelegung und „Zuletzt genutzt“ neu vom Server holen
          router.refresh()
        }}
      />
    )
  }
  return (
    <form
      ref={formRef}
      noValidate
      aria-label="Produkt erfassen"
      className="pb-6 breit:max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault()
        capture.submit()
      }}
    >
      <ManualCaptureFields
        options={options}
        capture={capture}
        view={view}
        nutritionOpen={{ isOpen: isNutritionOpen, onToggle: setNutritionOpen }}
        onFocus={focusField}
      />
      <LiveMessage message={firstMessage(capture.errors)} />
      <div className="mx-4 flex flex-col gap-3 pt-8 breit:mx-6">
        {capture.errors.form ? (
          <p className="px-4 text-footnote text-red">{capture.errors.form}</p>
        ) : null}
        <Button type="submit" pendingLabel={capture.isSaving ? 'Speichert …' : undefined}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
