"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, getDocs, addDoc, Timestamp
} from 'firebase/firestore';
import { firestore } from '@/src/services/firebase';
import { OrderReview } from '@totem/shared/types';

export function useReviews(userId?: string) {
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!userId) {
      setReviews([]);
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(firestore, 'order_reviews'),
        where('customerId', '==', userId)
      );
      const snap = await getDocs(q);
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
        } as OrderReview;
      });
      setReviews(items);
    } catch (e) {
      console.error('Erro ao buscar avaliações', e);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(async (
    orderId: string,
    companyId: string,
    rating: number,
    comment: string
  ) => {
    const existing = reviews.find(r => r.orderId === orderId);
    if (existing) throw new Error('Avaliação já existe para este pedido.');

    const now = Timestamp.now();
    const docRef = await addDoc(collection(firestore, 'order_reviews'), {
      orderId,
      customerId: userId,
      companyId,
      rating,
      comment: comment || '',
      adminReply: '',
      adminReplyAt: null,
      createdAt: now,
      updatedAt: now,
    });
    await fetchReviews();
    return docRef.id;
  }, [reviews, userId, fetchReviews]);

  const getReviewByOrderId = useCallback((orderId: string) => {
    return reviews.find(r => r.orderId === orderId) || null;
  }, [reviews]);

  return { reviews, loading, submitReview, getReviewByOrderId };
}

export function useReviewByOrderId(orderId?: string, refreshKey?: number) {
  const [review, setReview] = useState<OrderReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setReview(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchReview = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(firestore, 'order_reviews'),
          where('orderId', '==', orderId)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        if (snap.empty) {
          setReview(null);
        } else {
          const d = snap.docs[0];
          const data = d.data();
          setReview({
            id: d.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
            adminReplyAt: data.adminReplyAt
              ? (data.adminReplyAt as Timestamp)?.toDate() || new Date()
              : null,
          } as OrderReview);
        }
      } catch (e) {
        if (!cancelled) console.error('Erro ao buscar avaliação', e);
      }
      if (!cancelled) setLoading(false);
    };
    fetchReview();
    return () => { cancelled = true; };
  }, [orderId, refreshKey]);

  return { review, loading };
}
