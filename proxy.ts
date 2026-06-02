import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (Node.js runtime). We
// instantiate a database-free Auth.js client here so the proxy can read the
// JWT session cookie and perform optimistic redirects via the `authorized`
// callback. Authoritative checks still happen in the admin layout and in each
// admin route handler via `auth()`.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except Next internals and static assets. The `authorized`
  // callback decides what to protect.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
