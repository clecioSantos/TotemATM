import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/lib/logger";
import { MercadoPagoService } from "@/app/services/mercadopago/mercadopago.service";
import { getAdminDb } from "@/src/services/firebase-admin";

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10);
  let requestBody: Record<string, unknown> = {};

  try {
    requestBody = await req.json();
    const orderId = requestBody.orderId as string | undefined;
    const amount = requestBody.amount as number | undefined;
    const customerName = requestBody.customerName as string | undefined;
    const customerEmail = requestBody.customerEmail as string | undefined;
    const customerTaxId = requestBody.customerTaxId as string | undefined;
    const customerPhone = requestBody.customerPhone as string | undefined;
    const description = requestBody.description as string | undefined;
    const companyId = requestBody.companyId as string | undefined;

    logger.info("API_PIX", `[${requestId}] Iniciando criação de pagamento`, {
      orderId,
      amount,
      hasCustomerName: !!customerName,
      hasCompanyId: !!companyId,
      provider: process.env.PAYMENT_PROVIDER || "pagbank",
    });

    if (!orderId || !amount) {
      logger.warn("API_PIX", `[${requestId}] orderId ou amount ausentes`, undefined, { orderId, amount });
      return NextResponse.json(
        { success: false, error: "orderId e amount são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanOrderId = orderId.replace(/^ORDER-/, "");
    const isSandbox = false;

    let mercadopagoAccessToken: string | undefined;
    let applicationFee: number | undefined;
    let mercadopagoUserId: string | undefined;

    if (companyId) {
      try {
        const db = getAdminDb();
        const companyDoc = await db.collection("companies").doc(companyId).get();

        if (companyDoc.exists) {
          const companyData = companyDoc.data()!;

          if (companyData.mercadopago_connected && companyData.mercadopago_access_token) {
            const expiresAt = companyData.mercadopago_token_expires_at?.toDate?.() || companyData.mercadopago_token_expires_at;
            let token = companyData.mercadopago_access_token;

            if (expiresAt && new Date() > expiresAt && companyData.mercadopago_refresh_token) {
              try {
                const refreshResult = await MercadoPagoService.refreshToken(companyData.mercadopago_refresh_token);
                token = refreshResult.access_token as string;
                await db.collection("companies").doc(companyId).update({
                  mercadopago_access_token: token,
                  mercadopago_refresh_token: refreshResult.refresh_token || companyData.mercadopago_refresh_token,
                  mercadopago_token_expires_at: MercadoPagoService.calculateExpiresAt(refreshResult.expires_in as number),
                });
              } catch (refreshError) {
                logger.error("API_PIX", `[${requestId}] Erro ao renovar token Mercado Pago`, refreshError);
              }
            }

            mercadopagoAccessToken = token;
            mercadopagoUserId = companyData.mercadopago_user_id as string | undefined;

            // Comissão da plataforma
            let effectiveRate = companyData.platform_commission_percent || 0;

            // Desconta a taxa do método de pagamento (PIX)
            try {
              const globalSnap = await db.collection("settings").doc("global").get();
              if (globalSnap.exists) {
                const pixFee = globalSnap.data().pixFee || 0;
                effectiveRate = Math.max(0, effectiveRate - pixFee);
              }
            } catch (globalErr) {
              logger.warn("API_PIX", `[${requestId}] Erro ao ler taxas globais`, globalErr);
            }

            let baseFee = Math.round((amount * effectiveRate) / 100 * 100) / 100;

            // Soma a taxa de conveniência do pedido (vai para a plataforma, não para a loja)
            let orderConvenienceFee = 0;
            try {
              const orderDoc = await db.collection("orders").doc(cleanOrderId).get();
              if (orderDoc.exists) {
                orderConvenienceFee = orderDoc.data()?.convenienceFee || 0;
              }
            } catch (orderErr) {
              logger.warn("API_PIX", `[${requestId}] Erro ao ler conveniência do pedido`, orderErr);
            }

            applicationFee = Math.round((baseFee + orderConvenienceFee) * 100) / 100;

            if (!companyData.platform_commission_percent) {
              logger.error("API_PIX", `[${requestId}] Mercado Pago conectado mas sem comissão configurada`, undefined, {
                companyId,
                platform_commission_percent: companyData.platform_commission_percent,
              });
              return NextResponse.json(
                { success: false, error: "Comissão da plataforma não configurada para esta loja" },
                { status: 400 }
              );
            }

            logger.info("API_PIX", `[${requestId}] Usando token Mercado Pago da loja`, {
              companyId,
              hasToken: !!mercadopagoAccessToken,
              applicationFee,
            });
          }
        }
      } catch (companyError) {
        logger.warn("API_PIX", `[${requestId}] Erro ao buscar dados da loja`, companyError);
      }
    }

    const { MercadoPagoProvider } = await import("@/app/services/mercadopago/mercadopago.provider");
    const provider = new MercadoPagoProvider();
    logger.info("API_PIX", `[${requestId}] Provider forçado: ${provider.name}`);

    logger.info("API_PIX", `[${requestId}] Chamando provider.createPayment`, {
      cleanOrderId,
      amount,
    });

    const payment = await provider.createPayment({
      orderId: cleanOrderId,
      amount,
      customerName,
      customerEmail,
      customerTaxId,
      customerPhone,
      description,
      accessToken: mercadopagoAccessToken,
      applicationFee,
    });

    logger.info("API_PIX", `[${requestId}] Pagamento criado com sucesso`, {
      provider: payment.provider,
      paymentId: payment.paymentId,
      status: payment.status,
      hasQrCode: !!payment.qrCode,
      hasPixCode: !!payment.pixCode,
    });

    try {
      const db = getAdminDb();
      const paymentUpdate: Record<string, unknown> = {
        paymentId: payment.paymentId,
        paymentProvider: payment.provider,
        paymentStatus: payment.status,
        updatedAt: new Date(),
      };

      if (companyId) {
        paymentUpdate.storeId = companyId;
      }

      if (mercadopagoUserId) {
        paymentUpdate.mercadopagoUserId = mercadopagoUserId;
      }

      await db.collection("orders").doc(cleanOrderId).update(paymentUpdate);

      logger.info("API_PIX", `[${requestId}] Informações de pagamento salvas no pedido`, {
        orderId: cleanOrderId,
        paymentId: payment.paymentId,
        provider: payment.provider,
        companyId,
      });
    } catch (saveError) {
      logger.warn("API_PIX", `[${requestId}] Erro ao salvar informações de pagamento no pedido`, saveError);
    }

    // Fallback: agendar verificação de pagamento
    logger.info("API_PIX", `[${requestId}] Agendando fallback check para pagamento ${payment.paymentId}`);
    try {
      const { scheduleMercadoPagoFallbackChecks } = await import(
        "@/app/services/mercadopago/mercadopago-fallback.service"
      );
      scheduleMercadoPagoFallbackChecks(
        cleanOrderId,
        payment.paymentId,
        mercadopagoAccessToken,
        companyId,
        payment.expiresAt
      );
    } catch (fallbackError) {
      logger.warn("API_PIX", `[${requestId}] Erro ao agendar fallback check`, fallbackError);
    }

    return NextResponse.json({
      success: true,
      provider: payment.provider,
      paymentId: payment.paymentId,
      qrCode: payment.qrCode,
      pixCode: payment.pixCode,
      status: payment.status,
      expiresAt: payment.expiresAt,
      pixQrCode: payment.qrCode,
      pixCopyPaste: payment.pixCode,
    });
  } catch (error: any) {
    const httpStatus = error?.status;
    const responseData = error?.responseData;

    logger.error("API_PIX", `[${requestId}] Erro ao criar pagamento PIX`, error, {
      endpoint: "/api/payments/pix",
      provider: "mercadopago",
      httpStatus,
      responseData,
      errorMessage: error?.message || String(error),
      errorStack: error?.stack,
      requestBody,
      nodeEnv: process.env.NODE_ENV,
      hasAbacateKey: !!process.env.ABACATEPAY_API_KEY,
      hasPagbankToken: !!process.env.PAGBANK_TOKEN,
      paymentProvider: process.env.PAYMENT_PROVIDER,
    });

    const errorCode = responseData?.cause?.[0]?.code || responseData?.cause?.[0]?.description || "";
    const userMessage = httpStatus === 401 || httpStatus === 403
      ? "Erro de autenticação com o gateway de pagamento."
      : "O PIX está temporariamente indisponível para esta loja. Tente novamente mais tarde ou utilize outra forma de pagamento.";

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: httpStatus || 500 }
    );
  }
}
