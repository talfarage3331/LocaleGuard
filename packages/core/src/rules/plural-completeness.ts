import type { Catalog, Finding, PluralCat, Rule, Severity } from '../types.js'

const RULE_ID = 'plural-completeness'

// Required CLDR categories per locale, straight from Intl.PluralRules — the
// source of truth. Never hand-roll this; newer Node ships newer CLDR data.
const requiredCache = new Map<string, PluralCat[] | null>()
function requiredCategories(locale: string): PluralCat[] | null {
  const hit = requiredCache.get(locale)
  if (hit !== undefined) return hit
  let cats: PluralCat[] | null
  try {
    cats = new Intl.PluralRules(locale).resolvedOptions().pluralCategories as PluralCat[]
  } catch {
    cats = null // unresolvable locale — degrade, don't throw
  }
  requiredCache.set(locale, cats)
  return cats
}

// Every plural key must carry exactly the CLDR plural categories its locale
// requires. A missing `few`/`many`/`zero` is a silent fallback bug in prod.
export const pluralCompleteness: Rule = (catalogs: Catalog[], config): Finding[] => {
  const severity: Severity = config.rules?.[RULE_ID]?.severity ?? 'error'
  const findings: Finding[] = []

  for (const cat of catalogs) {
    const required = requiredCategories(cat.locale)
    if (!required) {
      findings.push({
        ruleId: RULE_ID,
        severity: 'warning',
        locale: cat.locale,
        key: '',
        file: cat.file,
        message: `Unknown locale '${cat.locale}'; cannot resolve CLDR plural categories.`,
      })
      continue
    }

    for (const entry of Object.values(cat.entries)) {
      if (!entry.plurals) continue
      const present = new Set(Object.keys(entry.plurals))
      const missing = required.filter((c) => !present.has(c))
      if (missing.length === 0) continue
      findings.push({
        ruleId: RULE_ID,
        severity,
        locale: cat.locale,
        key: entry.key,
        file: cat.file,
        line: entry.line,
        col: entry.col,
        message: `Plural key '${entry.key}' is missing CLDR categor${
          missing.length === 1 ? 'y' : 'ies'
        } ${missing.map((c) => `'${c}'`).join(', ')} required for '${cat.locale}'.`,
        fixHint: `Add ${missing.map((c) => `${entry.key}_${c}`).join(', ')} (required: ${required.join(', ')}).`,
      })
    }
  }

  return findings
}
