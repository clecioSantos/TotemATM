import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rawKey = process.env.PAGBANK_PUBLIC_KEY || "";
    const publicKey = rawKey.replace(/\\n/g, '\n');

    return NextResponse.json({
      public_key: publicKey,
      created_at: Date.now()
    }, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      error: 'Erro interno'
    }, { status: 500 });
  }
}
