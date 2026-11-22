// Prompts je Foto-Rolle (DATENKATALOG §8.3). Anbieterneutral, damit ein weiterer Adapter dieselben
// Texte nutzt. Die Form der Antwort legt das Schema fest (Structured Outputs), der Prompt sagt nur,
// was zu lesen ist und dass nichts erfunden wird.
import type { AiRole } from '@/shared/config/ai-roles'
import type { RecognitionRequest, RoleContexts } from './vision-recognizer'

export interface RolePrompt {
  system: string
  /** Steht nach dem Foto in derselben Nachricht (Bild vor Text, laut Doku zur Bild-Eingabe) */
  instruction: string
}

const NEVER_INVENT =
  'Wenn ein Wert nicht sicher lesbar ist, setze null – schätze und erfinde nichts.'
const NEVER_INVENT_DATE =
  'ERFINDE NIEMALS EIN DATUM. Chargennummern, Uhrzeiten und Preise sind kein Datum.'
const BASE =
  'Du liest Aufdrucke auf Lebensmittelverpackungen für eine Vorratsliste in einem Haushalt. ' +
  'Antworte nur mit den Feldern des vorgegebenen Schemas.'

function packagingInstruction({ foodTypes }: RoleContexts['verpackung']): string {
  const list = foodTypes.map((type) => `- ${type.key}: ${type.name}`).join('\n')
  const choice =
    foodTypes.length === 0
      ? 'Es gibt keine Lebensmittelarten zur Auswahl, setze lebensmittelart auf null.'
      : `Wähle lebensmittelart nur aus dieser Liste (Schlüssel: Name), sonst null:\n${list}`
  return `Lies die Verpackung: generische Bezeichnung ohne Marke, Behälter, Füllmenge und Abtropfgewicht. ${choice}`
}

type EstimateContext = RoleContexts['naehrwerte_schaetzen']

function estimateBasis(context: EstimateContext): string {
  const basis = [context.foodType?.name, context.productName].filter(Boolean).join(', ')
  return basis === '' ? '' : ` (${basis})`
}

function estimateInstruction(context: EstimateContext): string {
  return (
    'Es gibt keine Nährwerttabelle. Schätze typische Nährwerte je 100 g bzw. 100 ml ' +
    `für dieses Lebensmittel${estimateBasis(context)}. Das Ergebnis ist ausdrücklich ` +
    'eine Schätzung. Wenn du nicht sinnvoll schätzen kannst, setze null.'
  )
}

// Die KI liefert eine Haltbarkeit in Monaten, kein Datum. So kann ein gelesenes Datum nie mit
// einer Schätzung verwechselt werden. Das Datum rechnet die App.
function bestBeforeEstimateInstruction(context: EstimateContext): string {
  return (
    'Auf der Packung ist kein Mindesthaltbarkeitsdatum lesbar. Schätze, wie viele Monate ' +
    `dieses Lebensmittel${estimateBasis(context)} ab heute typischerweise noch haltbar ist, ` +
    'ungeöffnet und richtig gelagert. Das Ergebnis ist ausdrücklich eine Schätzung, kein ' +
    'gelesenes Datum: Lies kein Datum von der Packung ab. Wähle genauigkeit „jahr“, wenn du ' +
    'nur grob schätzen kannst. Wenn du nicht sinnvoll schätzen kannst, setze null.'
  )
}

const BEST_BEFORE_INSTRUCTION =
  'Lies das Mindesthaltbarkeitsdatum bzw. „zu verbrauchen bis“. Gib roh_text genau wie ' +
  'aufgedruckt an und datum nur, wenn es sicher lesbar ist. Ist nur Monat oder Jahr ' +
  'aufgedruckt, nimm den letzten Tag davon und setze genauigkeit entsprechend.'

type InstructionBuilders = { [R in AiRole]: (context: RoleContexts[R]) => string }

const INSTRUCTIONS: InstructionBuilders = {
  verpackung: packagingInstruction,
  naehrwerte: () =>
    'Lies die Nährwerttabelle wie aufgedruckt: Bezug, Portionsgröße, Brennwert in kcal und kJ, ' +
    'Eiweiß, Kohlenhydrate und Fett.',
  naehrwerte_schaetzen: estimateInstruction,
  mhd: () => BEST_BEFORE_INSTRUCTION,
  mhd_zweitversuch: () => BEST_BEFORE_INSTRUCTION,
  mhd_schaetzen: bestBeforeEstimateInstruction,
}

function systemFor(role: AiRole): string {
  // Die Schätz-Rollen schätzen bewusst (nur auf ausdrückliche Wahl, #124).
  if (role === 'naehrwerte_schaetzen' || role === 'mhd_schaetzen') return BASE
  if (role === 'mhd' || role === 'mhd_zweitversuch') {
    return `${BASE} ${NEVER_INVENT} ${NEVER_INVENT_DATE}`
  }
  return `${BASE} ${NEVER_INVENT}`
}

export function promptForRole<R extends AiRole>(
  request: Pick<RecognitionRequest<R>, 'role' | 'context'>,
): RolePrompt {
  const build: InstructionBuilders[R] = INSTRUCTIONS[request.role]
  return { system: systemFor(request.role), instruction: build(request.context) }
}
