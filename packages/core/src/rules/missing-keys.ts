import type { Catalog, Finding, Rule, Severity } from '../types.js'

const RULE_ID = 'missing-keys'

// Key diffs between the source catalog and each target: keys present in source
// but absent in a target (missing), and keys only in the target (orphan).
export const missingKeys: Rule = (catalogs: Catalog[], config): Finding[] => {
  const severity: Severity = config.rules?.[RULE_ID]?.severity ?? 'error'
  const source = catalogs.find((c) => c.locale === config.source)
  if (!source) return [] // no source loaded → nothing to diff against
  const sourceKeys = new Set(Object.keys(source.entries))
  const findings: Finding[] = []

  for (const cat of catalogs) {
    if (cat === source) continue
    const targetKeys = new Set(Object.keys(cat.entries))

    for (const key of sourceKeys) {
      if (targetKeys.has(key)) continue
      findings.push({
        ruleId: RULE_ID,
        severity,
        locale: cat.locale,
        key,
        file: cat.file,
        message: `Key '${key}' exists in source '${source.locale}' but is missing here.`,
        fixHint: `Add a '${key}' translation for '${cat.locale}'.`,
      })
    }
    for (const key of targetKeys) {
      if (sourceKeys.has(key)) continue
      const entry = cat.entries[key]
      findings.push({
        ruleId: RULE_ID,
        severity: 'warning',
        locale: cat.locale,
        key,
        file: cat.file,
        line: entry?.line,
        col: entry?.col,
        message: `Orphan key '${key}' has no counterpart in source '${source.locale}'.`,
        fixHint: `Remove '${key}' or add it to the source catalog.`,
      })
    }
  }

  return findings
}
