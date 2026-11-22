import { describe, expect, it } from 'vitest'
import { escapeHtml, renderMail } from './mail-layout'
import { checkInMail, listNames, weeklySummaryMail } from './mail-templates'

const appUrl = 'https://vorrat.example.org/uebersicht'

describe('weeklySummaryMail', () => {
  it('zeigt die Zeilen der Wochenübersicht als Text und HTML', () => {
    const mail = weeklySummaryMail({
      lines: ['2 Packungen diese Woche verbrauchen: Reis und Mehl.', 'Ziel: 6 von 10 Tagen.'],
      appUrl,
    })
    expect(mail.subject).toBe('Eure Wochenübersicht')
    expect(mail.text).toContain('Wochenübersicht\n\n2 Packungen diese Woche verbrauchen')
    expect(mail.text).toContain(`Vorrat öffnen: ${appUrl}`)
    expect(mail.html).toContain('<p>Ziel: 6 von 10 Tagen.</p>')
    expect(mail.html).toContain(`<a href="${appUrl}">Vorrat öffnen</a>`)
    expect(mail.html).toContain('<html lang="de">')
  })

  it('kommt ohne Link aus, wenn die Adresse der App unbekannt ist', () => {
    const mail = weeklySummaryMail({ lines: ['Ziel: 6 von 10 Tagen.'], appUrl: null })
    expect(mail.text).not.toContain('Vorrat öffnen')
    expect(mail.html).not.toContain('<a ')
  })
})

describe('checkInMail', () => {
  it('nennt Abgelaufenes und bald Fälliges ruhig', () => {
    const mail = checkInMail({ expired: ['Mais'], dueSoon: ['Thunfisch', 'Reis'], appUrl })
    expect(mail.subject).toBe('Zeit für einen Blick in den Vorrat')
    expect(mail.text).toContain('Abgelaufen: Mais. Kurz ansehen und entscheiden.')
    expect(mail.text).toContain('Bald fällig: Thunfisch und Reis.')
  })

  it('freut sich, wenn nichts fällig ist', () => {
    const mail = checkInMail({ expired: [], dueSoon: [], appUrl: null })
    expect(mail.text).toContain('Gerade ist nichts fällig.')
  })
})

describe('listNames', () => {
  it('nennt bis zu fünf Namen, jeden einmal, und fasst den Rest zusammen', () => {
    expect(listNames([])).toBe('')
    expect(listNames(['Reis'])).toBe('Reis')
    expect(listNames(['Reis', 'Reis', 'Mehl'])).toBe('Reis und Mehl')
    expect(listNames(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toBe('a, b, c, d, e und 2 weitere')
  })
})

describe('renderMail', () => {
  it('maskiert Text für HTML', () => {
    const mail = renderMail({
      subject: 'Tom & Jerry',
      heading: '<b>Hallo</b>',
      lines: ['"Reis" <script>'],
      link: null,
    })
    expect(mail.html).toContain('<title>Tom &amp; Jerry</title>')
    expect(mail.html).toContain('&lt;b&gt;Hallo&lt;/b&gt;')
    expect(mail.html).not.toContain('<script>')
    expect(mail.text).toContain('"Reis" <script>')
  })

  it.each(['javascript:alert(1)', 'data:text/html,x', 'kein link'])(
    'lässt den unsicheren Link „%s“ weg',
    (url) => {
      const mail = renderMail({
        subject: 's',
        heading: 'h',
        lines: [],
        link: { url, label: 'Los' },
      })
      expect(mail.html).not.toContain('<a ')
      expect(mail.text).not.toContain('Los:')
    },
  )

  it('maskiert alle Sonderzeichen', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })
})
