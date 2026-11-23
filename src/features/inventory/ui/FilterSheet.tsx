'use client'

import Form from 'next/form'
import { useId, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { Icon } from '@/shared/ui/Icon'
import { Sheet } from '@/shared/ui/Sheet'
import type { StockFilter } from '../schemas/requests'
import type { StockSearch } from '../schemas/stock'
import { RadioList } from './RadioList'
import { STOCK_PARAMS, STOCK_PATH, statusSlug, stockHref } from './stock-paths'

type FilterSheetProps = Readonly<{ filter: StockFilter; options: StockSearch['options'] }>

// Filter-Blatt (UX-Konzept §8.3, P9): Behälter und Lagerort als Auswahllisten statt Dropdowns.
// Die Auswahl landet als GET-Formular in der Adresse, Suche und Zustand bleiben erhalten.
export function FilterSheet({ filter, options }: FilterSheetProps) {
  const [isOpen, setOpen] = useState(false)
  const formId = useId()
  const close = () => {
    setOpen(false)
  }
  return (
    <>
      <Button
        variant="plain"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
        }}
      >
        <Icon name="filter" size={20} />
        Filter
      </Button>
      <Sheet
        isOpen={isOpen}
        onClose={close}
        title="Filter"
        actions={
          <>
            <Button type="submit" form={formId} onClick={close}>
              Anzeigen
            </Button>
            <ButtonLink
              href={stockHref({ search: filter.search, status: filter.status })}
              variant="plain"
            >
              Filter zurücksetzen
            </ButtonLink>
          </>
        }
      >
        <Form id={formId} action={STOCK_PATH} className="flex flex-col gap-4">
          {filter.search ? (
            <input type="hidden" name={STOCK_PARAMS.search} value={filter.search} />
          ) : null}
          {filter.status === 'in-stock' ? null : (
            <input type="hidden" name={STOCK_PARAMS.status} value={statusSlug(filter.status)} />
          )}
          <RadioList
            legend="Behälter"
            name={STOCK_PARAMS.containerId}
            options={options.containers}
            value={filter.containerId}
          />
          <RadioList
            legend="Lagerort"
            name={STOCK_PARAMS.storageLocationId}
            options={options.storageLocations}
            value={filter.storageLocationId}
          />
        </Form>
      </Sheet>
    </>
  )
}
