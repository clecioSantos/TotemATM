import { NextRequest, NextResponse } from "next/server";
import { PagBankService } from "../../../services/pagbank/pagbank.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, customerName } = body;

    const pagbankOrder = await PagBankService.createPixOrder(orderId, amount, customerName);

    const qrCodeData = pagbankOrder.qr_codes[0];
    const copyPaste = qrCodeData.text;
    const qrCodeImage = qrCodeData.links.find((l: any) => l.rel === "QRCODE.PNG")?.href;

    return NextResponse.json({
      paymentId: pagbankOrder.id,
      pixCopyPaste: copyPaste,
      pixQrCode: qrCodeImage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
