// Route-level fallback shown while the dashboard RSC awaits its DB queries.
// Mirrors the real layout's boxes so the swap-in causes no layout shift (CLS).
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6">
      <header className="flex items-center justify-between border-b border-border py-6">
        <div className="h-4 w-28 animate-pulse rounded bg-border" />
        <div className="h-4 w-40 animate-pulse rounded bg-border" />
      </header>

      <section className="pt-10">
        <div className="rounded-xl border border-border bg-panel p-5">
          <div className="h-4 w-56 animate-pulse rounded bg-border" />
          <div className="mt-5 h-[19rem] animate-pulse rounded-lg bg-canvas" />
        </div>
      </section>

      <section className="py-10">
        <div className="h-7 w-48 animate-pulse rounded bg-border" />
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-panel" />
          ))}
        </div>
        <div className="mt-6 h-40 animate-pulse rounded-xl border border-border bg-panel" />
      </section>
    </main>
  )
}
