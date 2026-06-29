import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/verify-email"];

const PUBLIC_PREFIXES = ["/termos", "/privacidade", "/cookies", "/consent-required"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  try {
    const session = request.cookies.get("session")?.value;
    const userRole = request.cookies.get("user-role")?.value;

    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/api/payments/webhook') ||
      pathname.startsWith('/totem') ||
      pathname === '/api/health' ||
      pathname.includes('/favicon.ico') ||
      pathname.includes('.') ||
      PUBLIC_PREFIXES.some(prefix => pathname === prefix)
    ) {
      return NextResponse.next();
    }

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

    if (!session && !isPublicRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session && isPublicRoute && pathname !== "/forgot-password" && pathname !== "/verify-email") {
      if (userRole === 'admin' || userRole === 'owner') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/totem', request.url));
    }

    if (userRole === "client" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/totem", request.url));
    }

    if (pathname.startsWith("/admin") && userRole !== "admin" && userRole !== "owner" && userRole !== "collaborator") {
      return NextResponse.redirect(new URL("/totem", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error(
      `[ERROR] [MIDDLEWARE] Erro no middleware para ${request.nextUrl.pathname}:`,
      error instanceof Error ? error.message : String(error)
    );

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Erro interno" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!totem|login|api/webhooks/mercadopago|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
