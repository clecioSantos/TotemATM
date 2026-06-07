"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, query, where, doc, updateDoc, Timestamp
} from 'firebase/firestore';
import { firestore } from '@/src/services/firebase';
import { OrderReview } from '@totem/shared/types';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { logger } from '@/src/lib/logger';

export function useAdminReviews() {
  const [reviews, setReviews] = useState<(OrderReview & { customerName?: string; orderNumber?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(firestore, 'order_reviews'),
      where('companyId', '==', user.companyId)
    );
    const unsub = onSnapshot(q,
      async (snap) => {
        try {
          const items = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
              updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
              adminReplyAt: data.adminReplyAt
                ? (data.adminReplyAt as Timestamp)?.toDate() || new Date()
                : null,
            } as OrderReview & { customerName?: string; orderNumber?: string };
          });

          items.sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any).seconds * 1000;
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any).seconds * 1000;
            return bTime - aTime;
          });

          const { getDoc } = await import('firebase/firestore');
          const enriched = await Promise.all(items.map(async (review) => {
            try {
              const orderSnap = await getDoc(doc(firestore, 'orders', review.orderId));
              if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                review.customerName = orderData.userName || orderData.customerName || '';
                review.orderNumber = `#${review.orderId.slice(-6).toUpperCase()}`;
              }
              const userSnap = await getDoc(doc(firestore, 'users', review.customerId));
              if (userSnap.exists()) {
                const userData = userSnap.data();
                if (!review.customerName) review.customerName = userData.name || '';
              }
            } catch { }
            return review;
          }));
          setReviews(enriched);
        } catch (e) {
          logger.error("useAdminReviews", "Erro ao processar avaliações", e);
        }
        setLoading(false);
      },
      (err) => {
        logger.error("useAdminReviews", "Erro no snapshot de avaliações", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user?.companyId]);

  const replyToReview = useCallback(async (reviewId: string, reply: string) => {
    try {
      await updateDoc(doc(firestore, 'order_reviews', reviewId), {
        adminReply: reply,
        adminReplyAt: Timestamp.now(),
      });
    } catch (e) {
      logger.error("useAdminReviews", "Erro ao salvar resposta", e);
      throw e;
    }
  }, []);

  return { reviews, loading, replyToReview };
}
