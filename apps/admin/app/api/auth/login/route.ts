import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    // Import dinamicamente para evitar inicialização do Admin SDK em tempo de build
    const mod = await import("@/src/services/firebase-admin");
    const adminAuth = mod?.adminAuth;
    if (!adminAuth) {
      console.error("Firebase Admin SDK não inicializado: variáveis de ambiente ausentes ou import falhou.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Define o tempo de expiração (5 dias)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Cria o cookie de sessão usando o Firebase Admin SDK
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // No Next.js 15, a função cookies() deve ser aguardada (await)
    const cookieStore = await cookies();

    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true, // Impede acesso via JavaScript no cliente
      secure: process.env.NODE_ENV === "production", // Apenas HTTPS em produção
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro na API de Login:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}