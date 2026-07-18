import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import {
  type Config,
  defaultRules,
  type Finding,
  i18nextParser,
  type ParseInput,
  type Parser,
  reporters,
  runEngine,
} from '@localeguard/core'

// Format registry. One parser today; add a line when a new parser lands in core.
export const parsers: Record<string, Parser> = {
  i18next: i18nextParser,
}

// File extensions each format reads, for directory discovery.
const extensions: Record<string, string> = {
  i18next: '.json',
}

// Walk a file or directory into ParseInput[]. Locale = filename without extension
// (en.json → 'en'), matching the fixture layout. Reads content here so core stays
// filesystem-free.
export function discoverInputs(target: string, format: string): ParseInput[] {
  const ext = extensions[format] ?? ''
  const files = statSync(target).isDirectory()
    ? readdirSync(target)
        .filter((f) => f.endsWith(ext))
        .map((f) => join(target, f))
    : [target]

  return files.map((path) => ({
    path,
    content: readFileSync(path, 'utf8'),
    locale: basename(path, extname(path)),
  }))
}

// CI exit code: 2 config error (handled by caller), 1 if any error-severity
// finding, else 0. This mapping is an API — see CLAUDE.md.
export function computeExitCode(findings: Finding[]): 0 | 1 {
  return findings.some((f) => f.severity === 'error') ? 1 : 0
}

export interface CheckOptions {
  target: string
  source?: string
  format: string
  reporter: string
  fileConfig: Partial<Config>
}

export interface CheckResult {
  output: string
  exitCode: 0 | 1
}

// Full check: resolve config, discover files, run the engine, format output.
// Throws on config errors (unknown format/reporter, missing source) — the caller
// maps those to exit code 2.
export function runCheck(opts: CheckOptions): CheckResult {
  const source = opts.source ?? opts.fileConfig.source
  if (!source) {
    throw new Error('No source locale: pass --source <locale> or set "source" in config.')
  }

  const parser = parsers[opts.format]
  if (!parser) {
    throw new Error(`Unknown format "${opts.format}". Known: ${Object.keys(parsers).join(', ')}.`)
  }

  const reporter = reporters[opts.reporter]
  if (!reporter) {
    throw new Error(
      `Unknown reporter "${opts.reporter}". Known: ${Object.keys(reporters).join(', ')}.`,
    )
  }

  const config: Config = { ...opts.fileConfig, source }
  const files = discoverInputs(opts.target, opts.format)
  const { findings } = runEngine({ parser, source, files, rules: defaultRules, config })

  return { output: reporter(findings, config), exitCode: computeExitCode(findings) }
}
