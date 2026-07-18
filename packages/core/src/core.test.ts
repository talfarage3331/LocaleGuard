import { describe, expect, it } from 'vitest'
import { runEngine } from './engine.js'
import { i18nextParser } from './parsers/i18next.js'
import { consoleReporter } from './reporters/console.js'

const en = JSON.stringify({
  greeting: 'Hello',
  nav: { home: 'Home' },
  apple_one: 'an apple',
  apple_other: '{{count}} apples',
  step_one: 'First step', // lone `_one`, no `_other` → literal, not a plural
})

const ru = JSON.stringify({
  apple_one: '{{count}} яблоко',
  apple_few: '{{count}} яблока',
  apple_many: '{{count}} яблок',
  apple_other: '{{count}} яблока',
})

describe('i18next parser', () => {
  it('groups plural suffixes anchored on _other', () => {
    const cat = i18nextParser.parse({ path: 'en.json', content: en, locale: 'en' }, 'en')
    expect(cat.entries.apple?.plurals).toEqual({ one: 'an apple', other: '{{count}} apples' })
    // representative value prefers the `other` form
    expect(cat.entries.apple?.value).toBe('{{count}} apples')
  })

  it('flattens nested objects to dot keys', () => {
    const cat = i18nextParser.parse({ path: 'en.json', content: en, locale: 'en' }, 'en')
    expect(cat.entries['nav.home']?.value).toBe('Home')
    expect(cat.entries.greeting?.value).toBe('Hello')
  })

  it('keeps a lone _one key literal when no _other sibling exists', () => {
    const cat = i18nextParser.parse({ path: 'en.json', content: en, locale: 'en' }, 'en')
    expect(cat.entries.step_one?.value).toBe('First step')
    expect(cat.entries.step).toBeUndefined()
  })

  it('captures target-locale plural categories (ru few/many)', () => {
    const cat = i18nextParser.parse({ path: 'ru.json', content: ru, locale: 'ru' }, 'en')
    expect(Object.keys(cat.entries.apple?.plurals ?? {}).sort()).toEqual([
      'few',
      'many',
      'one',
      'other',
    ])
  })
})

describe('engine', () => {
  it('parses catalogs and runs rules', () => {
    const { catalogs, findings } = runEngine({
      parser: i18nextParser,
      source: 'en',
      files: [
        { path: 'en.json', content: en, locale: 'en' },
        { path: 'ru.json', content: ru, locale: 'ru' },
      ],
      rules: [
        (cats) =>
          cats.map((c) => ({
            ruleId: 'stub',
            severity: 'info' as const,
            locale: c.locale,
            key: '',
            file: c.file,
            message: `parsed ${Object.keys(c.entries).length} entries`,
          })),
      ],
    })
    expect(catalogs).toHaveLength(2)
    expect(findings).toHaveLength(2)
  })

  it('degrades a bad file to a parse-error finding, not a throw', () => {
    const { catalogs, findings } = runEngine({
      parser: i18nextParser,
      source: 'en',
      files: [{ path: 'broken.json', content: '{ not json', locale: 'en' }],
    })
    expect(catalogs).toHaveLength(0)
    expect(findings[0]?.ruleId).toBe('parse-error')
    expect(findings[0]?.severity).toBe('error')
  })
})

describe('console reporter', () => {
  it('reports the clean case', () => {
    expect(consoleReporter([])).toBe('✓ No issues found')
  })

  it('groups findings by file with a summary', () => {
    const out = consoleReporter([
      {
        ruleId: 'plural-completeness',
        severity: 'error',
        locale: 'ru',
        key: 'apple',
        file: 'ru.json',
        message: 'missing category: few',
      },
    ])
    expect(out).toContain('ru.json')
    expect(out).toContain('plural-completeness')
    expect(out).toContain('1 error(s)')
  })
})
