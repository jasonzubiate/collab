import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. Contains NO database adapter and NO providers that
 * import Node-only libraries (bcrypt/Prisma). This is the config imported by
 * `proxy.ts` so the proxy can read the JWT session and run optimistic redirects
 * without pulling in the database layer. The full config (with the Credentials
 * provider) lives in `auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      if (isOnAdmin) {
        // Returning false redirects unauthenticated users to `pages.signIn`.
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.brandId = user.brandId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.brandId = (token.brandId as string) ?? "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
