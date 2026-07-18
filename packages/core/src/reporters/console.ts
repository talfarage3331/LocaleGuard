import type { Finding, Reporter, Severity } from '../types.js'

// Human-readable output grouped by file. Returns a string (pure/testable);
// the CLI decides where to print it.
// ponytail: plain text, no color — add TTY-aware ANSI when the CLI wires stdout.
export const consoleReporter: Reporter = (findings) => {
  if (findings.length === 0) return '✓ No issues found'

  const byFile = new Map<string, Finding[]>()
  for (const f of findings) {
    const list = byFile.get(f.file) ?? []
    list.push(f)
    byFile.set(f.file, list)
  }

  const lines: string[] = []
  for (const [file, group] of byFile) {
    lines.push(file)
    for (const f of group) {
      const loc = f.line != null ? `${f.line}:${f.col ?? 0}` : '-'
      const key = f.key ? ` ${f.key}` : ''
      lines.push(`  ${loc}  ${f.severity}  ${f.ruleId}${key}  ${f.message} [${f.locale}]`)
      if (f.fixHint) lines.push(`      ↳ ${f.fixHint}`)
    }
  }

  const counts: Record<Severity, number> = { error: 0, warning: 0, info: 0 }
  for (const f of findings) counts[f.severity]++

  lines.push('')
  lines.push(
    `✖ ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info(s) across ${byFile.size} file(s)`,
  )
  return lines.join('\n')
}
