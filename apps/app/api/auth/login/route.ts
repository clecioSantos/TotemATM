import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../src/services/firebase-admin";

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

    // Verificar o token para obter o UID e buscar a role do usuário no Firestore
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const role = userData?.role || "client";

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

    // Define o cookie de role que o middleware utiliza para o redirecionamento
    cookieStore.set("user-role", role, {
      maxAge: expiresIn,
      httpOnly: false, // Pode ser lido pelo navegador para lógica de UI
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ status: "success", role });
  } catch (error) {
    console.error("❌ Erro na API de Login:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}