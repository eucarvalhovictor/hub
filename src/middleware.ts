import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user } = await updateSession();

  const protectedRoutes = [
    "/clients",
    "/crm",
    "/finance",
    "/investments",
    "/habits",
    "/goals",
    "/tasks",
    "/notes",
    "/journal",
    "/settings",
  ];

  const isProtected =
    request.nextUrl.pathname === "/" ||
    protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
