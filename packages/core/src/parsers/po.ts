import type { Catalog, Entry, ParseInput, Parser } from '../types.js'

// Gettext `.po` parser. Blocks are separated by blank lines; each has `msgid`,
// `msgstr`, optional `msgctxt` and `msgid_plural` / `msgstr[n]`. Values may span
// multiple adjacent quoted lines, which concatenate.
// ponytail: index-based plural forms (`msgstr[0..n]`) are NOT mapped to CLDR
// categories — that mapping needs the Plural-Forms header's C expression and is
// exactly the fragile logic we avoid. We take `msgstr[0]` as the entry value;
// plural-completeness therefore doesn't run on `.po`. Upgrade only if a caller
// needs per-category .po checks and accepts the header dependency.

// Unescape a gettext-quoted string body (already stripped of surrounding quotes).
function unquote(s: string): string {
  return s.replace(/\\([\\"ntr])/g, (_m, c) =>
    c === 'n' ? '\n' : c === 't' ? '\t' : c === 'r' ? '\r' : c,
  )
}

// Pull the quoted body from a line like `msgid "text"` or a bare `"continuation"`.
function quoted(line: string): string | null {
  const m = /"((?:[^"\\]|\\.)*)"/.exec(line)
  return m ? unquote(m[1] ?? '') : null
}

interface Block {
  msgctxt?: string
  msgid?: string
  msgstr?: string
}

function parse(input: ParseInput, source: string): Catalog {
  const entries: Record<string, Entry> = {}
  const lines = input.content.split(/\r?\n/)

  let block: Block = {}
  let field: keyof Block | null = null

  const flush = () => {
    // Skip the header entry (empty msgid) and empty blocks.
    if (block.msgid) {
      const key = block.msgctxt ? `${block.msgctxt}${block.msgid}` : block.msgid
      entries[key] = { key, value: block.msgstr ?? '' }
    }
    block = {}
    field = null
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') {
      flush()
      continue
    }
    if (trimmed.startsWith('#')) continue // comments

    if (trimmed.startsWith('msgctxt')) {
      field = 'msgctxt'
      block.msgctxt = quoted(trimmed) ?? ''
    } else if (trimmed.startsWith('msgid_plural')) {
      field = null // keep msgid as the key; ignore the plural form's text
    } else if (trimmed.startsWith('msgid')) {
      field = 'msgid'
      block.msgid = quoted(trimmed) ?? ''
    } else if (trimmed.startsWith('msgstr[0]')) {
      field = 'msgstr'
      block.msgstr = quoted(trimmed) ?? ''
    } else if (/^msgstr\[/.test(trimmed)) {
      field = null // other plural indices — ignored (see ponytail note)
    } else if (trimmed.startsWith('msgstr')) {
      field = 'msgstr'
      block.msgstr = quoted(trimmed) ?? ''
    } else if (trimmed.startsWith('"') && field) {
      // Continuation line appends to the current field.
      block[field] = (block[field] ?? '') + (quoted(trimmed) ?? '')
    }
  }
  flush()

  return { locale: input.locale, source, file: input.path, entries }
}

export const poParser: Parser = { format: 'po', parse }
