import type { Catalog, Entry, Finding, Rule, Severity } from '../types.js'

const RULE_ID = 'icu-validity'

// Strip ICU quoted literals so `'{'` / `'}'` don't count as structural braces:
// `''` is a literal apostrophe, `'…'` is a quoted span.
function stripQuotes(s: string): string {
  return s.replace(/''/g, '').replace(/'[^']*'/g, '')
}

// Depth of the first unbalanced brace, or null if balanced.
// ponytail: brace-balance only, not a full ICU parse (no arg-type/keyword
// checks). Upgrade to @formatjs's parser if syntax errors past brace balance
// (bad plural keywords, missing `other`) start slipping through.
function unbalanced(text: string): 'extra-close' | 'unclosed' | null {
  let depth = 0
  for (const ch of stripQuotes(text)) {
    if (ch === '{') depth++
    else if (ch === '}' && --depth < 0) return 'extra-close'
  }
  return depth > 0 ? 'unclosed' : null
}

function texts(entry: Entry): [string, string][] {
  const out: [string, string][] = []
  if (entry.value) out.push([entry.key, entry.value])
  for (const [cat, v] of Object.entries(entry.plurals ?? {})) out.push([`${entry.key}_${cat}`, v])
  return out
}

// ICU MessageFormat strings must be syntactically valid; a stray brace throws
// at format() time in production. Runs on source and targets alike.
export const icuValidity: Rule = (catalogs: Catalog[], config): Finding[] => {
  const severity: Severity = config.rules?.[RULE_ID]?.severity ?? 'error'
  const findings: Finding[] = []

  for (const cat of catalogs) {
    for (const entry of Object.values(cat.entries)) {
      for (const [label, text] of texts(entry)) {
        const bad = unbalanced(text)
        if (!bad) continue
        findings.push({
          ruleId: RULE_ID,
          severity,
          locale: cat.locale,
          key: label,
          file: cat.file,
          line: entry.line,
          col: entry.col,
          message:
            bad === 'unclosed'
              ? `'${label}' has an unclosed '{' (unbalanced ICU braces).`
              : `'${label}' has a '}' with no matching '{' (unbalanced ICU braces).`,
          fixHint: `Balance the braces in the ${cat.locale} string.`,
        })
      }
    }
  }

  return findings
}
