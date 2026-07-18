import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { runEngine } from '../engine.js'
import { i18nextParser } from '../parsers/i18next.js'
import type { Config, ParseInput } from '../types.js'
import { byteOverflow } from './byte-overflow.js'

function fixture(dir: string, locale: string): ParseInput {
  const url = new URL(`../../../../fixtures/${dir}/${locale}.json`, import.meta.url)
  return {
    path: `fixtures/${dir}/${locale}.json`,
    content: readFileSync(fileURLToPath(url), 'utf8'),
    locale,
  }
}

function run(files: ParseInput[], config?: Config) {
  return runEngine({ parser: i18nextParser, source: 'en', files, rules: [byteOverflow], config })
    .findings
}

describe('byte-overflow (golden fixtures)', () => {
  it('measures UTF-8 bytes, not chars: 5 snowmen (15 bytes) over a 10-byte limit', () => {
    const f = run([fixture('byte-overflow', 'en')], {
      source: 'en',
      rules: { 'byte-overflow': { maxBytes: 10 } },
    })
    expect(f).toHaveLength(1)
    expect(f[0]?.key).toBe('snowman')
    expect(f[0]?.message).toContain('15 bytes')
  })

  it('passes clean under the default 255-byte limit', () => {
    expect(run([fixture('byte-overflow', 'en')])).toHaveLength(0)
  })

  it('defaults to warning severity', () => {
    const f = run([fixture('byte-overflow', 'en')], {
      source: 'en',
      rules: { 'byte-overflow': { maxBytes: 10 } },
    })
    expect(f[0]?.severity).toBe('warning')
  })
})
