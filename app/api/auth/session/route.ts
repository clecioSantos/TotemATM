import { getAdminAuth, setUserClaims } from "../../../../src/services/firebase-admin";
import { userRepository } from "@totem/shared/types/user.repository";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    const adminAuth = getAdminAuth();

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userProfile = await userRepository.getById(uid);
    if (!userProfile) throw new Error("User not found in Firestore");

    if (decodedToken.role !== userProfile.role) {
      await setUserClaims(uid, userProfile.role);
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

    cookieStore.set("user-role", userProfile.role, {
      maxAge: expiresIn,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({ status: "success", role: userProfile.role }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized", message: (error as Error).message }, { status: 401 });
  }
}
