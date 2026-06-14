import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { firestore } from "../../../../src/services/firebase";
import { Coupon, CouponUsage } from "@totem/shared/types/coupons";
import { logger } from "@/src/lib/logger";

const COLLECTION = "coupons";
const USAGE_COLLECTION = "coupon_usage";

export const couponRepository = {
  async getById(id: string): Promise<Coupon | null> {
    try {
      const docSnap = await getDoc(doc(firestore, COLLECTION, id));
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Coupon;
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao buscar cupom por ID", error);
      return null;
    }
  },

  async getByCode(storeId: string, code: string): Promise<Coupon | null> {
    try {
      const q = query(
        collection(firestore, COLLECTION),
        where("storeId", "==", storeId),
        where("code", "==", code.toUpperCase().trim())
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const doc = snap.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Coupon;
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao buscar cupom por código", error);
      return null;
    }
  },

  async listByStore(storeId: string): Promise<Coupon[]> {
    try {
      const q = query(
        collection(firestore, COLLECTION),
        where("storeId", "==", storeId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        } as Coupon;
      });
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao listar cupons", error);
      return [];
    }
  },

  async create(data: Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<string | null> {
    try {
      const ref = doc(collection(firestore, COLLECTION));
      const docData = {
        ...data,
        code: data.code.toUpperCase().trim(),
        usageCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, docData);
      logger.info("COUPON_REPO", `Cupom criado: ${ref.id}`, { code: data.code });
      return ref.id;
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao criar cupom", error);
      return null;
    }
  },

  async update(id: string, data: Partial<Coupon>): Promise<boolean> {
    try {
      const updateData = { ...data, updatedAt: serverTimestamp() };
      if (updateData.code) updateData.code = (updateData.code as string).toUpperCase().trim();
      delete (updateData as any).id;
      delete (updateData as any).createdAt;
      delete (updateData as any).usageCount;
      await updateDoc(doc(firestore, COLLECTION, id), updateData);
      logger.info("COUPON_REPO", `Cupom atualizado: ${id}`);
      return true;
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao atualizar cupom", error);
      return false;
    }
  },

  async remove(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(firestore, COLLECTION, id));
      logger.info("COUPON_REPO", `Cupom removido: ${id}`);
      return true;
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao remover cupom", error);
      return false;
    }
  },

  async incrementUsage(id: string): Promise<boolean> {
    try {
      await updateDoc(doc(firestore, COLLECTION, id), {
        usageCount: Timestamp.now() as any,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(doc(firestore, COLLECTION, id));
      const current = snap.data()?.usageCount || 0;
      await updateDoc(doc(firestore, COLLECTION, id), {
        usageCount: current + 1,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao incrementar uso", error);
      return false;
    }
  },

  // Coupon Usage tracking
  async registerUsage(data: Omit<CouponUsage, "id" | "createdAt">): Promise<string | null> {
    try {
      const ref = doc(collection(firestore, USAGE_COLLECTION));
      await setDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao registrar uso", error);
      return null;
    }
  },

  async getUsageCount(couponId: string): Promise<number> {
    try {
      const q = query(collection(firestore, USAGE_COLLECTION), where("couponId", "==", couponId));
      const snap = await getDocs(q);
      return snap.size;
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao contar usos", error);
      return 0;
    }
  },

  async getCustomerUsageCount(couponId: string, customerId: string): Promise<number> {
    try {
      const q = query(
        collection(firestore, USAGE_COLLECTION),
        where("couponId", "==", couponId),
        where("customerId", "==", customerId)
      );
      const snap = await getDocs(q);
      return snap.size;
    } catch (error) {
      logger.error("COUPON_REPO", "Erro ao contar usos do cliente", error);
      return 0;
    }
  },

  async hasCompletedOrders(customerId: string): Promise<boolean> {
    try {
      const q = query(
        collection(firestore, "orders"),
        where("customerId", "==", customerId),
        where("status", "in", ["finished", "paid", "preparing", "ready", "delivering"])
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch {
      return false;
    }
  },
};
