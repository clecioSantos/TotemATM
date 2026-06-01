import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas que NÃO precisam de login
const PUBLIC_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const userRole = request.cookies.get("user-role")?.value;
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/auth') || 
    pathname.includes('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);
  
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    // Salva a rota original para redirecionar o usuário após ele logar ou se registrar
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublicRoute) {
    // Redireciona usuários logados para suas respectivas homes se tentarem acessar login
    if (userRole === 'admin' || userRole === 'owner') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Para clientes, redireciona para a tela de seleção de unidade
    return NextResponse.redirect(new URL('/totem', request.url));
  }

  // Impede que clientes acessem rotas de Admin
  if (userRole === "client" && pathname.startsWith("/admin")) {
    // Redireciona clientes para a tela de seleção de unidade
    return NextResponse.redirect(new URL("/totem", request.url));
  }

  // Impede acesso de clients a rotas admin (fallback de segurança)
  if (pathname.startsWith("/admin") && userRole !== "admin" && userRole !== "owner") {
    return NextResponse.redirect(new URL("/totem", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};