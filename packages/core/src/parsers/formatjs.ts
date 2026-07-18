import type { Catalog, Entry, ParseInput, Parser } from '../types.js'

// FormatJS extraction format. Two shapes are common and both handled:
//   flat/compiled:  { "greeting": "Hello {name}" }
//   descriptor:     { "greeting": { "defaultMessage": "Hello {name}", "description": "…" } }
// Plurals live *inside* the ICU string (`{count, plural, …}`), not in the key
// structure — so icu-validity / placeholder-consistency cover them; there are no
// key-suffix plurals to lift into `entry.plurals` here.
function messageOf(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    const m = o.defaultMessage ?? o.message
    if (typeof m === 'string') return m
  }
  return ''
}

function parse(input: ParseInput, source: string): Catalog {
  let raw: unknown
  try {
    raw = JSON.parse(input.content)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid FormatJS JSON in ${input.path}: ${reason}`)
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Invalid FormatJS JSON in ${input.path}: expected a top-level object`)
  }

  const entries: Record<string, Entry> = {}
  for (const [key, v] of Object.entries(raw as Record<string, unknown>)) {
    entries[key] = { key, value: messageOf(v) }
  }
  return { locale: input.locale, source, file: input.path, entries }
}

export const formatjsParser: Parser = { format: 'formatjs', parse }
