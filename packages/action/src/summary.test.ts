import { describe, expect, it } from 'vitest'
import { buildComment, COMMENT_MARKER } from './summary.js'

describe('buildComment', () => {
  it('reports the all-clear when there are no findings', () => {
    const md = buildComment({ summary: { error: 0, warning: 0, info: 0 }, findings: [] })
    expect(md).toContain(COMMENT_MARKER)
    expect(md).toContain('No i18n issues found')
  })

  it('summarizes counts and one row per finding', () => {
    const md = buildComment({
      summary: { error: 1, warning: 1, info: 0 },
      findings: [
        {
          ruleId: 'plural-completeness',
          severity: 'error',
          locale: 'ru',
          key: 'cart.items',
          file: 'ru.json',
          message: 'missing plural category "few"',
        },
        {
          ruleId: 'missing-keys',
          severity: 'warning',
          locale: 'pl',
          key: 'nav.home',
          file: 'pl.json',
          message: 'key absent in target',
        },
      ],
    })
    expect(md).toContain('1 error')
    expect(md).toContain('1 warning')
    expect(md).toContain('plural-completeness')
    expect(md).toContain('missing-keys')
    // marker present so the action can find and update this comment later.
    expect(md.startsWith(COMMENT_MARKER)).toBe(true)
  })
})
