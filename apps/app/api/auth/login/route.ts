import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/src/services/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: "ID Token ausente" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      console.error(
        "❌ Firebase Admin SDK não inicializado. Verifique as variáveis de ambiente no painel do Vercel (FIREBASE_PROJECT_ID, etc)."
      );
      return NextResponse.json({ error: "Erro de configuração no servidor" }, { status: 500 });
    }

    // 5 dias
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const cookieStore = await cookies();

    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("❌ Erro na API de Login:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}