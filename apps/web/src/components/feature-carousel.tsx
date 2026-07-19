'use client'

import { useEffect, useState } from 'react'

interface Slide {
  eyebrow: string
  title: string
  body: string
  benefits: string[]
  code: string[]
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'CLDR-accurate',
    title: 'Plural rule validation',
    body: 'Every plural key is checked against the exact CLDR categories its target language requires — powered by the runtime’s own Intl.PluralRules, never a hand-rolled table.',
    benefits: [
      'one / two / few / many / zero / other per locale',
      'Catches the silent one→other fallback in ru, pl, ar',
      'New Node ships newer CLDR — you inherit it free',
    ],
    code: [
      'ru requires: one · few · many · other',
      'found:       one · few',
      '✖ missing "many", "other"',
    ],
  },
  {
    eyebrow: 'Message-safe',
    title: 'ICU parsing & placeholders',
    body: 'Source and every translation are parsed with the FormatJS ICU parser, so broken syntax and drifting {placeholders} fail the build instead of the user’s screen.',
    benefits: [
      'Malformed ICU caught before it renders',
      'Every {name}, {count}, %s survives translation',
      'No extra placeholders sneak into a target',
    ],
    code: [
      'en: "{count, plural, one {# item} other {# items}}"',
      'de: "{count, plural, one {# Artikel}}"',
      '✖ de: unbalanced braces · missing "other"',
    ],
  },
  {
    eyebrow: 'Format-agnostic',
    title: 'Multi-format discovery',
    body: 'Point it at a folder. i18next JSON, FormatJS, gettext .po and Rails / Django YAML all normalize into one catalog model — the same five checks run everywhere.',
    benefits: [
      'i18next · FormatJS · .po · YAML',
      'One SARIF report → GitHub Code Scanning',
      'Byte-aware overflow checks (VARCHAR / API limits)',
    ],
    code: [
      '$ localeguard check ./locales',
      'scanned 10 locales · 1,284 keys',
      '✓ json · po · yaml — 0 errors',
    ],
  },
]

export function FeatureCarousel() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5200)
    return () => clearInterval(t)
  }, [])

  const s = SLIDES[i] ?? SLIDES[0]!

  return (
    <div className="rounded-3xl border border-border glass p-6 sm:p-10">
      <div className="grid items-center gap-8 md:grid-cols-2">
        {/* code preview */}
        <div className="order-2 overflow-hidden rounded-2xl border border-border bg-canvas/70 md:order-1">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="ml-1 font-mono text-[11px] text-muted">localeguard</span>
          </div>
          <pre className="min-h-[8.5rem] overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed">
            {s.code.map((ln) => (
              <div
                key={ln}
                className={
                  ln.startsWith('✖') ? 'text-err' : ln.startsWith('✓') ? 'text-ok' : 'text-muted'
                }
              >
                {ln}
              </div>
            ))}
          </pre>
        </div>

        {/* copy */}
        <div className="order-1 md:order-2">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-brand">{s.eyebrow}</p>
          <h3 className="text-2xl font-semibold tracking-tight">{s.title}</h3>
          <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
          <ul className="mt-6 space-y-3">
            {s.benefits.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm text-text">
                <svg
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  fill="none"
                  className="mt-0.5 shrink-0 text-ok"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10.5l3.5 3.5L16 5.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* dots */}
      <div className="mt-8 flex items-center justify-center gap-2.5">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Show ${slide.title}`}
            aria-current={idx === i}
            onClick={() => setI(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === i ? 'w-7 bg-brand' : 'w-2 bg-border hover:bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
