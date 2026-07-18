import type { Rule } from '../types.js'
import { pluralCompleteness } from './plural-completeness.js'

// The rule registry, keyed by ruleId. The CLI/engine selects from here and a
// rule can be disabled via config. Register new rules by adding one line.
export const rules: Record<string, Rule> = {
  'plural-completeness': pluralCompleteness,
}

// Default rule set: every registered rule, in registration order.
export const defaultRules: Rule[] = Object.values(rules)

export { pluralCompleteness }
