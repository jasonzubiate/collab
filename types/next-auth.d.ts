import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    brandId?: string;
  }

  interface Session {
    user: {
      id: string;
      brandId: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    brandId?: string;
  }
}
