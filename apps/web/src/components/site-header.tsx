import Link from 'next/link'
import { auth } from '@/auth'
import { SignInButton } from '@/components/auth-buttons'

// Nav dropdowns are pure CSS (group-hover + focus-within) — no client JS needed,
// so the header stays a server component and can render the server-action auth button.
const PRODUCT = [
  { label: 'Plural completeness', href: '/#features' },
  { label: 'ICU message validity', href: '/#features' },
  { label: 'Placeholder consistency', href: '/#features' },
  { label: 'Byte-overflow risk', href: '/#features' },
  { label: 'Missing / orphan keys', href: '/#features' },
]

const RESOURCES = [
  { label: 'Documentation', href: 'https://github.com/localeguard/localeguard#readme' },
  { label: 'CLI on npm', href: 'https://www.npmjs.com/package/@localeguard/cli' },
  {
    label: 'GitHub Action',
    href: 'https://github.com/localeguard/localeguard/tree/main/packages/action',
  },
  { label: 'Source on GitHub', href: 'https://github.com/localeguard/localeguard' },
]

function Chevron() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5L6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Dropdown({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted transition group-hover:text-text group-focus-within:text-text"
      >
        {label}
        <span className="text-muted transition group-hover:rotate-180">
          <Chevron />
        </span>
      </button>
      <div className="invisible absolute left-0 top-full w-60 translate-y-1 pt-2 opacity-0 transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="glass rounded-xl border border-border p-1.5 shadow-2xl shadow-black/40">
          {items.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className="block rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-text"
            >
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export async function SiteHeader() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 border-b border-white/5">
      <div className="glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
              locale<span className="text-brand">guard</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <Dropdown label="Product" items={PRODUCT} />
              <Dropdown label="Resources" items={RESOURCES} />
              <Link
                href="/pricing"
                className="rounded-md px-3 py-2 text-sm text-muted transition hover:text-text"
              >
                Pricing
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand/25 transition hover:opacity-90"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:text-text sm:block"
                >
                  Sign in
                </Link>
                <SignInButton />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
