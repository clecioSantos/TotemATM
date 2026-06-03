import { NextRequest, NextResponse } from "next/server";
import { PagBankService } from "../../../services/pagbank/pagbank.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, customerName } = body;

    // Garante que o ID enviado ao PagBank seja apenas o ID do documento do Firebase
    // removendo o prefixo "ORDER-" caso ele exista
    const cleanOrderId = orderId.replace(/^ORDER-/, "");

    const pagbankOrder = await PagBankService.createPixOrder(cleanOrderId, amount, customerName);

    const qrCodeData = pagbankOrder.qr_codes[0];
    const copyPaste = qrCodeData.text;
    const qrCodeImage = qrCodeData.links.find((l: any) => l.rel === "QRCODE.PNG")?.href;

    // Rotina de simulação: Espera 10 segundos e envia o pagamento mockado
    // Só executa se estivermos em ambiente de desenvolvimento/sandbox
    if (process.env.PAGBANK_API_URL?.includes("sandbox")) {
      setTimeout(() => {
        PagBankService.simulateSandboxPayment(pagbankOrder.id)
          .then(() => console.log(`Simulação concluída para ${pagbankOrder.id}`))
          .catch(err => console.error("Falha no agendamento da simulação", err));
      }, 10000);
    }

    return NextResponse.json({
      paymentId: pagbankOrder.id,
      pixCopyPaste: copyPaste,
      pixQrCode: qrCodeImage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
