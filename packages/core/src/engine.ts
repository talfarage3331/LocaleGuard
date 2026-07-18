import type { Catalog, Config, Finding, ParseInput, Parser, Rule } from './types.js'

export interface EngineOptions {
  parser: Parser
  source: string
  files: ParseInput[]
  rules?: Rule[]
  config?: Config
}

export interface EngineResult {
  catalogs: Catalog[]
  findings: Finding[]
}

// The pipeline: parse each file → run rules over all catalogs → collect findings.
// A parse failure degrades to a `parse-error` finding rather than killing the run.
export function runEngine(options: EngineOptions): EngineResult {
  const { parser, source, files } = options
  const catalogs: Catalog[] = []
  const findings: Finding[] = []

  for (const file of files) {
    try {
      catalogs.push(parser.parse(file, source))
    } catch (err) {
      findings.push({
        ruleId: 'parse-error',
        severity: 'error',
        locale: file.locale,
        key: '',
        file: file.path,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const config: Config = options.config ?? { source }
  for (const rule of options.rules ?? []) {
    findings.push(...rule(catalogs, config))
  }

  return { catalogs, findings }
}
