'use client'

import { useEffect, useState } from 'react'

// Hero visual: a mock GitHub PR review from the LocaleGuard bot. Loops from a
// "changes requested" finding (a broken Russian plural) to a resolved, green
// state — the same broken → fixed story the product tells on a real PR.
export function PrComment() {
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setResolved((v) => !v), 3800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative">
      <div className="aurora" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-2xl border border-border glass shadow-2xl shadow-black/50">
        {/* PR header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              resolved ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${resolved ? 'bg-ok' : 'bg-warn'}`} />
            {resolved ? 'All checks passed' : 'Changes requested'}
          </span>
          <span className="truncate font-mono text-xs text-muted">
            Add Russian translations #248
          </span>
        </div>

        {/* diff hunk */}
        <div className="border-b border-border font-mono text-[12.5px] leading-relaxed">
          <div className="flex items-center gap-2 bg-white/[0.02] px-4 py-1.5 text-[11px] text-muted">
            <FileIcon />
            locales/ru/messages.json
          </div>
          <DiffLine sign="ctx" n="17">
            {'  '}
            <span className="text-brand">&quot;cart_items&quot;</span>
            <span className="text-muted">: {'{'}</span>
          </DiffLine>
          <DiffLine sign="ctx" n="18">
            {'    '}
            <span className="text-brand">&quot;one&quot;</span>
            <span className="text-muted">: </span>
            <span className="text-ok/90">&quot;# товар&quot;</span>
            <span className="text-muted">,</span>
          </DiffLine>
          <DiffLine sign="add" n="19">
            {'    '}
            <span className="text-brand">&quot;few&quot;</span>
            <span className="text-muted">: </span>
            <span className="text-ok/90">&quot;# товара&quot;</span>
            <span className="text-muted">,</span>
          </DiffLine>
          {resolved && (
            <>
              <DiffLine sign="add" n="20">
                {'    '}
                <span className="text-brand">&quot;many&quot;</span>
                <span className="text-muted">: </span>
                <span className="text-ok/90">&quot;# товаров&quot;</span>
                <span className="text-muted">,</span>
              </DiffLine>
              <DiffLine sign="add" n="21">
                {'    '}
                <span className="text-brand">&quot;other&quot;</span>
                <span className="text-muted">: </span>
                <span className="text-ok/90">&quot;# товара&quot;</span>
              </DiffLine>
            </>
          )}
          <DiffLine sign="ctx" n={resolved ? '22' : '20'}>
            {'  '}
            <span className="text-muted">{'}'}</span>
          </DiffLine>
        </div>

        {/* bot review thread */}
        <div className="flex gap-3 px-4 py-3.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[11px] font-semibold text-brand ring-1 ring-brand/30">
            LG
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="font-semibold text-text">localeguard</span>
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">
                bot
              </span>
              <span className="text-muted">
                {resolved ? 'approved these changes' : 'requested changes'}
              </span>
            </div>

            {resolved ? (
              <p className="animate-rise mt-2 flex items-center gap-2 text-sm text-ok">
                <CheckMark /> plural-completeness · 5 rules · 0 errors
              </p>
            ) : (
              <div
                key="finding"
                className="animate-rise mt-2 rounded-lg border border-err/25 bg-err/[0.07] p-3"
              >
                <p className="text-sm leading-relaxed text-text">
                  <span className="font-medium text-err">plural-completeness</span> — Russian needs
                  the <code className="font-mono text-err">many</code> and{' '}
                  <code className="font-mono text-err">other</code> categories.{' '}
                  <code className="font-mono text-muted">Intl.PluralRules</code> requires{' '}
                  <span className="font-mono text-muted">one · few · many · other</span>; the rest
                  fall back silently to <code className="font-mono">other</code>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {resolved && (
        <div
          key="toast"
          className="animate-rise absolute -right-3 -top-3 flex items-center gap-2 rounded-xl border border-ok/30 bg-canvas/90 px-3.5 py-2 text-sm font-medium text-ok shadow-2xl shadow-ok/10 backdrop-blur"
        >
          <CheckMark />
          Merge unblocked
        </div>
      )}
    </div>
  )
}

function CheckMark() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M4 10.5l3.5 3.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
      <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1Zm0 1.5L11.5 5H9V2.5Z" />
    </svg>
  )
}

function DiffLine({
  sign,
  n,
  children,
}: {
  sign: 'add' | 'ctx'
  n: string | number
  children: React.ReactNode
}) {
  const add = sign === 'add'
  return (
    <div className={`flex ${add ? 'bg-ok/[0.08]' : ''}`}>
      <span className="w-9 shrink-0 select-none px-2 text-right text-muted/50">{n}</span>
      <span
        className={`w-4 shrink-0 select-none text-center ${add ? 'text-ok/70' : 'text-transparent'}`}
      >
        {add ? '+' : '·'}
      </span>
      <span className="min-w-0 pr-4">{children}</span>
    </div>
  )
}
