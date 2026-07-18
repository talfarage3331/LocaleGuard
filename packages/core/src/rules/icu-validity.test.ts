import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { runEngine } from '../engine.js'
import { i18nextParser } from '../parsers/i18next.js'
import type { ParseInput } from '../types.js'
import { icuValidity } from './icu-validity.js'

function fixture(dir: string, locale: string): ParseInput {
  const url = new URL(`../../../../fixtures/${dir}/${locale}.json`, import.meta.url)
  return {
    path: `fixtures/${dir}/${locale}.json`,
    content: readFileSync(fileURLToPath(url), 'utf8'),
    locale,
  }
}

function run(files: ParseInput[]) {
  return runEngine({ parser: i18nextParser, source: 'en', files, rules: [icuValidity] }).findings
}

describe('icu-validity (golden fixtures)', () => {
  it('flags unclosed and extra-close braces, ignores valid + quoted braces', () => {
    const f = run([fixture('icu', 'en')])
    const keys = f.map((x) => x.key).sort()
    expect(keys).toEqual(['extraClose', 'unclosed'])
    expect(f.find((x) => x.key === 'unclosed')?.message).toContain('unclosed')
    expect(f.find((x) => x.key === 'extraClose')?.message).toContain('no matching')
  })

  it('does not flag balanced i18next `{{count}}`', () => {
    expect(
      run([{ path: 'ok.json', content: '{"a":"{{count}} items"}', locale: 'en' }]),
    ).toHaveLength(0)
  })

  it('respects a severity override', () => {
    const findings = runEngine({
      parser: i18nextParser,
      source: 'en',
      files: [{ path: 'b.json', content: '{"a":"{oops"}', locale: 'en' }],
      rules: [icuValidity],
      config: { source: 'en', rules: { 'icu-validity': { severity: 'warning' } } },
    }).findings
    expect(findings[0]?.severity).toBe('warning')
  })
})
