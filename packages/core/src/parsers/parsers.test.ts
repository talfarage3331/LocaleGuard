import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { runEngine } from '../engine.js'
import { defaultRules } from '../rules/index.js'
import type { ParseInput, Parser } from '../types.js'
import { formatjsParser } from './formatjs.js'
import { poParser } from './po.js'
import { yamlParser } from './yaml.js'

function fixture(dir: string, file: string): ParseInput {
  const url = new URL(`../../../../fixtures/${dir}/${file}`, import.meta.url)
  const locale = file.slice(0, file.indexOf('.'))
  return {
    path: `fixtures/${dir}/${file}`,
    content: readFileSync(fileURLToPath(url), 'utf8'),
    locale,
  }
}

function run(parser: Parser, files: ParseInput[]) {
  return runEngine({ parser, source: 'en', files, rules: defaultRules, config: { source: 'en' } })
}

describe('formatjs parser', () => {
  it('reads flat and descriptor shapes into clean entries', () => {
    const cat = formatjsParser.parse(fixture('formatjs', 'en.json'), 'en')
    expect(cat.entries.greeting?.value).toBe('Hello {name}')
    expect(cat.entries.inbox?.value).toContain('plural')
  })

  it('catches a dropped placeholder in a translation', () => {
    const { findings } = run(formatjsParser, [
      fixture('formatjs', 'en.json'),
      fixture('formatjs', 'de.json'),
    ])
    const f = findings.find((x) => x.ruleId === 'placeholder-consistency')
    expect(f?.locale).toBe('de')
    expect(f?.key).toBe('greeting')
    expect(f?.message).toContain("'name'")
  })
})

describe('po parser', () => {
  it('skips the header, keys by msgid, joins continuation lines', () => {
    const cat = poParser.parse(fixture('po', 'en.po'), 'en')
    expect(cat.entries['']).toBeUndefined()
    expect(cat.entries['You have %d messages']?.value).toBe('You have %d messages')
    expect(cat.entries.greeting?.value).toBe('Hello')
  })

  it('catches a dropped printf placeholder', () => {
    const { findings } = run(poParser, [fixture('po', 'en.po'), fixture('po', 'de.po')])
    const f = findings.find((x) => x.ruleId === 'placeholder-consistency')
    expect(f?.locale).toBe('de')
    expect(f?.message).toContain('%d')
  })
})

describe('yaml parser', () => {
  it('unwraps the locale root and lifts named plurals', () => {
    const cat = yamlParser.parse(fixture('yaml', 'en.yml'), 'en')
    expect(cat.entries.greeting?.value).toBe('Hello')
    expect(cat.entries.apple?.plurals?.one).toBe('%{count} apple')
    expect(cat.entries.apple?.plurals?.other).toBe('%{count} apples')
  })

  it('flags a target missing required CLDR plural categories', () => {
    const { findings } = run(yamlParser, [fixture('yaml', 'en.yml'), fixture('yaml', 'ru.yml')])
    const f = findings.find((x) => x.ruleId === 'plural-completeness')
    expect(f?.locale).toBe('ru')
    expect(f?.key).toBe('apple')
    expect(f?.message).toMatch(/few|many/)
  })
})
