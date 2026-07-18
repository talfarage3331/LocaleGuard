import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { db } from '@/db'
import { users } from '@/db/schema'

// GitHub OAuth + JWT sessions. On first sign-in we upsert the GitHub identity into
// `users` and carry the internal id + billing plan on the token (no session table).
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_OAUTH_ID,
      clientSecret: process.env.GITHUB_OAUTH_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  // Server-rendered behind a known host (Vercel/self-host); trust the forwarded host header.
  trustHost: true,
  callbacks: {
    async jwt({ token, profile }) {
      // `profile` is only present on first sign-in; upsert then and cache the row on the token.
      if (profile) {
        const githubId = String(profile.id)
        const [row] = await db
          .insert(users)
          .values({
            githubId,
            login: String(profile.login ?? profile.name ?? githubId),
            name: (profile.name as string | null) ?? null,
            email: (profile.email as string | null) ?? null,
            avatarUrl: (profile.avatar_url as string | null) ?? null,
          })
          .onConflictDoUpdate({
            target: users.githubId,
            set: {
              login: String(profile.login ?? profile.name ?? githubId),
              name: (profile.name as string | null) ?? null,
              avatarUrl: (profile.avatar_url as string | null) ?? null,
            },
          })
          .returning({ id: users.id, plan: users.plan })
        if (row) {
          token.uid = row.id
          token.plan = row.plan
        }
      }
      return token
    },
    session({ session, token }) {
      if (typeof token.uid === 'string') session.user.id = token.uid
      session.user.plan = typeof token.plan === 'string' ? token.plan : 'free'
      return session
    },
  },
})
