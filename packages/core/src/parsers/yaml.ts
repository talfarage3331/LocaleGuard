import type { Catalog, Entry, ParseInput, Parser, PluralCat } from '../types.js'

// Rails/Django i18n YAML. These files are a small, regular subset of YAML:
// indentation-based nested mappings with scalar string leaves. Rails wraps
// everything under a top-level locale key and writes plurals as named CLDR
// sub-keys (`one:` / `other:` / `few:` …) — which map straight onto `entry.plurals`.
// ponytail: intentionally a subset parser — no flow syntax (`{a: 1}`), no lists,
// no anchors, no block scalars (`|` / `>`), no inline `# comment` after a value.
// Upgrade to the `yaml` dep only if real locale files start using those.

const PLURAL_CATS = new Set<PluralCat>(['zero', 'one', 'two', 'few', 'many', 'other'])

// Strip surrounding quotes and unescape the common escapes inside double quotes.
function scalar(raw: string): string {
  const s = raw.trim()
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    return s
      .slice(1, -1)
      .replace(/\\([\\"nt])/g, (_m, c) => (c === 'n' ? '\n' : c === 't' ? '\t' : c))
  }
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) {
    return s.slice(1, -1).replace(/''/g, "'")
  }
  return s
}

type Node = Record<string, unknown>

// Parse the indentation-structured lines into a nested object.
function toTree(content: string, path: string): Node {
  const root: Node = {}
  // Stack of [indent, node] frames; children indent deeper than their parent.
  const stack: [number, Node][] = [[-1, root]]

  for (const line of content.split(/\r?\n/)) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue
    const indent = line.length - line.replace(/^\s+/, '').length
    const colon = line.indexOf(':')
    if (colon === -1)
      throw new Error(`Invalid YAML in ${path}: expected 'key:' at "${line.trim()}"`)

    const key = line.slice(indent, colon).trim()
    const rest = line.slice(colon + 1).trim()

    while (stack.length > 1 && indent <= (stack[stack.length - 1] as [number, Node])[0]) stack.pop()
    const parent = (stack[stack.length - 1] as [number, Node])[1]

    if (rest === '') {
      const child: Node = {}
      parent[key] = child
      stack.push([indent, child])
    } else {
      parent[key] = scalar(rest)
    }
  }
  return root
}

// Walk the tree into flat entries. A mapping whose keys are all CLDR plural
// categories (and includes `other`) becomes a plural entry; otherwise recurse.
function walk(node: Node, prefix: string, entries: Record<string, Entry>): void {
  const keys = Object.keys(node)
  const allPlural = keys.length > 0 && keys.every((k) => PLURAL_CATS.has(k as PluralCat))
  if (allPlural && 'other' in node && prefix) {
    const plurals: Partial<Record<PluralCat, string>> = {}
    for (const k of keys) plurals[k as PluralCat] = String(node[k] ?? '')
    entries[prefix] = { key: prefix, value: plurals.other ?? '', plurals }
    return
  }
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object') {
      walk(v as Node, key, entries)
    } else {
      entries[key] = { key, value: v == null ? '' : String(v) }
    }
  }
}

function parse(input: ParseInput, source: string): Catalog {
  const tree = toTree(input.content, input.path)

  // Rails wraps under a single top-level locale key (`en:`); unwrap it so keys
  // read `apple` not `en.apple`. Django-style flat files have no such wrapper.
  const topKeys = Object.keys(tree)
  let root = tree
  if (topKeys.length === 1) {
    const only = tree[topKeys[0] ?? '']
    if (only && typeof only === 'object') root = only as Node
  }

  const entries: Record<string, Entry> = {}
  walk(root, '', entries)
  return { locale: input.locale, source, file: input.path, entries }
}

export const yamlParser: Parser = { format: 'yaml', parse }
