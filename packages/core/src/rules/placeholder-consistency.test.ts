import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { runEngine } from '../engine.js'
import { i18nextParser } from '../parsers/i18next.js'
import type { ParseInput } from '../types.js'
import { placeholderConsistency } from './placeholder-consistency.js'

function fixture(dir: string, locale: string): ParseInput {
  const url = new URL(`../../../../fixtures/${dir}/${locale}.json`, import.meta.url)
  return {
    path: `fixtures/${dir}/${locale}.json`,
    content: readFileSync(fileURLToPath(url), 'utf8'),
    locale,
  }
}

function run(files: ParseInput[]) {
  return runEngine({ parser: i18nextParser, source: 'en', files, rules: [placeholderConsistency] })
    .findings
}

describe('placeholder-consistency (golden fixtures)', () => {
  it('flags a swapped {{name}} → {{firstName}}, ignores matching keys', () => {
    const f = run([fixture('placeholder', 'en'), fixture('placeholder', 'de')])
    expect(f).toHaveLength(1)
    expect(f[0]?.key).toBe('greeting')
    expect(f[0]?.message).toContain("missing 'name'")
    expect(f[0]?.message).toContain("unexpected 'firstName'")
  })

  it('flags a dropped printf placeholder', () => {
    const f = run([
      { path: 'en.json', content: '{"x":"%s of %s"}', locale: 'en' },
      { path: 'fr.json', content: '{"x":"%s fait"}', locale: 'fr' },
    ])
    expect(f).toHaveLength(0) // %s set is identical (deduped) — no mismatch
  })

  it('flags a missing single-brace {var}', () => {
    const f = run([
      { path: 'en.json', content: '{"x":"Hi {user}"}', locale: 'en' },
      { path: 'ru.json', content: '{"x":"Privet"}', locale: 'ru' },
    ])
    expect(f).toHaveLength(1)
    expect(f[0]?.message).toContain("missing 'user'")
  })

  it('ignores ICU control blocks (comma) as placeholders', () => {
    const f = run([
      { path: 'en.json', content: '{"x":"{count, plural, other {items}}"}', locale: 'en' },
      { path: 'de.json', content: '{"x":"{count, plural, other {Artikel}}"}', locale: 'de' },
    ])
    expect(f).toHaveLength(0)
  })
})
