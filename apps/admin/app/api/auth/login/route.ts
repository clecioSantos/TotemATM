import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/src/services/firebase-admin";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      console.error("Firebase Admin SDK não inicializado: variáveis de ambiente ausentes ou import falhou.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

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

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro na API de Login:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}