import type { DefaultSession } from 'next-auth'

// Expose our internal user id + billing plan on the session/token.
declare module 'next-auth' {
  interface Session {
    user: { id: string; plan: string } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string
    plan?: string
  }
}
