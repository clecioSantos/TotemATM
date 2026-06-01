import { getAdminAuth, setUserClaims } from "./firebase-admin";
import { userRepository } from "@totem/shared/types/user.repository";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    const adminAuth = getAdminAuth();
    
    // 1. Verificar o Token e obter dados do usuário
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Buscar Perfil no Firestore para garantir a Role correta
    const userProfile = await userRepository.getById(uid);
    if (!userProfile) throw new Error("User not found in Firestore");

    // 3. Sincronizar Custom Claims se necessário
    if (decodedToken.role !== userProfile.role) {
      await setUserClaims(uid, userProfile.role);
      // Nota: Custom claims precisam de um novo token para refletir no client, 
      // mas o Session Cookie gerado abaixo já conterá a nova claim.
    }

    // 4. Criar Cookie de Sessão (contém as Custom Claims)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const cookieStore = await cookies();

    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    // 5. Salvar role em um cookie acessível pelo middleware para performance
    cookieStore.set("user-role", userProfile.role, {
      maxAge: expiresIn,
      httpOnly: true, // Segurança: impede acesso via JS no browser
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({ status: "success", role: userProfile.role }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized", message: error.message }, { status: 401 });
  }
}