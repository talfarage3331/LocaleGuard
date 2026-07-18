import type { Finding, Reporter, Severity } from '../types.js'

// SARIF 2.1.0 — feeds GitHub Code Scanning / PR annotations. Load-bearing:
// malformed SARIF fails silently on GitHub, so keep this strictly to spec.
// Spec: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html

// SARIF `level` vocabulary: none | note | warning | error.
const LEVEL: Record<Severity, 'error' | 'warning' | 'note'> = {
  error: 'error',
  warning: 'warning',
  info: 'note',
}

export const sarifReporter: Reporter = (findings) => {
  // One reportingDescriptor per distinct ruleId, referenced by results via ruleId.
  const ruleIds = [...new Set(findings.map((f) => f.ruleId))]

  const results = findings.map((f) => ({
    ruleId: f.ruleId,
    level: LEVEL[f.severity],
    message: { text: f.fixHint ? `${f.message} (${f.fixHint})` : f.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: toUri(f.file) },
          // GitHub requires a region with startLine >= 1; default to 1 when a
          // parser gave no position.
          region: region(f),
        },
      },
    ],
    // Surface locale/key without polluting the human-facing message.
    properties: { locale: f.locale, key: f.key },
  }))

  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'LocaleGuard',
            informationUri: 'https://github.com/localeguard/localeguard',
            rules: ruleIds.map((id) => ({ id })),
          },
        },
        results,
      },
    ],
  }

  return JSON.stringify(sarif, null, 2)
}

function region(f: Finding) {
  const startLine = f.line && f.line >= 1 ? f.line : 1
  const region: { startLine: number; startColumn?: number } = { startLine }
  if (f.col && f.col >= 1) region.startColumn = f.col
  return region
}

// SARIF artifact URIs must be relative with forward slashes.
function toUri(file: string): string {
  return file.replace(/\\/g, '/')
}
