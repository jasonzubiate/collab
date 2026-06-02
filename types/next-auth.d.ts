import type { DefaultSession } from "next-auth";
import type { UserType } from "@prisma/client";

declare module "next-auth" {
  interface User {
    userType?: UserType;
    brandId?: string;
    creatorProfileId?: string;
  }

  interface Session {
    user: {
      id: string;
      userType: UserType;
      brandId?: string;
      creatorProfileId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    userType?: UserType;
    brandId?: string;
    creatorProfileId?: string;
  }
}
