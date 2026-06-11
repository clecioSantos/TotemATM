import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoService } from "@/app/services/mercadopago/mercadopago.service";
import { processApprovedPayment } from "@/src/services/payment/services/order-payment.service";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10);

  try {
    const body = await req.json();
    const orderId = body.orderId as string | undefined;
    const amount = body.amount as number | undefined;
    const token = body.token as string | undefined;
    const paymentMethodId = body.payment_method_id as string | undefined;
    const issuerId = body.issuer_id as string | undefined;
    const installments = (body.installments as number) || 1;
    const customerEmail = body.customerEmail as string | undefined;
    const customerName = body.customerName as string | undefined;
    const description = body.description as string | undefined;
    const companyId = body.companyId as string | undefined;

    if (!orderId || !amount || !token || !paymentMethodId) {
      return NextResponse.json(
        { success: false, error: "orderId, amount, token e payment_method_id são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanOrderId = orderId.replace(/^ORDER-/, "");

    let mercadopagoAccessToken: string | undefined;
    let applicationFee: number | undefined;

    if (companyId) {
      try {
        const db = getAdminDb();
        const companyDoc = await db.collection("companies").doc(companyId).get();

        if (companyDoc.exists) {
          const companyData = companyDoc.data()!;

          if (companyData.mercadopago_connected && companyData.mercadopago_access_token) {
            const expiresAt = companyData.mercadopago_token_expires_at?.toDate?.() || companyData.mercadopago_token_expires_at;
            let tokenAccess = companyData.mercadopago_access_token;

            if (expiresAt && new Date() > expiresAt && companyData.mercadopago_refresh_token) {
              try {
                const refreshResult = await MercadoPagoService.refreshToken(companyData.mercadopago_refresh_token);
                tokenAccess = refreshResult.access_token as string;
                await db.collection("companies").doc(companyId).update({
                  mercadopago_access_token: tokenAccess,
                  mercadopago_refresh_token: refreshResult.refresh_token || companyData.mercadopago_refresh_token,
                  mercadopago_token_expires_at: MercadoPagoService.calculateExpiresAt(refreshResult.expires_in as number),
                });
              } catch (refreshError) {
                logger.error("API_CARD", `[${requestId}] Erro ao renovar token Mercado Pago`, refreshError);
              }
            }

            mercadopagoAccessToken = tokenAccess;
            applicationFee = companyData.platform_commission_percent
              ? (amount * companyData.platform_commission_percent) / 100
              : 0;

            if (!companyData.platform_commission_percent) {
              return NextResponse.json(
                { success: false, error: "Comissão da plataforma não configurada para esta loja" },
                { status: 400 }
              );
            }

            logger.info("API_CARD", `[${requestId}] Usando token Mercado Pago da loja`, {
              companyId,
              applicationFee,
            });
          }
        }
      } catch (companyError) {
        logger.warn("API_CARD", `[${requestId}] Erro ao buscar dados da loja`, companyError);
      }
    }

    const payment = await MercadoPagoService.createCardPayment({
      orderId: cleanOrderId,
      amount,
      token,
      paymentMethodId,
      issuerId,
      installments,
      payerEmail: customerEmail,
      description,
      accessToken: mercadopagoAccessToken,
      applicationFee,
    });

    const db = getAdminDb();
    await db.collection("orders").doc(cleanOrderId).update({
      paymentId: String(payment.id),
      paymentProvider: "mercadopago",
      paymentMethod: "credit_card",
      paymentStatus: MercadoPagoService.mapStatus(payment.status),
      updatedAt: new Date(),
    });

    if (payment.status === "approved") {
      logger.info("MP_CARD_PAYMENT_APPROVED", "Pagamento por cartão aprovado", {
        orderId: cleanOrderId,
        paymentId: payment.id,
        storeId: companyId,
        amount,
      });

      await processApprovedPayment({
        orderId: cleanOrderId,
        paymentId: String(payment.id),
        provider: "mercadopago",
        storeId: companyId,
      });

      return NextResponse.json({
        success: true,
        status: "approved",
        paymentId: String(payment.id),
        provider: "mercadopago",
      });
    }

    if (payment.status === "rejected") {
      logger.info("MP_CARD_PAYMENT_REJECTED", "Pagamento por cartão rejeitado", {
        orderId: cleanOrderId,
        paymentId: payment.id,
        storeId: companyId,
        amount,
        statusDetail: payment.status_detail,
      });

      return NextResponse.json({
        success: false,
        status: "rejected",
        statusDetail: payment.status_detail,
        error: "Pagamento não aprovado. Verifique os dados do cartão.",
      });
    }

    return NextResponse.json({
      success: true,
      status: MercadoPagoService.mapStatus(payment.status),
      paymentId: String(payment.id),
      provider: "mercadopago",
    });
  } catch (error: any) {
    const httpStatus = error?.status || 500;

    logger.error("API_CARD", `[${requestId}] Erro ao processar pagamento por cartão`, error, {
      errorMessage: error?.message || String(error),
    });

    const userMessage = httpStatus === 401 || httpStatus === 403
      ? "Erro de autenticação com o gateway de pagamento."
      : error?.message || "Erro ao processar pagamento";

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: httpStatus }
    );
  }
}