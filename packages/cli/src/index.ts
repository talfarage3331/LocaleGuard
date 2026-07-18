import type { Config } from '@localeguard/core'
import { Command } from 'commander'
import { cosmiconfigSync } from 'cosmiconfig'
import { runCheck } from './run.js'

const program = new Command()

program.name('localeguard').description('Detect silent i18n logic bugs in translation catalogs.')

program
  .command('check')
  .argument('<path>', 'file or directory of translation catalogs')
  .option('-s, --source <locale>', 'source-of-truth locale (e.g. en)')
  .option('-f, --format <format>', 'input format', 'i18next')
  .option('-r, --reporter <name>', 'output format (console, json, sarif, html)', 'console')
  .action((path: string, options: { source?: string; format: string; reporter: string }) => {
    const found = cosmiconfigSync('localeguard').search()
    const fileConfig = (found?.config ?? {}) as Partial<Config>

    try {
      const { output, exitCode } = runCheck({
        target: path,
        source: options.source,
        format: options.format,
        reporter: options.reporter,
        fileConfig,
      })
      process.stdout.write(`${output}\n`)
      process.exit(exitCode)
    } catch (err) {
      // Config errors (bad format/reporter, missing source, unreadable path) → exit 2.
      process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(2)
    }
  })

// `pnpm cli -- check …` forwards the `--` literally as argv[2]; drop it so the
// documented dev-loop invocation reaches the `check` subcommand.
const argv = process.argv.filter((a, i) => !(i === 2 && a === '--'))
program.parse(argv)
