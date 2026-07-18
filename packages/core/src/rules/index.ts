import type { Rule } from '../types.js'
import { byteOverflow } from './byte-overflow.js'
import { icuValidity } from './icu-validity.js'
import { missingKeys } from './missing-keys.js'
import { placeholderConsistency } from './placeholder-consistency.js'
import { pluralCompleteness } from './plural-completeness.js'

// The rule registry, keyed by ruleId. The CLI/engine selects from here and a
// rule can be disabled via config. Register new rules by adding one line.
export const rules: Record<string, Rule> = {
  'plural-completeness': pluralCompleteness,
  'icu-validity': icuValidity,
  'placeholder-consistency': placeholderConsistency,
  'missing-keys': missingKeys,
  'byte-overflow': byteOverflow,
}

// Default rule set: every registered rule, in registration order.
export const defaultRules: Rule[] = Object.values(rules)

export { byteOverflow, icuValidity, missingKeys, placeholderConsistency, pluralCompleteness }
