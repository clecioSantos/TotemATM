import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10);

  try {
    const body = await req.json();
    const { code, storeId, subtotal, customerId, deliveryMode, paymentMethod, totalOrder } = body;

    logger.info("COUPON_VALIDATE", `[${requestId}] Validando cupom`, {
      code,
      storeId,
      subtotal,
      hasCustomerId: !!customerId,
      deliveryMode,
    });

    if (!code || !storeId) {
      return NextResponse.json(
        { valid: false, reason: "Código do cupom é obrigatório." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const couponsRef = db.collection("coupons");
    const snap = await couponsRef
      .where("code", "==", code.toUpperCase().trim())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ valid: false, reason: "Cupom não encontrado." });
    }

    const doc = snap.docs[0];
    const coupon = { id: doc.id, ...doc.data() } as any;

    // Validar acesso do owner: verificar storeIds
    if (coupon.createdByRole === "owner") {
      const storeIds = coupon.storeIds || [];
      if (storeIds.length > 0 && !storeIds.includes(storeId)) {
        return NextResponse.json({ valid: false, reason: "Cupom não disponível para esta loja." });
      }
    } else {
      // Admin coupon: verificar storeId
      if (coupon.storeId !== storeId) {
        return NextResponse.json({ valid: false, reason: "Cupom não encontrado." });
      }
    }

    // 2. Ativo
    if (!coupon.active) {
      return NextResponse.json({ valid: false, reason: "Cupom inativo." });
    }

    // 3. Data de início
    const now = new Date();
    if (coupon.startDate) {
      const start = coupon.startDate.toDate ? coupon.startDate.toDate() : new Date(coupon.startDate);
      if (now < start) {
        return NextResponse.json({ valid: false, reason: "Cupom ainda não está válido." });
      }
    }

    // 4. Data de expiração
    if (coupon.endDate) {
      const end = coupon.endDate.toDate ? coupon.endDate.toDate() : new Date(coupon.endDate);
      if (now > end) {
        return NextResponse.json({ valid: false, reason: "Cupom expirado." });
      }
    }

    // 5. Limite total
    const usageSnap = await db.collection("coupon_usage").where("couponId", "==", coupon.id).get();
    const totalUsage = usageSnap.size;
    if (coupon.usageLimit && totalUsage >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, reason: "Limite de utilização atingido." });
    }

    // 6. Limite por cliente
    if (customerId && coupon.perCustomerLimit) {
      let customerUsage = 0;
      const customerDocs = usageSnap.docs.filter((d: any) => d.data().customerId === customerId);
      customerUsage = customerDocs.length;
      if (customerUsage >= coupon.perCustomerLimit) {
        return NextResponse.json({ valid: false, reason: "Você já utilizou este cupom." });
      }
    }

    // 7. Valor mínimo do pedido
    const orderValue = subtotal || 0;
    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      return NextResponse.json({
        valid: false,
        reason: `Valor mínimo não atingido. Mínimo: R$ ${coupon.minOrderValue.toFixed(2)}`,
      });
    }

    // 8. Primeira compra
    if (coupon.firstPurchaseOnly && customerId) {
      const ordersSnap = await db.collection("orders")
        .where("customerId", "==", customerId)
        .get();
      const hasPaidOrder = ordersSnap.docs.some((d: any) =>
        ["finished", "paid", "preparing", "ready", "delivering"].includes(d.data().status)
      );
      if (hasPaidOrder) {
        return NextResponse.json({ valid: false, reason: "Este cupom é válido apenas para a primeira compra." });
      }
    }

    // 9. Delivery / Pickup
    if (deliveryMode) {
      if (coupon.deliveryOnly && deliveryMode !== "delivery") {
        return NextResponse.json({ valid: false, reason: "Cupom válido apenas para entregas." });
      }
      if (coupon.pickupOnly && deliveryMode !== "pickup") {
        return NextResponse.json({ valid: false, reason: "Cupom válido apenas para retirada." });
      }
    }

    // 10. Apenas PIX
    if (coupon.pixOnly && paymentMethod && paymentMethod !== "PIX") {
      return NextResponse.json({ valid: false, reason: "Cupom válido apenas para pagamento via PIX." });
    }

    // 11. Calcular desconto
    let discountValue = 0;
    if (coupon.type === "percentage") {
      discountValue = (orderValue * coupon.value) / 100;
      if (coupon.maxDiscount && discountValue > coupon.maxDiscount) {
        discountValue = coupon.maxDiscount;
      }
    } else {
      discountValue = Math.min(coupon.value, orderValue);
    }

    discountValue = Math.round(discountValue * 100) / 100;

    // 12. Para cupons de owner, verificar se o desconto não excede a comissão do Bora
    if (coupon.createdByRole === "owner" && discountValue > 0) {
      try {
        const companySnap = await db.collection("companies").doc(storeId).get();
        const companyData = companySnap.data();
        const commissionPercent = companyData?.platform_commission_percent || 0;
        const globalSnap = await db.collection("settings").doc("global").get();
        const globalData = globalSnap.exists ? globalSnap.data() : {};
        const pixFee = globalData?.pixFee || 0;
        const creditCardFee = globalData?.creditCardFee || 0;
        const convenienceFee = globalData?.convenienceFee || 0;
        const methodFee = paymentMethod === "credit_card" ? creditCardFee : pixFee;
        const effectiveRate = Math.max(0, commissionPercent - methodFee);
        const orderValueTotal = totalOrder || subtotal; // fallback para subtotal se totalOrder não for passado
        const boraCommission = (orderValueTotal * effectiveRate) / 100 + convenienceFee;

        if (discountValue > boraCommission) {
          return NextResponse.json({
            valid: false,
            reason: `O desconto do cupom (R$ ${discountValue.toFixed(2)}) excede o limite permitido para esta loja.`,
          });
        }
      } catch (e) {
        logger.warn("COUPON_VALIDATE", `[${requestId}] Erro ao verificar comissão para cupom owner`, e);
      }
    }

    return NextResponse.json({
      valid: true,
      discountValue,
      finalTotal: Math.max(0, orderValue - discountValue),
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        pixOnly: coupon.pixOnly,
      },
    });
  } catch (error: any) {
    logger.error("COUPON_VALIDATE", `[${requestId}] Erro ao validar cupom`, error);
    return NextResponse.json(
      { valid: false, reason: "Erro ao validar cupom. Tente novamente." },
      { status: 500 }
    );
  }
}
