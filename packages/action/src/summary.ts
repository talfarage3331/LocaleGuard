import type { Finding, Severity } from '@localeguard/core'

// Hidden marker so we can find and update our own PR comment instead of piling
// up a new one on every run.
export const COMMENT_MARKER = '<!-- localeguard -->'

const ICON: Record<Severity, string> = { error: '🔴', warning: '🟡', info: 'ℹ️' }

export interface Report {
  summary: Record<Severity, number>
  findings: Finding[]
}

// Build the PR comment / job-summary markdown from a run's findings.
export function buildComment(report: Report): string {
  const { error, warning, info } = report.summary
  const total = error + warning + info

  if (total === 0) {
    return `${COMMENT_MARKER}\n### ✅ LocaleGuard\n\nNo i18n issues found.`
  }

  const counts = [
    error ? `${ICON.error} ${error} error${error === 1 ? '' : 's'}` : '',
    warning ? `${ICON.warning} ${warning} warning${warning === 1 ? '' : 's'}` : '',
    info ? `${ICON.info} ${info} info` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const rows = report.findings
    .map(
      (f) =>
        `| ${ICON[f.severity]} | \`${f.ruleId}\` | ${f.locale} | \`${f.key}\` | ${f.message} |`,
    )
    .join('\n')

  return [
    COMMENT_MARKER,
    `### LocaleGuard — ${counts}`,
    '',
    '| | Rule | Locale | Key | Message |',
    '| --- | --- | --- | --- | --- |',
    rows,
  ].join('\n')
}
