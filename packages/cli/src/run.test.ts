import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { computeExitCode, discoverInputs, runCheck } from './run.js'

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '../../../fixtures/i18next')

describe('discoverInputs', () => {
  it('reads a directory into one ParseInput per file with locale from filename', () => {
    const inputs = discoverInputs(fixtures, 'i18next')
    expect(inputs.length).toBeGreaterThan(1)
    const locales = inputs.map((i) => i.locale).sort()
    expect(locales).toContain('en')
    expect(locales).toContain('ru')
    for (const i of inputs) expect(i.content.length).toBeGreaterThan(0)
  })
})

describe('computeExitCode', () => {
  it('is 1 when any error-severity finding exists, else 0', () => {
    expect(computeExitCode([])).toBe(0)
    expect(computeExitCode([{ severity: 'warning' } as never])).toBe(0)
    expect(computeExitCode([{ severity: 'error' } as never])).toBe(1)
  })
})

describe('runCheck', () => {
  it('throws (→ exit 2) when no source is resolvable', () => {
    expect(() =>
      runCheck({ target: fixtures, format: 'i18next', reporter: 'console', fileConfig: {} }),
    ).toThrow(/source/i)
  })

  it('runs the engine over fixtures and returns output + exit code', () => {
    const { output, exitCode } = runCheck({
      target: fixtures,
      source: 'en',
      format: 'i18next',
      reporter: 'console',
      fileConfig: {},
    })
    expect(typeof output).toBe('string')
    expect([0, 1]).toContain(exitCode)
  })
})
