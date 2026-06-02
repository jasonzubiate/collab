import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import {
  creatorSessionTokenSchema,
  signinSchema,
} from "@/lib/validation/authSchemas";
import { consumeCreatorSessionToken } from "@/lib/services/creatorAuthService";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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
