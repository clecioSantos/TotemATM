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
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Para clientes, talvez seja necessário um ID padrão ou uma página de seleção de unidade
    return NextResponse.next(); 
  }

  // Impede que clientes acessem rotas de Admin
  if (userRole === "client" && pathname.startsWith("/admin")) {
    // Como o totem agora precisa de ID, se o cliente tentar entrar no Admin, 
    // mandamos ele para o login ou uma home de seleção de totem
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Impede acesso de clients a rotas admin (fallback de segurança)
  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/totem", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};