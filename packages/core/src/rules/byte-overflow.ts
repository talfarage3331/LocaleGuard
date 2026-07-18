import type { Catalog, Entry, Finding, Rule, Severity } from '../types.js'

const RULE_ID = 'byte-overflow'
const DEFAULT_MAX_BYTES = 255

// All translatable text an entry carries: its value plus every plural form.
function texts(entry: Entry): [string, string][] {
  const out: [string, string][] = []
  if (entry.value) out.push([entry.key, entry.value])
  for (const [cat, v] of Object.entries(entry.plurals ?? {})) out.push([`${entry.key}_${cat}`, v])
  return out
}

// Strings exceeding a configured UTF-8 byte length risk VARCHAR/DB/API
// truncation. Byte-aware on purpose — `str.length` (chars) is the wrong unit.
export const byteOverflow: Rule = (catalogs: Catalog[], config): Finding[] => {
  const cfg = config.rules?.[RULE_ID]
  const severity: Severity = cfg?.severity ?? 'warning'
  const maxBytes = typeof cfg?.maxBytes === 'number' ? cfg.maxBytes : DEFAULT_MAX_BYTES
  const findings: Finding[] = []

  for (const cat of catalogs) {
    for (const entry of Object.values(cat.entries)) {
      for (const [label, text] of texts(entry)) {
        const bytes = Buffer.byteLength(text, 'utf8')
        if (bytes <= maxBytes) continue
        findings.push({
          ruleId: RULE_ID,
          severity,
          locale: cat.locale,
          key: label,
          file: cat.file,
          line: entry.line,
          col: entry.col,
          message: `'${label}' is ${bytes} bytes, over the ${maxBytes}-byte limit.`,
          fixHint: `Shorten the ${cat.locale} string or raise byte-overflow.maxBytes.`,
        })
      }
    }
  }

  return findings
}
