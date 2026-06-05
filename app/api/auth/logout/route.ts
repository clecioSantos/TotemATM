import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    cookieStore.delete("session");
    cookieStore.delete("user-role");
    
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("🔥 Logout error:", error);
    return NextResponse.json({ error: "Erro ao fazer logout" }, { status: 500 });
  }
}
