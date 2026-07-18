import type { Reporter, Severity } from '../types.js'

// Machine-readable output: the raw findings plus a severity summary.
// Stable shape — downstream tooling (SaaS ingest, CI scripts) parses this.
export const jsonReporter: Reporter = (findings) => {
  const summary: Record<Severity, number> = { error: 0, warning: 0, info: 0 }
  for (const f of findings) summary[f.severity]++
  return JSON.stringify({ summary, findings }, null, 2)
}
