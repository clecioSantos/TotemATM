import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb, setUserClaims } from "@/src/services/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get("redirect") || "/totem";

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const adminAuth = getAdminAuth();
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const role = userDoc.data()?.role || "client";

    const allowedRoles = ["admin", "owner", "collaborator"];
    const allowed = allowedRoles.includes(role);

    const response = NextResponse.redirect(
      new URL(allowed ? redirect : "/totem", request.url)
    );

    const maxAge = 60 * 60 * 24 * 5;
    response.cookies.set("user-role", role, {
      maxAge,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    if (role !== decodedClaims.role) {
      await setUserClaims(uid, role);
    }

    return response;
  } catch (error) {
    console.error("[ROLE_SYNC] Error:", error);
    return NextResponse.redirect(new URL("/totem", request.url));
  }
}
