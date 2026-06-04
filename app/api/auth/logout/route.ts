import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  
  cookieStore.delete("session");
  cookieStore.delete("user-role");
  
  return NextResponse.json({ status: "success" });
}
