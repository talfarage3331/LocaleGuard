import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

// Skeleton: GitHub OAuth, JWT sessions (no session table needed).
// Persisting the user row into `users` on first sign-in is a later step.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_OAUTH_ID,
      clientSecret: process.env.GITHUB_OAUTH_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
})
