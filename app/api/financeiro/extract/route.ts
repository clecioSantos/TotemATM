import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const period = searchParams.get("period") || "all";

    if (!companyId) {
      return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 });
    }

    const db = getAdminDb();

    const [companySnap, globalSnap] = await Promise.all([
      db.collection("companies").doc(companyId).get(),
      db.collection("settings").doc("global").get(),
    ]);

    if (!companySnap.exists) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const companyData = companySnap.data()!;
    const globalData = globalSnap.exists ? globalSnap.data() : {};
    const commissionPercent = companyData.platform_commission_percent || 6;
    const pixFee = globalData.pixFee || 0;
    const creditCardFee = globalData.creditCardFee || 0;

    const now = new Date();
    let startDate: Date | null = new Date();

    switch (period) {
      case "day":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = null; // "all"
    }

    let query = db.collection("orders").where("companyId", "==", companyId);

    const snapshot = await query.get();

    const orders: any[] = [];
    let totalReceived = 0;
    let totalBoraCommission = 0;
    let totalMethodFees = 0;
    let totalConvenienceFees = 0;
    let totalStoreNet = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Aplicar filtros manualmente para evitar erro de índice
      const isPaid = data.paymentStatus === "PAID";
      const paidAt = data.paidAt ? (data.paidAt.toDate ? data.paidAt.toDate() : new Date(data.paidAt)) : null;
      const isAfterDate = !startDate || (paidAt && paidAt >= startDate);
      
      if (!isPaid || !isAfterDate) continue;

      const orderTotal = data.total || 0;
      const convenienceFeeValue = data.convenienceFee || 0;
      const method = data.paymentMethod === "credit_card" ? "credit_card" : "PIX";
      const methodFeePercent = method === "credit_card" ? creditCardFee : pixFee;

      // BaseFee calculado sobre a comissão cheia (sem descontar taxa do banco)
      let baseFee = Math.round((orderTotal * commissionPercent) / 100 * 100) / 100;
      const methodFeeValue = Math.round((orderTotal * methodFeePercent) / 100 * 100) / 100;
      let couponDiscountApplied = 0;
      let isOwnerCoupon = false;

      // Verificar se o pedido usou cupom de owner (desconto absorvido pelo Bora)
      if (data.couponId && data.discountValue) {
        try {
          const couponDoc = await db.collection("coupons").doc(data.couponId).get();
          if (couponDoc.exists) {
            const couponData = couponDoc.data();
            isOwnerCoupon = couponData?.createdByRole === "owner";
            logger.info("EXTRACT_COUPON", "Verificando cupom do pedido", {
              orderId: doc.id,
              couponId: data.couponId,
              discountValue: data.discountValue,
              createdByRole: couponData?.createdByRole,
              isOwnerCoupon,
            });
            if (isOwnerCoupon) {
              couponDiscountApplied = data.discountValue || 0;
              const fullTotal = orderTotal + couponDiscountApplied;
              const commissionOnFull = Math.round((fullTotal * commissionPercent) / 100 * 100) / 100;
              baseFee = Math.max(0, commissionOnFull - couponDiscountApplied);
              logger.info("EXTRACT_COUPON", "Owner coupon aplicado", {
                orderId: doc.id,
                orderTotal,
                discount: couponDiscountApplied,
                fullTotal,
                commissionOnFull,
                newBaseFee: baseFee,
              });
            }
          }
        } catch (e) {
          // Se não conseguir ler o cupom, usa o cálculo padrão
        }
      }

      const boraShare = baseFee + convenienceFeeValue;
      // Store net = orderTotal - comissão - taxa do banco - conveniência
      const storeNet = orderTotal - baseFee - methodFeeValue - convenienceFeeValue;

      orders.push({
        id: doc.id,
        customerName: data.customerName || data.userName || "Cliente",
        total: orderTotal,
        paymentMethod: method,
        convenienceFee: convenienceFeeValue,
        commissionBase: baseFee,
        methodFee: methodFeeValue,
        boraShare,
        storeNet,
        couponDiscount: isOwnerCoupon ? couponDiscountApplied : 0,
        paidAt,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      });

      totalReceived += orderTotal;
      totalBoraCommission += baseFee;
      totalMethodFees += methodFeeValue;
      totalConvenienceFees += convenienceFeeValue;
      totalStoreNet += storeNet;
    }

    orders.sort((a, b) => (b.paidAt || b.createdAt).getTime() - (a.paidAt || a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      summary: {
        totalReceived: Math.round(totalReceived * 100) / 100,
        totalMethodFees: Math.round(totalMethodFees * 100) / 100,
        totalBoraCommission: Math.round(totalBoraCommission * 100) / 100,
        totalConvenienceFees: Math.round(totalConvenienceFees * 100) / 100,
        totalBoraShare: Math.round((totalBoraCommission + totalConvenienceFees) * 100) / 100,
        totalStoreNet: Math.round(totalStoreNet * 100) / 100,
        orderCount: orders.length,
        commissionPercent,
        pixFee,
        creditCardFee,
      },
      orders,
    });
  } catch (error: any) {
    logger.error("FINANCEIRO_EXTRACT", "Erro ao gerar extrato", error);
    return NextResponse.json({ error: "Erro ao gerar extrato" }, { status: 500 });
  }
}
