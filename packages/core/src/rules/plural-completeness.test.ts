import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { runEngine } from '../engine.js'
import { i18nextParser } from '../parsers/i18next.js'
import type { ParseInput } from '../types.js'
import { pluralCompleteness } from './plural-completeness.js'

// Load a golden fixture from the repo-root fixtures/ dir.
function fixture(locale: string): ParseInput {
  const url = new URL(`../../../../fixtures/i18next/${locale}.json`, import.meta.url)
  return {
    path: `fixtures/i18next/${locale}.json`,
    content: readFileSync(fileURLToPath(url), 'utf8'),
    locale,
  }
}

function findingsFor(locale: string) {
  const { findings } = runEngine({
    parser: i18nextParser,
    source: 'en',
    files: [fixture(locale)],
    rules: [pluralCompleteness],
  })
  return findings
}

describe('plural-completeness (golden fixtures)', () => {
  it('flags ru banana missing the "many" category', () => {
    const f = findingsFor('ru')
    expect(f).toHaveLength(1)
    expect(f[0]?.key).toBe('banana')
    expect(f[0]?.message).toContain("'many'")
    expect(f[0]?.fixHint).toContain('banana_many')
  })

  it('flags pl banana missing the "few" category', () => {
    const f = findingsFor('pl')
    expect(f).toHaveLength(1)
    expect(f[0]?.key).toBe('banana')
    expect(f[0]?.message).toContain("'few'")
  })

  it('flags ar banana missing zero/two/few/many (one finding, all categories)', () => {
    const f = findingsFor('ar')
    expect(f).toHaveLength(1)
    for (const c of ['zero', 'two', 'few', 'many']) expect(f[0]?.message).toContain(`'${c}'`)
  })

  it('never false-positives on ja (only "other" required)', () => {
    expect(findingsFor('ja')).toHaveLength(0)
  })

  it('passes clean en source (one/other complete)', () => {
    expect(findingsFor('en')).toHaveLength(0)
  })

  it('respects a severity override from config', () => {
    const { findings } = runEngine({
      parser: i18nextParser,
      source: 'en',
      files: [fixture('ru')],
      rules: [pluralCompleteness],
      config: { source: 'en', rules: { 'plural-completeness': { severity: 'warning' } } },
    })
    expect(findings[0]?.severity).toBe('warning')
  })

  it('degrades an unknown locale to a warning, not a throw', () => {
    const { findings } = runEngine({
      parser: i18nextParser,
      source: 'en',
      files: [{ path: 'zz.json', content: '{"apple_other":"x"}', locale: 'not-a-locale!!' }],
      rules: [pluralCompleteness],
    })
    expect(
      findings.some((x) => x.severity === 'warning' && x.message.includes('Unknown locale')),
    ).toBe(true)
  })
})
