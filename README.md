# LocaleGuard

**Catch silent i18n logic bugs in CI — before they ship to production.**

LocaleGuard detects the translation bugs that pass your English tests, break in
Russian, Polish, and Arabic, and only surface once a real user hits them: a
missing plural category that silently falls back, a dropped `{count}`
placeholder, an ICU message that won't compile, a string that overflows a
`VARCHAR`.

It is **not** a TMS (Lokalise, Crowdin, Phrase manage your strings) and **not**
visual testing (Percy, Applitools test pixels). It fills the gap none of them
cover: the **functional correctness of your localized logic**.

---

## Why LocaleGuard

- **Zero runtime dependencies for plural correctness** — plural rules come
  straight from Node's built-in `Intl.PluralRules` (CLDR). We never hand-roll
  locale data, so we never drift from the standard.
- **Lightning fast** — pure in-memory analysis, no network, no database. Runs in
  milliseconds as a CI gate.
- **Stops silent fallbacks** — a missing `few`/`many`/`zero` plural form is the
  bug class that ships green and breaks in production. This is the wedge.
- **Multi-format** — one tool across i18next JSON, FormatJS, Gettext `.po`, and
  Rails/Django YAML.
- **CI-native** — proper exit codes, SARIF for GitHub Code Scanning, and a
  drop-in GitHub Action with PR comments.

## What it checks

| Check | Catches |
|---|---|
| **Plural completeness** | Missing CLDR plural categories a language requires (`one/two/few/many/zero/other`) — the silent fallback bug. |
| **ICU message validity** | Invalid or inconsistent ICU syntax across source and targets. |
| **Placeholder consistency** | A `{name}`, `{count}`, or `%s` present in the source but missing from a translation (or vice versa). |
| **Byte overflow** | Strings exceeding a configured byte length (VARCHAR/DB/API limits), multibyte-aware. |
| **Missing / orphan keys** | Key diffs between source and target catalogs. |

---

## Installation

```bash
# CLI (run locally or in CI)
npm install -D @localeguard/cli
# or
pnpm add -D @localeguard/cli
```

Requires **Node 20+** (newer Node ships newer CLDR plural data).

## CLI usage

```bash
# Check a directory of i18next catalogs against the English source
localeguard check ./locales --source en --format i18next

# Other formats
localeguard check ./locales --format formatjs --source en
localeguard check ./locales --format po      --source en
localeguard check ./locales --format yaml    --source en

# Machine-readable output
localeguard check ./locales --source en --reporter json
localeguard check ./locales --source en --reporter sarif
localeguard check ./locales --source en --reporter html
```

**Options**

| Flag | Description | Default |
|---|---|---|
| `-s, --source <locale>` | Source-of-truth locale (e.g. `en`). | — (required) |
| `-f, --format <format>` | `i18next`, `formatjs`, `po`, `yaml`. | `i18next` |
| `-r, --reporter <name>` | `console`, `json`, `sarif`, `html`. | `console` |

Config can also live in a `localeguard` config file (`.localeguardrc`,
`localeguard.config.js`, or a `localeguard` key in `package.json`) via
[cosmiconfig](https://github.com/cosmiconfig/cosmiconfig).

**Exit codes** (these are an API — safe to gate CI on):

| Code | Meaning |
|---|---|
| `0` | Clean — no error-severity findings. |
| `1` | Error-severity findings present. |
| `2` | Config error (bad format/reporter, missing source, unreadable path). |

## GitHub Action

Runs the CLI, uploads SARIF to GitHub Code Scanning, and posts a findings
summary on the PR. Drop this in `.github/workflows/localeguard.yml`:

```yaml
name: LocaleGuard
on: [pull_request]

permissions:
  contents: read
  security-events: write   # upload SARIF
  pull-requests: write     # PR comment

jobs:
  i18n:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: talfarage3331/LocaleGuard@v1
        with:
          path: ./locales
          source: en
          format: i18next

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: localeguard.sarif
```

**Action inputs**

| Input | Description | Default |
|---|---|---|
| `path` | File or directory of catalogs to check. | — (required) |
| `source` | Source-of-truth locale. | config file |
| `format` | Input format. | `i18next` |
| `sarif-file` | Where to write the SARIF report. | `localeguard.sarif` |
| `comment` | Post a findings summary as a PR comment. | `true` |
| `fail-on-error` | Fail the job on any error-severity finding. | `true` |

---

## Packages

| Package | License | What it is |
|---|---|---|
| [`@localeguard/core`](packages/core) | MIT | The engine: parsers, rules, reporters. |
| [`@localeguard/cli`](packages/cli) | MIT | The `localeguard` command. |
| [`@localeguard/action`](packages/action) | MIT | The GitHub Action wrapper. |

LocaleGuard is **open-core**: the engine, CLI, and Action are MIT and fully
functional standalone. Hosted history, multi-repo dashboards, and the PR bot
are the paid SaaS layer.

## Development

```bash
pnpm install
pnpm check   # typecheck + lint + test + build — the full gate
```

## License

MIT for `core`, `cli`, and `action`. See individual packages.
