import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig, redirectForWrongRole } from "./auth.config";
import { dashboardPath, signinPath } from "@/lib/auth/dashboardPath";
import type { UserType } from "@prisma/client";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const userType = session?.user?.userType as UserType | undefined;

  const isOnAdmin = pathname.startsWith("/admin");
  const isOnCreatorApp =
    pathname.startsWith("/creator") &&
    !pathname.startsWith("/creator/signin") &&
    !pathname.startsWith("/creator/signup");

  if (isOnAdmin) {
    if (!session?.user) {
      return NextResponse.redirect(new URL(signinPath("BRAND"), req.url));
    }
    const wrongRole = redirectForWrongRole(userType, "admin");
    if (wrongRole) {
      return NextResponse.redirect(new URL(wrongRole, req.url));
    }
    if (userType === "BRAND" && !session.user.brandId) {
      return NextResponse.redirect(new URL(signinPath("BRAND"), req.url));
    }
    return NextResponse.next();
  }

  if (isOnCreatorApp) {
    if (!session?.user) {
      return NextResponse.redirect(new URL(signinPath("CREATOR"), req.url));
    }
    const wrongRole = redirectForWrongRole(userType, "creator");
    if (wrongRole) {
      return NextResponse.redirect(new URL(wrongRole, req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/brand/signin" || pathname === "/brand/signup") {
    if (session?.user?.userType === "BRAND") {
      return NextResponse.redirect(new URL(dashboardPath("BRAND"), req.url));
    }
  }

  if (pathname === "/creator/signin" || pathname === "/creator/signup") {
    if (session?.user?.userType === "CREATOR") {
      return NextResponse.redirect(new URL(dashboardPath("CREATOR"), req.url));
    }
  }

  if (pathname === "/brand/login") {
    return NextResponse.redirect(new URL("/brand/signin", req.url));
  }

  if (pathname === "/creator/login" || pathname.startsWith("/creator/login/")) {
    const nextPath = pathname.replace("/creator/login", "/creator/signin");
    return NextResponse.redirect(new URL(nextPath, req.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/brand/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
