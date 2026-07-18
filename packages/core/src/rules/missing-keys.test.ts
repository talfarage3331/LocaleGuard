import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { runEngine } from '../engine.js'
import { i18nextParser } from '../parsers/i18next.js'
import type { ParseInput } from '../types.js'
import { missingKeys } from './missing-keys.js'

function fixture(dir: string, locale: string): ParseInput {
  const url = new URL(`../../../../fixtures/${dir}/${locale}.json`, import.meta.url)
  return {
    path: `fixtures/${dir}/${locale}.json`,
    content: readFileSync(fileURLToPath(url), 'utf8'),
    locale,
  }
}

function run(files: ParseInput[]) {
  return runEngine({ parser: i18nextParser, source: 'en', files, rules: [missingKeys] }).findings
}

describe('missing-keys (golden fixtures)', () => {
  it('reports a missing key (error) and an orphan key (warning)', () => {
    const f = run([fixture('missing-keys', 'en'), fixture('missing-keys', 'fr')])
    const missing = f.find((x) => x.key === 'contact')
    const orphan = f.find((x) => x.key === 'legal')
    expect(missing?.severity).toBe('error')
    expect(missing?.message).toContain('missing here')
    expect(orphan?.severity).toBe('warning')
    expect(orphan?.message).toContain('Orphan')
    expect(f).toHaveLength(2)
  })

  it('no source catalog loaded → no findings', () => {
    expect(run([fixture('missing-keys', 'fr')])).toHaveLength(0)
  })
})
