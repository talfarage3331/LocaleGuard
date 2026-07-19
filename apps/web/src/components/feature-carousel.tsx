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
    eyebrow: 'Zero-dependency',
    title: 'Multi-format linting',
    body: 'Point it at a folder. i18next JSON, FormatJS, gettext .po and Rails / Django YAML all normalize into one catalog model — the same five checks run everywhere, no plugins to wire up.',
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
  {
    eyebrow: 'Right on the PR',
    title: 'Rich PR decorations & new-only blocking',
    body: 'Findings land as inline review comments where the bug is. New-only mode blocks the merge on bugs your branch introduced, without drowning you in the backlog you inherited.',
    benefits: [
      'Inline annotations at the exact key',
      'Fail the build on new bugs only',
      'Legacy findings surfaced, never blocking',
    ],
    code: [
      'PR #248 · locales/ru/messages.json',
      '✖ new: plural-completeness (ru) missing "many"',
      '· 3 pre-existing findings — reported, not blocked',
    ],
  },
  {
    eyebrow: 'For the whole team',
    title: 'Alerts & manager dashboards',
    body: 'Route failures to Slack or Teams the moment they land, and give engineering managers a reporting dashboard of i18n health across every repo — trends, top offenders, and time-to-green.',
    benefits: [
      'Slack + Teams alerts on failing scans',
      'Org-wide i18n health dashboards',
      'Trends, top rules, and time-to-green',
    ],
    code: [
      '#eng-alerts  localeguard',
      '✖ checkout-web failed · 2 new plural bugs (ru, pl)',
      '✓ trend: 94% green over last 30 days',
    ],
  },
]

export function FeatureCarousel() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5200)
    return () => clearInterval(t)
  }, [])

  const s = SLIDES[i] ?? SLIDES[0]
  if (!s) return null

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
