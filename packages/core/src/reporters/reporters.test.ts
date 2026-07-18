import { describe, expect, it } from 'vitest'
import type { Finding } from '../types.js'
import { htmlReporter } from './html.js'
import { jsonReporter } from './json.js'
import { sarifReporter } from './sarif.js'

const findings: Finding[] = [
  {
    ruleId: 'plural-completeness',
    severity: 'error',
    locale: 'ru',
    key: 'apple',
    file: 'locales\\ru.json',
    line: 4,
    col: 2,
    message: 'missing category: few',
    fixHint: 'add apple_few',
  },
  {
    ruleId: 'placeholder-consistency',
    severity: 'warning',
    locale: 'ru',
    key: 'greeting',
    file: 'locales\\ru.json',
    message: 'placeholder {name} missing',
  },
]

describe('json reporter', () => {
  it('emits summary counts and the raw findings', () => {
    const out = JSON.parse(jsonReporter(findings))
    expect(out.summary).toEqual({ error: 1, warning: 1, info: 0 })
    expect(out.findings).toHaveLength(2)
  })
})

describe('sarif reporter', () => {
  it('produces well-formed SARIF 2.1.0 for GitHub Code Scanning', () => {
    const s = JSON.parse(sarifReporter(findings))
    expect(s.version).toBe('2.1.0')
    const run = s.runs[0]
    expect(run.tool.driver.name).toBe('LocaleGuard')
    // one descriptor per distinct ruleId
    expect(run.tool.driver.rules.map((r: { id: string }) => r.id).sort()).toEqual([
      'placeholder-consistency',
      'plural-completeness',
    ])
    expect(run.results).toHaveLength(2)
    const r = run.results[0]
    expect(r.level).toBe('error')
    // GitHub requires forward-slash URIs and startLine >= 1
    const loc = r.locations[0].physicalLocation
    expect(loc.artifactLocation.uri).toBe('locales/ru.json')
    expect(loc.region.startLine).toBe(4)
    expect(loc.region.startColumn).toBe(2)
    // missing position defaults to line 1, no startColumn
    expect(run.results[1].locations[0].physicalLocation.region).toEqual({ startLine: 1 })
  })

  it('is valid JSON with no results for the clean case', () => {
    const s = JSON.parse(sarifReporter([]))
    expect(s.runs[0].results).toEqual([])
  })
})

describe('html reporter', () => {
  it('escapes untrusted finding text', () => {
    const out = htmlReporter([
      {
        ruleId: 'icu-validity',
        severity: 'error',
        locale: 'ru',
        key: '<img src=x onerror=alert(1)>',
        file: 'ru.json',
        message: 'bad <ICU> "syntax"',
      },
    ])
    expect(out).not.toContain('<img src=x')
    expect(out).toContain('&lt;img src=x')
    expect(out).toContain('&lt;ICU&gt;')
  })

  it('shows the clean case', () => {
    expect(htmlReporter([])).toContain('No issues found')
  })
})
