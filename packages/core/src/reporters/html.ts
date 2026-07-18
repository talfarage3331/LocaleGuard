import type { Finding, Reporter, Severity } from '../types.js'

// Self-contained static HTML report (inline CSS, no assets). For humans opening
// the file or a CI artifact. Findings can contain arbitrary translation text, so
// every interpolated value is escaped — treat it as untrusted.
export const htmlReporter: Reporter = (findings) => {
  const counts: Record<Severity, number> = { error: 0, warning: 0, info: 0 }
  for (const f of findings) counts[f.severity]++

  const byFile = new Map<string, Finding[]>()
  for (const f of findings) {
    const list = byFile.get(f.file) ?? []
    list.push(f)
    byFile.set(f.file, list)
  }

  const sections = [...byFile]
    .map(([file, group]) => `<section><h2>${esc(file)}</h2>${group.map(row).join('')}</section>`)
    .join('')

  const body =
    findings.length === 0
      ? '<p class="ok">✓ No issues found</p>'
      : `<p class="summary">${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info(s) across ${byFile.size} file(s)</p>${sections}`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>LocaleGuard report</title>
<style>
body{font:14px/1.5 system-ui,sans-serif;margin:2rem;color:#1a1a1a}
h1{font-size:1.4rem}h2{font-size:1rem;margin:1.5rem 0 .5rem;font-family:monospace}
.summary{font-weight:600}.ok{color:#0a0;font-weight:600}
.f{padding:.5rem .75rem;border-left:3px solid #ccc;margin:.25rem 0;background:#fafafa}
.error{border-color:#d00}.warning{border-color:#e90}.info{border-color:#09d}
.meta{color:#666;font-size:.85em}.hint{color:#444;font-style:italic}
code{background:#eee;padding:0 .25em;border-radius:3px}
</style>
</head>
<body>
<h1>LocaleGuard report</h1>
${body}
</body>
</html>
`
}

function row(f: Finding): string {
  const loc = f.line != null ? `${f.line}:${f.col ?? 0}` : '-'
  const key = f.key ? ` <code>${esc(f.key)}</code>` : ''
  const hint = f.fixHint ? `<div class="hint">↳ ${esc(f.fixHint)}</div>` : ''
  return `<div class="f ${f.severity}"><div>${esc(f.message)}${key}</div><div class="meta">${esc(f.ruleId)} · ${esc(f.locale)} · ${esc(loc)} · ${f.severity}</div>${hint}</div>`
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
