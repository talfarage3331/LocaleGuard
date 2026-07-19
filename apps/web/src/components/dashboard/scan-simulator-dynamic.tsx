'use client'

import dynamic from 'next/dynamic'

// ssr: false keeps the interactive simulator out of the server render and the
// critical-path bundle, so the dashboard's metrics paint first. next/dynamic
// with ssr: false is only allowed inside a client component — hence this thin
// wrapper the RSC page can import directly.
export const ScanSimulator = dynamic(
  () => import('./scan-simulator').then((m) => m.ScanSimulator),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-panel p-5">
        <div className="h-4 w-56 animate-pulse rounded bg-border" />
        <div className="mt-5 h-[19rem] animate-pulse rounded-lg bg-canvas" />
      </div>
    ),
  },
)
