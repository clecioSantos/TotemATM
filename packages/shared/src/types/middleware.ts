import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Rotas que não exigem autenticação
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return NextResponse.next();
  }

  // Se não estiver autenticado, redireciona para login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Lógica de proteção de Role baseada em cookies ou Custom Claims
  // Nota: Para verificar a ROLE aqui sem Custom Claims, precisaríamos decodificar 
  // um cookie adicional que salvamos no login contendo a role (criptografado)
  // ou fazer uma chamada de serviço.
  
  const userRole = request.cookies.get('user-role')?.value; // Exemplo de persistência de role segura

  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/totem', request.url));
  }

  if (pathname.startsWith('/totem') && userRole !== 'client') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/totem/:path*',
  ],
};