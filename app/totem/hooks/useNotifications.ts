"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, doc, updateDoc,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '@/src/services/firebase';
import { AppNotification } from '@totem/shared/types';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          isRead: data.isRead ?? false,
          isResolved: data.isResolved ?? false,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as AppNotification;
      });
      items.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any).seconds * 1000;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any).seconds * 1000;
        return bTime - aTime;
      });
      setNotifications(items);
      setLoading(false);
    }, (e) => {
      console.error('Erro ao buscar notificações', e);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), { isRead: true });
    } catch (e) {
      console.error('Erro ao marcar notificação como lida', e);
    }
  }, []);

  const markAsResolved = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), { isResolved: true, isRead: true });
    } catch (e) {
      console.error('Erro ao marcar notificação como resolvida', e);
    }
  }, []);

  return { notifications, loading, unreadCount, markAsRead, markAsResolved, refetch: () => {} };
}
