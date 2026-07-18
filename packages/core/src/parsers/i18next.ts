import type { Catalog, Entry, ParseInput, Parser, PluralCat } from '../types.js'

const PLURAL_RE = /_(zero|one|two|few|many|other)$/

// Flatten nested objects/arrays into dot-separated leaf keys with string values.
function flatten(obj: Record<string, unknown>, prefix: string, out: Record<string, string>): void {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object') {
      flatten(v as Record<string, unknown>, key, out)
    } else {
      out[key] = v == null ? '' : String(v)
    }
  }
}

function parse(input: ParseInput, source: string): Catalog {
  let raw: unknown
  try {
    raw = JSON.parse(input.content)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid i18next JSON in ${input.path}: ${reason}`)
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Invalid i18next JSON in ${input.path}: expected a top-level object`)
  }

  const leaves: Record<string, string> = {}
  flatten(raw as Record<string, unknown>, '', leaves)

  // A base is a plural group iff it has an `_other` leaf — i18next's own invariant
  // (every plural set includes `_other`). This keeps literal keys like a lone
  // `step_one` from being misread as plurals.
  // ponytail: `_other`-anchored detection; a source missing `_other` won't be seen
  // as plural. Upgrade to cross-locale schema detection if that case ever bites.
  const pluralBases = new Set<string>()
  for (const key of Object.keys(leaves)) {
    if (PLURAL_RE.exec(key)?.[1] === 'other') {
      pluralBases.add(key.slice(0, key.length - '_other'.length))
    }
  }

  const entries: Record<string, Entry> = {}
  for (const [key, value] of Object.entries(leaves)) {
    const cat = PLURAL_RE.exec(key)?.[1]
    const base = cat ? key.slice(0, key.length - cat.length - 1) : ''
    if (cat && pluralBases.has(base)) {
      let entry = entries[base]
      if (!entry) {
        entry = { key: base, value: '', plurals: {} }
        entries[base] = entry
      }
      if (!entry.plurals) entry.plurals = {}
      entry.plurals[cat as PluralCat] = value
    } else {
      let entry = entries[key]
      if (!entry) {
        entry = { key, value: '' }
        entries[key] = entry
      }
      entry.value = value
    }
  }

  // Give plural-only entries a representative `.value` (prefer the `other` form).
  for (const entry of Object.values(entries)) {
    if (entry.plurals && !entry.value) {
      entry.value = entry.plurals.other ?? Object.values(entry.plurals)[0] ?? ''
    }
  }

  return { locale: input.locale, source, file: input.path, entries }
}

export const i18nextParser: Parser = { format: 'i18next', parse }
