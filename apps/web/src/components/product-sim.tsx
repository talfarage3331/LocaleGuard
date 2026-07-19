'use client'

import { useEffect, useState } from 'react'

// Loops a broken → fixed catalog to show a plural gap being caught, then cleared.
export function ProductSim() {
  const [fixed, setFixed] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setFixed((v) => !v), 3400)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative">
      <div className="aurora" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-2xl border border-border glass shadow-2xl shadow-black/50">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-err/80" />
          <span className="h-3 w-3 rounded-full bg-warn/80" />
          <span className="h-3 w-3 rounded-full bg-ok/80" />
          <span className="ml-2 font-mono text-xs text-muted">locales/ru/messages.json</span>
        </div>

        {/* code */}
        <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed">
          <code>
            <Line n={1}>
              <span className="text-muted">{'{'}</span>
            </Line>
            <Line n={2}>
              {'  '}
              <span className="text-brand">&quot;cart_items&quot;</span>
              <span className="text-muted">: {'{'}</span>
            </Line>
            <Line n={3}>
              {'    '}
              <span className="text-brand">&quot;one&quot;</span>
              <span className="text-muted">: </span>
              <span className="text-ok">&quot;# товар&quot;</span>
              <span className="text-muted">,</span>
            </Line>
            <Line n={4}>
              {'    '}
              <span className="text-brand">&quot;few&quot;</span>
              <span className="text-muted">: </span>
              <span className="text-ok">&quot;# товара&quot;</span>
              <span className="text-muted">,</span>
            </Line>
            {fixed ? (
              <>
                <Line n={5} highlight="ok">
                  {'    '}
                  <span className="text-brand">&quot;many&quot;</span>
                  <span className="text-muted">: </span>
                  <span className="text-ok">&quot;# товаров&quot;</span>
                  <span className="text-muted">,</span>
                </Line>
                <Line n={6} highlight="ok">
                  {'    '}
                  <span className="text-brand">&quot;other&quot;</span>
                  <span className="text-muted">: </span>
                  <span className="text-ok">&quot;# товара&quot;</span>
                </Line>
              </>
            ) : (
              <Line n={5} highlight="err">
                {'    '}
                <span className="text-err/80">⎯ missing &quot;many&quot;, &quot;other&quot;</span>
              </Line>
            )}
            <Line n={fixed ? 7 : 6}>
              {'  '}
              <span className="text-muted">{'}'}</span>
            </Line>
            <Line n={fixed ? 8 : 7}>
              <span className="text-muted">{'}'}</span>
            </Line>
          </code>
        </pre>

        {/* status bar */}
        <div
          className={`flex items-center gap-2 border-t px-5 py-3 font-mono text-xs transition-colors ${
            fixed ? 'border-ok/20 bg-ok/10 text-ok' : 'border-err/20 bg-err/10 text-err'
          }`}
        >
          {fixed ? (
            <>
              <Dot className="bg-ok" /> plural-completeness · 5 rules · 0 errors
            </>
          ) : (
            <>
              <Dot className="bg-err" /> plural-completeness · ru requires &quot;many&quot;,
              &quot;other&quot;
            </>
          )}
        </div>
      </div>

      {/* success toast */}
      {fixed && (
        <div
          key="toast"
          className="animate-rise absolute -right-3 -top-3 flex items-center gap-2 rounded-xl border border-ok/30 bg-canvas/90 px-3.5 py-2 text-sm font-medium text-ok shadow-2xl shadow-ok/10 backdrop-blur"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
            <path
              d="M4 10.5l3.5 3.5L16 5.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Build passing
        </div>
      )}
    </div>
  )
}

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} />
}

function Line({
  n,
  children,
  highlight,
}: {
  n: number
  children: React.ReactNode
  highlight?: 'ok' | 'err'
}) {
  const bg = highlight === 'ok' ? 'bg-ok/10' : highlight === 'err' ? 'bg-err/10' : ''
  return (
    <div className={`-mx-5 flex px-5 ${bg}`}>
      <span className="w-6 shrink-0 select-none text-right text-muted/50">{n}</span>
      <span className="pl-4">{children}</span>
    </div>
  )
}
