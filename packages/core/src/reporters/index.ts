import type { Reporter } from '../types.js'
import { consoleReporter } from './console.js'
import { htmlReporter } from './html.js'
import { jsonReporter } from './json.js'
import { sarifReporter } from './sarif.js'

// Registry for `--reporter <name>` lookup in the CLI.
export const reporters: Record<string, Reporter> = {
  console: consoleReporter,
  json: jsonReporter,
  sarif: sarifReporter,
  html: htmlReporter,
}

export { consoleReporter, htmlReporter, jsonReporter, sarifReporter }
