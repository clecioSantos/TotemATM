"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { Promotion } from "@totem/shared/types";
import { useAuth } from "@totem/shared/types/AuthProvider";
import {
  createPromotion as serviceCreate,
  updatePromotion as serviceUpdate,
  deletePromotion as serviceDelete,
  checkProductHasActivePromotion,
} from "@/src/services/promotions.service";
import { logger } from "@/src/lib/logger";

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "promotions"),
      where("storeId", "==", user.companyId)
    );

    const unsub = onSnapshot(q, (snap) => {
      try {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data } as unknown as Promotion;
        });
        items.sort((a, b) => {
          const aTime = (a.createdAt as any)?.seconds || 0;
          const bTime = (b.createdAt as any)?.seconds || 0;
          return bTime - aTime;
        });
        setPromotions(items);
        setLoading(false);
      } catch (err) {
        logger.error("usePromotions", "Erro ao mapear promoções", err);
        setLoading(false);
      }
    }, (err) => {
      logger.error("usePromotions", "Erro ao carregar promoções", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.companyId]);

  const createPromotion = useCallback(async (data: any) => {
    if (!user?.companyId) throw new Error("Sem loja vinculada");
    return serviceCreate({ ...data, storeId: user.companyId });
  }, [user?.companyId]);

  const updatePromotion = useCallback(async (id: string, data: any) => {
    return serviceUpdate(id, data);
  }, []);

  const deletePromotion = useCallback(async (id: string) => {
    return serviceDelete(id);
  }, []);

  const checkDuplicate = useCallback(async (productId: string, excludeId?: string) => {
    if (!user?.companyId) return false;
    return checkProductHasActivePromotion(productId, user.companyId, excludeId);
  }, [user?.companyId]);

  return { promotions, loading, createPromotion, updatePromotion, deletePromotion, checkDuplicate };
}
