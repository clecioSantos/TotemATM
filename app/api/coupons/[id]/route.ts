import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";
import { Timestamp } from "firebase-admin/firestore";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getAdminDb();

    const existing = await db.collection("coupons").doc(id).get();
    if (!existing.exists) {
      return NextResponse.json({ success: false, error: "Cupom não encontrado" }, { status: 404 });
    }

    const updateData: any = { updatedAt: Timestamp.now() };
    const fields = [
      "type", "value", "minOrderValue", "maxDiscount", "usageLimit",
      "perCustomerLimit", "firstPurchaseOnly", "deliveryOnly", "pickupOnly", "pixOnly",
      "active", "startDate", "endDate"
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.code) {
      updateData.code = body.code.toUpperCase().trim();
    }

    await db.collection("coupons").doc(id).update(updateData);

    logger.info("API_COUPONS", "Cupom atualizado", { id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("API_COUPONS", "Erro ao atualizar cupom", error);
    return NextResponse.json({ success: false, error: "Erro ao atualizar cupom" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    const existing = await db.collection("coupons").doc(id).get();
    if (!existing.exists) {
      return NextResponse.json({ success: false, error: "Cupom não encontrado" }, { status: 404 });
    }

    await db.collection("coupons").doc(id).delete();

    logger.info("API_COUPONS", "Cupom removido", { id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("API_COUPONS", "Erro ao remover cupom", error);
    return NextResponse.json({ success: false, error: "Erro ao remover cupom" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    const doc = await db.collection("coupons").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "Cupom não encontrado" }, { status: 404 });
    }

    const coupon = { id: doc.id, ...doc.data() };

    const usageSnap = await db.collection("coupon_usage")
      .where("couponId", "==", id)
      .get();

    const usage = usageSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const totalDiscount = usage.reduce((sum: number, u: any) => sum + (u.discountApplied || 0), 0);
    const uniqueCustomers = new Set(usage.map((u: any) => u.customerId)).size;

    return NextResponse.json({
      success: true,
      coupon,
      stats: {
        totalUsage: usage.length,
        totalDiscount,
        uniqueCustomers,
        usage,
      },
    });
  } catch (error: any) {
    logger.error("API_COUPONS", "Erro ao buscar cupom", error);
    return NextResponse.json({ success: false, error: "Erro ao buscar cupom" }, { status: 500 });
  }
}
