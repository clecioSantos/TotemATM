import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    // Remove o cookie de sessão para garantir que o Middleware bloqueie o acesso
    cookieStore.delete("session");
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Erro ao processar logout:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}