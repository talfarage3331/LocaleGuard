import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

// Makes getCloudflareContext() (and the HYPERDRIVE binding) available under `next dev`.
// Dev-only: during `next build` it would eagerly init the Hyperdrive proxy and demand a
// local Postgres string. The deployed worker gets the real binding from the runtime.
if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev()
}

export default nextConfig
