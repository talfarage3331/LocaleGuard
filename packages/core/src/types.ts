// The shared contract for the whole pipeline:
//   catalogs (files) ──▶ Parser ──▶ Rule[] ──▶ Finding[] ──▶ Reporter[]

export type PluralCat = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

export type Severity = 'error' | 'warning' | 'info'

export interface Entry {
  key: string
  value: string
  plurals?: Partial<Record<PluralCat, string>>
  // Optional source position; filled only by position-aware parsers.
  line?: number
  col?: number
}

export interface Catalog {
  locale: string
  // The source-of-truth locale for this run (e.g. 'en'), stamped on every catalog.
  source: string
  // Path the catalog was parsed from. Deviation from the CLAUDE.md snippet:
  // required so rules can set Finding.file (rules only ever see Catalog[]).
  file: string
  entries: Record<string, Entry>
}

export interface Finding {
  ruleId: string // kebab-case, stable — appears in configs and SARIF
  severity: Severity
  locale: string
  key: string
  file: string
  line?: number
  col?: number
  message: string
  fixHint?: string
}

export interface RuleConfig {
  severity?: Severity
  [option: string]: unknown
}

export interface Config {
  source: string
  rules?: Record<string, RuleConfig>
}

// Rules are pure: (catalogs, config) => Finding[]. No I/O, no side effects.
export type Rule = (catalogs: Catalog[], config: Config) => Finding[]

// One file handed to a parser. File discovery (fs) lives in the CLI, not core.
export interface ParseInput {
  path: string
  content: string
  locale: string
}

// Parsers normalize one file into a Catalog. They never emit findings.
export interface Parser {
  format: string
  parse(input: ParseInput, source: string): Catalog
}

// Reporters consume Finding[] only and return formatted output.
export type Reporter = (findings: Finding[], config?: Config) => string
