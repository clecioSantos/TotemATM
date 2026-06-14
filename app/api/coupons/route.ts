import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json({ success: false, error: "storeId é obrigatório" }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db.collection("coupons")
      .where("storeId", "==", storeId)
      .get();

    const coupons = snap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    logger.error("API_COUPONS", "Erro ao listar cupons", error);
    return NextResponse.json({ success: false, error: "Erro ao listar cupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, code, type, value, minOrderValue, maxDiscount, usageLimit, perCustomerLimit, firstPurchaseOnly, deliveryOnly, pickupOnly, active, startDate, endDate } = body;

    if (!storeId || !code || !type || value == null) {
      return NextResponse.json(
        { success: false, error: "storeId, code, type e value são obrigatórios" },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    if (!normalizedCode) {
      return NextResponse.json(
        { success: false, error: "Código do cupom inválido" },
        { status: 400 }
      );
    }

    if (type === "percentage" && (value < 1 || value > 100)) {
      return NextResponse.json(
        { success: false, error: "Percentual deve estar entre 1 e 100" },
        { status: 400 }
      );
    }

    if (type === "fixed" && value <= 0) {
      return NextResponse.json(
        { success: false, error: "Valor fixo deve ser maior que zero" },
        { status: 400 }
      );
    }

    if (deliveryOnly && pickupOnly) {
      return NextResponse.json(
        { success: false, error: "Cupom não pode ser apenas para entrega e apenas para retirada ao mesmo tempo" },
        { status: 400 }
      );
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json(
        { success: false, error: "Data final deve ser maior que data inicial" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const existing = await db.collection("coupons")
      .where("storeId", "==", storeId)
      .where("code", "==", normalizedCode)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { success: false, error: "Já existe um cupom com este código para esta loja" },
        { status: 400 }
      );
    }

    const docRef = db.collection("coupons").doc();
    await docRef.set({
      storeId,
      code: normalizedCode,
      type,
      value,
      minOrderValue: minOrderValue || null,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      usageCount: 0,
      perCustomerLimit: perCustomerLimit || null,
      firstPurchaseOnly: !!firstPurchaseOnly,
      deliveryOnly: !!deliveryOnly,
      pickupOnly: !!pickupOnly,
      active: active !== false,
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    logger.info("API_COUPONS", "Cupom criado", { id: docRef.id, code: normalizedCode, storeId });

    return NextResponse.json({
      success: true,
      coupon: { id: docRef.id, code: normalizedCode, type, value },
    });
  } catch (error: any) {
    logger.error("API_COUPONS", "Erro ao criar cupom", error);
    return NextResponse.json({ success: false, error: "Erro ao criar cupom" }, { status: 500 });
  }
}
