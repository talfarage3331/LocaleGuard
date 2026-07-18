import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'LocaleGuard — catch silent i18n bugs in CI',
  description:
    'Detect plural gaps, ICU errors, placeholder drift and byte overflow in your translation catalogs — before they ship.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
