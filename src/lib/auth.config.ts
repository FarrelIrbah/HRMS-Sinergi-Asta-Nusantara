import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublicPath =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/api/auth")

      if (isPublicPath) return true
      if (isLoggedIn) return true

      // Redirect unauthenticated users to /login
      return false
    },
  },
  providers: [], // Providers added in auth.ts (not Edge-compatible)
} satisfies NextAuthConfig
