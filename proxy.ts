import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Khởi tạo NextAuth chỉ với edge-safe config (không có Prisma)
const { auth } = NextAuth(authConfig);

// Routes yêu cầu đăng nhập
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const path = nextUrl.pathname;

  const isDashboard   = path.startsWith("/dashboard");
  const isAdmin       = path.startsWith("/admin");
  const isProjectsNew = path === "/projects/new";
  const isApply       = /^\/projects\/[^/]+\/apply/.test(path);
  const isProtected   = isDashboard || isAdmin || isProjectsNew || isApply;

  const isAuthRoute = AUTH_ROUTES.some((r) => path.startsWith(r));

  // Chưa đăng nhập → redirect về login
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Đã đăng nhập → không cần vào trang auth nữa
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|public).*)",
  ],
};
