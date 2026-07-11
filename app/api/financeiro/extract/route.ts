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

    let query = db.collection("orders")
      .where("companyId", "==", companyId)
      .where("paymentStatus", "==", "PAID");
    
    if (startDate) {
      query = query.where("paidAt", ">=", startDate);
    }

    const snapshot = await query.get();

    const orders: any[] = [];
    let totalReceived = 0;
    let totalBoraCommission = 0;
    let totalMethodFees = 0;
    let totalConvenienceFees = 0;
    let totalStoreNet = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const orderTotal = data.total || 0;
      const convenienceFeeValue = data.convenienceFee || 0;
      const method = data.paymentMethod === "credit_card" ? "credit_card" : "PIX";
      const methodFeePercent = method === "credit_card" ? creditCardFee : pixFee;
      const effectiveRate = Math.max(0, commissionPercent - methodFeePercent);
      const baseFee = Math.round((orderTotal * effectiveRate) / 100 * 100) / 100;
      const boraShare = baseFee + convenienceFeeValue;
      const storeNet = orderTotal - boraShare;

      orders.push({
        id: doc.id,
        customerName: data.customerName || data.userName || "Cliente",
        total: orderTotal,
        paymentMethod: method,
        convenienceFee: convenienceFeeValue,
        commissionBase: baseFee,
        methodFee: Math.round((orderTotal * methodFeePercent) / 100 * 100) / 100,
        boraShare,
        storeNet,
        paidAt: data.paidAt ? (data.paidAt.toDate ? data.paidAt.toDate() : new Date(data.paidAt)) : null,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      });

      totalReceived += orderTotal;
      totalBoraCommission += baseFee;
      totalMethodFees += Math.round((orderTotal * methodFeePercent) / 100 * 100) / 100;
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
