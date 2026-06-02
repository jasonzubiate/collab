import type { NextAuthConfig } from "next-auth";
import { dashboardPath } from "@/lib/auth/dashboardPath";

/**
 * Edge-safe Auth.js config. Contains NO database adapter and NO providers that
 * import Node-only libraries (bcrypt/Prisma). This is the config imported by
 * `proxy.ts` so the proxy can read the JWT session and run optimistic redirects
 * without pulling in the database layer. The full config (with the Credentials
 * provider) lives in `auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/brand/signin",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;
      const isOnAdmin = pathname.startsWith("/admin");
      const isOnCreatorApp =
        pathname.startsWith("/creator") &&
        !pathname.startsWith("/creator/signin") &&
        !pathname.startsWith("/creator/signup");

      if (isOnAdmin || isOnCreatorApp) {
        return Boolean(auth?.user);
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.userType = user.userType;
        token.brandId = user.brandId;
        token.creatorProfileId = user.creatorProfileId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.userType =
          (token.userType as typeof session.user.userType) ?? "BRAND";
        session.user.brandId = (token.brandId as string | undefined) ?? undefined;
        session.user.creatorProfileId =
          (token.creatorProfileId as string | undefined) ?? undefined;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;

export function redirectForWrongRole(
  userType: string | undefined,
  target: "admin" | "creator",
): string | null {
  if (target === "admin" && userType === "CREATOR") {
    return dashboardPath("CREATOR");
  }
  if (target === "creator" && userType === "BRAND") {
    return dashboardPath("BRAND");
  }
  return null;
}
