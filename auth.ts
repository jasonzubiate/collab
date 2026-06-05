import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import {
  creatorSessionTokenSchema,
  signinSchema,
} from "@/lib/validation/authSchemas";
import { consumeCreatorSessionToken } from "@/lib/services/creatorAuthService";
import {
  findOrCreateBrandFromGoogle,
  findOrCreateCreatorFromGoogle,
} from "@/lib/services/googleAuthService";
import {
  GOOGLE_INTENT_COOKIE,
  parseGoogleIntent,
} from "@/lib/auth/googleIntent";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Runs in the Node runtime (this config powers the route handlers, not the
     * edge proxy). For Google sign-ins we resolve the app user ourselves since
     * there is no database adapter, then stamp the result onto `user` so the
     * shared `jwt` callback in auth.config.ts picks it up.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = profile?.email ?? user.email;
      if (!email) return false;

      const cookieStore = await cookies();
      const intent = parseGoogleIntent(
        cookieStore.get(GOOGLE_INTENT_COOKIE)?.value,
      );
      cookieStore.delete(GOOGLE_INTENT_COOKIE);

      const name = profile?.name ?? user.name ?? null;
      const result =
        intent === "creator"
          ? await findOrCreateCreatorFromGoogle({ email, name })
          : await findOrCreateBrandFromGoogle({ email, name });

      if (!result.ok) {
        const signinPath =
          intent === "creator" ? "/creator/signin" : "/brand/signin";
        return `${signinPath}?error=${encodeURIComponent(
          "That email is already registered with a different account type.",
        )}`;
      }

      const dbUser = result.user;
      user.id = dbUser.id;
      user.email = dbUser.email;
      user.name = dbUser.name ?? undefined;
      user.userType = dbUser.userType;
      user.brandId = dbUser.brandId ?? undefined;

      return true;
    },
  },
  providers: [
    Google({
      authorization: { params: { prompt: "select_account" } },
    }),
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signinSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { creatorProfile: true },
        });
        if (!user?.passwordHash || user.userType !== "BRAND" || !user.brandId) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          userType: user.userType,
          brandId: user.brandId,
        };
      },
    }),
    Credentials({
      id: "creator-session",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const parsed = creatorSessionTokenSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await consumeCreatorSessionToken(parsed.data.token);
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          userType: user.userType,
          creatorProfileId: user.creatorProfile?.id,
        };
      },
    }),
  ],
});
