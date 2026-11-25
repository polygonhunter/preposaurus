// Konsole des Anbieters, dort legt man unter „API Keys“ einen Schlüssel an.
const ANTHROPIC_KEYS_URL = 'https://platform.claude.com/settings/keys'

// Wo es den Schlüssel gibt und wer abrechnet (#108), für Einstellungen und Einrichtung (#314).
export function AnthropicKeyHint() {
  return (
    <p className="px-4 text-footnote text-fg2">
      Einen Schlüssel legt ihr in der{' '}
      <a
        href={ANTHROPIC_KEYS_URL}
        target="_blank"
        rel="noreferrer"
        className="text-accent underline"
      >
        Konsole von Anthropic
      </a>{' '}
      unter „API Keys“ an. Die Abrechnung läuft direkt über euer Konto dort.
    </p>
  )
}
