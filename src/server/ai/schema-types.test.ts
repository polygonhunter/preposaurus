// Die Fachlogik (domain/) darf kein Zod importieren und beschreibt die KI-Antworten deshalb mit
// eigenen Typen. Dieser Test hält sie deckungsgleich mit den Zod-Schemas, der einzigen Quelle.
import { describe, expectTypeOf, it } from 'vitest'
import type {
  AiBestBeforeAnswer,
  AiNutritionAnswer,
  AiNutritionEstimateAnswer,
  AiPackagingAnswer,
} from '@/features/capture/domain/ai-answers'
import type { AiRole } from '@/shared/config/ai-roles'
import type {
  BestBeforeAnswer,
  NutritionAnswer,
  NutritionEstimateAnswer,
  PackagingAnswer,
} from '@/features/capture/schemas'
import type { RoleAnswers, RoleContexts } from './vision-recognizer'

describe('Typen der KI-Antworten', () => {
  it('stimmen zwischen Zod-Schema und Fachlogik überein', () => {
    expectTypeOf<PackagingAnswer>().toEqualTypeOf<AiPackagingAnswer>()
    expectTypeOf<NutritionAnswer>().toEqualTypeOf<AiNutritionAnswer>()
    expectTypeOf<NutritionEstimateAnswer>().toEqualTypeOf<AiNutritionEstimateAnswer>()
    expectTypeOf<BestBeforeAnswer>().toEqualTypeOf<AiBestBeforeAnswer>()
  })

  it('decken jede Foto-Rolle ab', () => {
    expectTypeOf<keyof RoleAnswers>().toEqualTypeOf<AiRole>()
    expectTypeOf<keyof RoleContexts>().toEqualTypeOf<AiRole>()
  })
})
