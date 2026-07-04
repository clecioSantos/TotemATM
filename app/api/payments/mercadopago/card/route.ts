import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoService } from "@/app/services/mercadopago/mercadopago.service";
import { processApprovedPayment } from "@/src/services/payment/services/order-payment.service";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

const MP_ERROR_MESSAGES: Record<number, string> = {
  2131: "Não foi possível identificar a bandeira do cartão. Verifique os dados e tente novamente.",
};

function getMpErrorMessage(error: any, defaultMsg: string): string {
  if (error?.cause?.[0]?.description) return error.cause[0].description;
  if (error?.code && MP_ERROR_MESSAGES[error.code]) return MP_ERROR_MESSAGES[error.code];
  return defaultMsg;
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10);

  try {
    const body = await req.json();
    const orderId = body.orderId as string | undefined;
    const amount = body.amount as number | undefined;
    const token = body.token as string | undefined;
    const paymentMethodId = body.paymentMethodId as string | undefined;
    const issuerId = body.issuerId as string | undefined;
    const installments = (body.installments as number) || 1;
    const customerEmail = body.customerEmail as string | undefined;
    const description = body.description as string | undefined;
    const companyId = body.companyId as string | undefined;

    logger.info("API_CARD", `[${requestId}] Payload recebido do frontend`, {
      hasOrderId: !!orderId,
      hasAmount: !!amount,
      hasToken: !!token,
      hasPaymentMethodId: !!paymentMethodId,
      paymentMethodId,
      hasIssuerId: !!issuerId,
      issuerId,
      installments,
      hasCustomerEmail: !!customerEmail,
      customerEmail,
      hasCompanyId: !!companyId,
      companyId,
    });

    if (!orderId || !amount || !token || !customerEmail) {
      const missing: string[] = [];
      if (!orderId) missing.push("orderId");
      if (!amount) missing.push("amount");
      if (!token) missing.push("token");
      if (!customerEmail) missing.push("customerEmail");
      return NextResponse.json(
        { success: false, error: `Campos obrigatórios ausentes: ${missing.join(", ")}` },
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

            let effectiveRate = companyData.platform_commission_percent || 0;

            // Desconta a taxa do método de pagamento (cartão de crédito)
            try {
              const globalSnap = await db.collection("settings").doc("global").get();
              if (globalSnap.exists) {
                const cardFee = globalSnap.data().creditCardFee || 0;
                effectiveRate = Math.max(0, effectiveRate - cardFee);
              }
            } catch (globalErr) {
              logger.warn("API_CARD", `[${requestId}] Erro ao ler taxas globais`, globalErr);
            }

            let baseFee = Math.round((amount * effectiveRate) / 100 * 100) / 100;

            let orderConvenienceFee = 0;
            try {
              const orderDoc = await db.collection("orders").doc(cleanOrderId).get();
              if (orderDoc.exists) {
                orderConvenienceFee = orderDoc.data()?.convenienceFee || 0;
              }
            } catch (orderErr) {
              logger.warn("API_CARD", `[${requestId}] Erro ao ler conveniência do pedido`, orderErr);
            }

            applicationFee = Math.round((baseFee + orderConvenienceFee) * 100) / 100;

            if (!companyData.platform_commission_percent) {
              return NextResponse.json(
                { success: false, error: "Comissão da plataforma não configurada para esta loja" },
                { status: 400 }
              );
            }

            logger.info("API_CARD", `[${requestId}] Usando token Mercado Pago da loja (OAuth)`, {
              companyId,
              applicationFee,
              hasAccessToken: !!mercadopagoAccessToken,
            });
          } else {
            logger.info("API_CARD", `[${requestId}] Loja não conectada ao Mercado Pago, usando token da plataforma`);
          }
        }
      } catch (companyError) {
        logger.warn("API_CARD", `[${requestId}] Erro ao buscar dados da loja`, companyError);
      }
    }

    logger.info("API_CARD", `[${requestId}] Chamando MercadoPagoService.createCardPayment`, {
      cleanOrderId,
      amount,
      paymentMethodId,
      issuerId,
      installments,
      hasToken: !!token,
      hasAccessToken: !!mercadopagoAccessToken,
      hasApplicationFee: applicationFee !== undefined && applicationFee > 0,
      applicationFee,
      hasCustomerEmail: !!customerEmail,
    });

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
        paymentMethodId,
        issuerId,
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

      await db.collection("orders").doc(cleanOrderId).update({
        paymentStatus: "FAILED",
        status: "abandoned",
        cancelledAt: new Date(),
        cancelReason: `Cartão rejeitado: ${payment.status_detail || ""}`,
        updatedAt: new Date(),
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
    const responseData = error?.responseData;

    logger.error("API_CARD", `[${requestId}] Erro ao processar pagamento por cartão`, error, {
      errorMessage: error?.message || String(error),
      httpStatus,
      responseData,
    });

    // Cancelar o pedido em caso de erro no pagamento
    try {
      const errBody = await req.json().catch(() => ({}));
      const errOrderId = (errBody.orderId || "").replace(/^ORDER-/, "");
      if (errOrderId) {
        const db = getAdminDb();
        await db.collection("orders").doc(errOrderId).update({
          paymentStatus: "FAILED",
          status: "abandoned",
          cancelledAt: new Date(),
          cancelReason: `Erro no processamento: ${error?.message || "desconhecido"}`,
          updatedAt: new Date(),
        });
      }
    } catch (cancelError) {
      logger.warn("API_CARD", `[${requestId}] Erro ao cancelar pedido após falha`, cancelError);
    }

    let userMessage: string;

    if (httpStatus === 401 || httpStatus === 403) {
      userMessage = "Erro de autenticação com o gateway de pagamento.";
    } else if (responseData) {
      let parsed: any;
      try {
        parsed = typeof responseData === "string" ? JSON.parse(responseData) : responseData;
      } catch {
        parsed = responseData;
      }

      const mpCode = parsed?.code || parsed?.cause?.[0]?.code;
      if (mpCode && MP_ERROR_MESSAGES[mpCode]) {
        userMessage = MP_ERROR_MESSAGES[mpCode];
      } else {
        userMessage = parsed?.cause?.[0]?.description || parsed?.message || error?.message || "Erro ao processar pagamento";
      }
    } else {
      userMessage = error?.message || "Erro ao processar pagamento";
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        ...(responseData ? { code: responseData?.code, cause: responseData?.cause } : {}),
      },
      { status: httpStatus }
    );
  }
}