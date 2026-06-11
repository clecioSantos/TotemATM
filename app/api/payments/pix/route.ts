import { NextRequest, NextResponse } from "next/server";
import { PaymentProviderFactory } from "@/src/services/payment/payment-provider.factory";
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
    const isSandbox = process.env.MERCADOPAGO_ENVIRONMENT?.toLowerCase() === "sandbox"
      || process.env.MERCADOPAGO_ENVIRONMENT?.toLowerCase() === "test";

    if (isSandbox) {
      logger.info("API_PIX", `[${requestId}] Ambiente sandbox detectado — pagamento automático`, {
        cleanOrderId,
        amount,
      });
      const { markOrderAsPaid } = await import(
        "@/src/services/payment/services/order-payment.service"
      );
      await markOrderAsPaid(cleanOrderId);
      return NextResponse.json({
        success: true,
        sandbox: true,
        provider: "sandbox",
        paymentId: cleanOrderId,
        status: "paid",
      });
    }

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
            applicationFee = companyData.platform_commission_percent
              ? (amount * companyData.platform_commission_percent) / 100
              : 0;

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

    logger.info("API_PIX", `[${requestId}] Obtendo provider da factory`);
    const provider = PaymentProviderFactory.create();
    logger.info("API_PIX", `[${requestId}] Provider ativo: ${provider.name}`);

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

    if (provider.name === "mercadopago" && !isSandbox) {
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
    }

    if (provider.name === "pagbank") {
      const envUrl = process.env.PAGBANK_API_URL;
      if (envUrl?.includes("sandbox")) {
        logger.info("API_PIX", `[${requestId}] Agendando simulação PagBank`);
        const { PagBankService } = await import("../../../services/pagbank/pagbank.service");
        const timeoutId = setTimeout(() => {
          PagBankService.simulateSandboxPayment(payment.paymentId)
            .then(() => logger.info("API_PIX", `[${requestId}] Simulação PagBank concluída para ${payment.paymentId}`))
            .catch(err => logger.error("API_PIX", `[${requestId}] Falha na simulação PagBank`, err));
        }, 10000);
        if (typeof timeoutId === "object" && "unref" in timeoutId) {
          (timeoutId as any).unref();
        }
      }
    }

    if (provider.name === "abacatepay") {
      const apiKey = process.env.ABACATEPAY_API_KEY?.trim() || "";
      const isDevKey = apiKey.toLowerCase().includes("dev") || apiKey.toLowerCase().includes("test") || apiKey.toLowerCase().includes("sandbox");
      if (isDevKey) {
        logger.info("ABACATEPAY_MOCK", `[${requestId}] Mock payment scheduled`, {
          paymentId: payment.paymentId,
          orderId: cleanOrderId,
          delay: 5000,
        });

        const timeoutId = setTimeout(async () => {
          try {
            const { markOrderAsPaid } = await import(
              "@/src/services/payment/services/order-payment.service"
            );
            const result = await markOrderAsPaid(cleanOrderId);

            if (result) {
              logger.info("ABACATEPAY_MOCK", `[${requestId}] Mock payment approved`, {
                paymentId: payment.paymentId,
                orderId: cleanOrderId,
              });
            } else {
              logger.warn("ABACATEPAY_MOCK", `[${requestId}] Mock payment skipped (already paid or order not found)`, {
                paymentId: payment.paymentId,
                orderId: cleanOrderId,
              });
            }
          } catch (err) {
            logger.error("ABACATEPAY_MOCK", `[${requestId}] Mock payment failed`, err, {
              paymentId: payment.paymentId,
              orderId: cleanOrderId,
            });
          }
        }, 5000);

        if (typeof timeoutId === "object" && "unref" in timeoutId) {
          (timeoutId as any).unref();
        }
      }
    }

    if (provider.name === "mercadopago") {
      const isSandbox = process.env.MERCADOPAGO_ENVIRONMENT?.toLowerCase() === "sandbox" || process.env.MERCADOPAGO_ENVIRONMENT?.toLowerCase() === "test";
      if (isSandbox) {
        logger.info("MERCADOPAGO_MOCK", `[${requestId}] Mock payment scheduled — will call webhook in 5s`, {
          paymentId: payment.paymentId,
          orderId: cleanOrderId,
          delay: 5000,
        });

        const mockPayload = {
          action: "payment.created",
          data: { id: payment.paymentId },
          external_reference: cleanOrderId,
        };

        const timeoutId = setTimeout(async () => {
          try {
            const protocol = req.headers.get("x-forwarded-proto") || "http";
            const host = req.headers.get("host") || "localhost:3000";
            const webhookUrl = `${protocol}://${host}/api/webhooks/mercadopago`;

            const response = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(mockPayload),
            });

            if (response.ok) {
              logger.info("MERCADOPAGO_MOCK", `[${requestId}] Mock payment approved — webhook responded OK`, {
                paymentId: payment.paymentId,
                orderId: cleanOrderId,
                status: response.status,
              });
            } else {
              logger.warn("MERCADOPAGO_MOCK", `[${requestId}] Mock webhook returned non-OK`, {
                paymentId: payment.paymentId,
                orderId: cleanOrderId,
                status: response.status,
              });
            }
          } catch (err) {
            logger.error("MERCADOPAGO_MOCK", `[${requestId}] Mock payment failed`, err, {
              paymentId: payment.paymentId,
              orderId: cleanOrderId,
            });
          }
        }, 5000);

        if (typeof timeoutId === "object" && "unref" in timeoutId) {
          (timeoutId as any).unref();
        }
      }
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
    const providerName = PaymentProviderFactory.getProviderName();

    logger.error("API_PIX", `[${requestId}] Erro ao criar pagamento PIX`, error, {
      endpoint: "/api/payments/pix",
      provider: providerName,
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

    const userMessage = httpStatus === 401 || httpStatus === 403
      ? "Erro de autenticação com o gateway de pagamento."
      : error?.message || "Erro ao gerar pagamento";

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: httpStatus || 500 }
    );
  }
}
