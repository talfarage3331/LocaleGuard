'use client'

import { useEffect, useRef, useState } from 'react'

// Fully client-side, deterministic demo of the byte-overflow check. Runs on
// local state only — no Drizzle, no fetch, no /api. Nothing here touches the
// backend; it exists purely to show a non-technical visitor what the product
// catches on a PR.

type Stage = 'idle' | 'scanning' | 'result'

const STEPS = ['Trigger', 'Scan', 'Result'] as const

// A real German string that overruns a fixed-width badge — the classic
// byte-overflow / truncation bug English never surfaces.
const LONG_DE = 'Kostenloser Versand für alle Bestellungen über fünfzig Euro'
const SHORT_DE = 'Gratis-Versand ab 50 €'

function StepRail({ stage }: { stage: Stage }) {
  const active = stage === 'idle' ? 0 : stage === 'scanning' ? 1 : 2
  return (
    <ol className="flex items-center gap-2" aria-label="Scan pipeline progress">
      {STEPS.map((label, i) => {
        const done = i < active
        const current = i === active
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition duration-300 motion-safe:ease-out ${
                done || current
                  ? 'border-brand/40 bg-brand/10 text-text'
                  : 'border-border text-muted'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition duration-300 ${
                  current ? 'bg-brand animate-badge' : done ? 'bg-ok' : 'bg-border'
                }`}
              />
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}

// The mock "website" — a checkout card rendered as the user's app would show it.
function MockView({ stage, fixed }: { stage: Stage; fixed: boolean }) {
  const broken = stage === 'result' && !fixed

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-canvas">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-panel px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-err/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
        <span className="ml-2 truncate rounded bg-canvas px-2 py-0.5 font-mono text-[11px] text-muted">
          app.acme.shop / checkout · de-DE
        </span>
      </div>

      {/* preview body — fixed height so the scan sweep distance is deterministic */}
      <div className="relative h-64 overflow-hidden p-5">
        {/* scanning overlay */}
        {stage === 'scanning' && (
          <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
            <div className="animate-scan absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-transparent via-brand/25 to-transparent" />
            <div className="animate-scan absolute inset-x-0 top-0 h-px bg-brand/80 shadow-[0_0_12px_2px] shadow-brand/50" />
          </div>
        )}

        <div className="mx-auto max-w-[15rem]">
          <div className="h-3 w-24 rounded bg-border" />
          <div className="mt-2 h-3 w-32 rounded bg-border/60" />

          {/* the promo badge with a fixed-width container (the VARCHAR/box limit) */}
          <div className="relative mt-6">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted">
              Promo banner · max-width 15rem
            </p>
            <div
              className={`relative w-[15rem] rounded-md border px-3 py-2 text-sm transition-colors duration-300 ${
                broken
                  ? 'border-err/60 bg-err/10 text-text'
                  : stage === 'result'
                    ? 'border-ok/50 bg-ok/10 text-text'
                    : 'border-border bg-panel text-text'
              }`}
            >
              <span
                className={
                  broken
                    ? 'block whitespace-nowrap' // overruns — spills past the right edge
                    : 'block'
                }
              >
                {stage === 'result' && fixed ? SHORT_DE : LONG_DE}
              </span>

              {/* the container's real right boundary */}
              {broken && (
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 w-px bg-err"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* LocaleGuard finding overlay */}
            {broken && (
              <div className="animate-rise absolute -right-2 -top-3 z-20 flex items-center gap-1.5 rounded-full border border-err/50 bg-canvas px-2.5 py-1 text-[11px] font-medium text-err shadow-lg shadow-black/40">
                <span className="animate-badge h-1.5 w-1.5 rounded-full bg-err" />
                byte-overflow · de-DE
              </div>
            )}
            {stage === 'result' && fixed && (
              <div className="animate-rise absolute -right-2 -top-3 z-20 flex items-center gap-1.5 rounded-full border border-ok/50 bg-canvas px-2.5 py-1 text-[11px] font-medium text-ok shadow-lg shadow-black/40">
                <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden="true">
                  <path
                    d="M2.5 6.5 5 9l4.5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                within bounds
              </div>
            )}
          </div>

          <div className="mt-6 h-8 w-full rounded-md bg-brand/80" />
        </div>
      </div>
    </div>
  )
}

export function ScanSimulator() {
  const [stage, setStage] = useState<Stage>('idle')
  const [fixed, setFixed] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // clear any pending timers on unmount
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function run() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setFixed(false)
    setStage('scanning')
    timers.current.push(setTimeout(() => setStage('result'), 1600))
  }

  function reset() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setFixed(false)
    setStage('idle')
  }

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text">Pull request visual scan</p>
          <p className="mt-1 text-sm text-muted">
            Watch LocaleGuard catch a byte-overflow bug that English tests never see.
          </p>
        </div>
        <StepRail stage={stage} />
      </div>

      <div className="mt-5">
        <MockView stage={stage} fixed={fixed} />
      </div>

      {/* controls */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {stage === 'idle' && (
          <button
            type="button"
            onClick={run}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand/25 transition duration-300 motion-safe:ease-out hover:scale-[1.02] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
          >
            Simulate scan
          </button>
        )}

        {stage === 'scanning' && (
          <div className="flex w-full max-w-xs items-center gap-3">
            <span className="text-sm text-muted">Scanning catalog…</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
              <span className="animate-progress block h-full origin-left rounded-full bg-brand" />
            </span>
          </div>
        )}

        {stage === 'result' && (
          <>
            {!fixed ? (
              <button
                type="button"
                onClick={() => setFixed(true)}
                className="rounded-lg bg-ok px-4 py-2 text-sm font-medium text-canvas shadow-lg shadow-ok/20 transition duration-300 motion-safe:ease-out hover:scale-[1.02] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ok focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
              >
                Apply auto-fix
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-ok">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                Fixed rendering fits the container
              </span>
            )}
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition duration-300 motion-safe:ease-out hover:scale-[1.02] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
            >
              Run again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
