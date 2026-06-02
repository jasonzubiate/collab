import type { UserType } from "@prisma/client";

export function dashboardPath(userType: UserType): string {
  return userType === "BRAND" ? "/admin/proposals" : "/creator/requests";
}

export function signinPath(userType: UserType): string {
  return userType === "BRAND" ? "/brand/signin" : "/creator/signin";
}
