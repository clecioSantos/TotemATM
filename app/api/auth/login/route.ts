import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ success: false, error: "ID Token ausente" }, { status: 400 });
    }

    let adminAuth;
    try {
      adminAuth = getAdminAuth();
    } catch (initError) {
      logger.error("API_LOGIN", "Firebase Admin SDK não inicializado", initError);
      return NextResponse.json(
        { success: false, error: "Erro de configuração no servidor" },
        { status: 500 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (verifyError) {
      logger.error("API_LOGIN", "Erro ao verificar ID token", verifyError);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const uid = decodedToken.uid;

    let role = "client";
    try {
      const adminDb = getAdminDb();
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const userData = userDoc.data();
      role = userData?.role || "client";
    } catch (dbError) {
      logger.error("API_LOGIN", "Erro ao buscar role do usuário no Firestore", dbError, { uid });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    let sessionCookie;
    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    } catch (cookieError) {
      logger.error("API_LOGIN", "Erro ao criar session cookie", cookieError);
      return NextResponse.json({ success: false, error: "Erro de autenticação" }, { status: 500 });
    }

    const cookieStore = await cookies();

    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    cookieStore.set("user-role", role, {
      maxAge: expiresIn,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    logger.info("API_LOGIN", `Login bem-sucedido: ${uid} (role: ${role})`);

    return NextResponse.json({ success: true, status: "success", role });
  } catch (error) {
    logger.error("API_LOGIN", "Erro na API de Login", error);
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}
