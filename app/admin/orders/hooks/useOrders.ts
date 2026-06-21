"use client";

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy, Timestamp, addDoc,
  doc, updateDoc, deleteDoc, where, getDocs, getDoc, setDoc
} from 'firebase/firestore';
import { Order } from '../types';
import { firestore, auth } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { logger } from '@/src/lib/logger';
import { useConfirm } from "@/app/components/ConfirmProvider";

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showAlert } = useConfirm();

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'orders'),
      where('companyId', '==', user.companyId)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        try {
          const items = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date();

            return {
              id: doc.id,
              ...data,
              createdAt,
            } as Omit<Order, 'createdAt'> & { createdAt: Date };
          });

          const filtered = items.filter(
            (o) => o.paymentStatus !== "WAITING_PAYMENT" && o.paymentStatus !== "PENDING"
          );
          setOrders(filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
          setLoading(false);
        } catch (mapError) {
          logger.error("useOrders", "Erro ao mapear pedidos do snapshot", mapError);
          setLoading(false);
        }
      },
      (err: unknown) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.error("useOrders", `Erro no snapshot de pedidos: ${errMsg}`, err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.companyId]);

  const addOrder = async (orderData: Partial<Order>) => {
    try {
      const docRef = await addDoc(collection(firestore, 'orders'), {
        ...orderData,
        companyId: user?.companyId,
        total: Number(orderData.total) || 0,
        status: orderData.status || 'pending',
        createdAt: Timestamp.now(),
      });
      logger.info("useOrders", `Pedido criado: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useOrders", `Erro ao criar pedido: ${errMsg}`, error);
      showAlert("Erro ao criar pedido. Verifique as permissões do Firestore.");
      throw error;
    }
  };

  const findCustomerId = async (orderData: Record<string, unknown>): Promise<string | null> => {
    if (orderData.customerId) return orderData.customerId as string;
    if (orderData.userId) return orderData.userId as string;

    const customerName = (orderData.userName || orderData.customerName) as string | undefined;
    if (!customerName) return null;

    try {
      const usersSnap = await getDocs(
        query(collection(firestore, 'users'), where('name', '==', customerName))
      );
      if (!usersSnap.empty) return usersSnap.docs[0].id;
    } catch { }
    return null;
  };

  const scheduleReviewNotification = async (orderId: string, customerId: string, companyId: string) => {
    try {
      const notifId = `review_${orderId}`;
      const notifRef = doc(firestore, 'notifications', notifId);
      const existing = await getDoc(notifRef);
      if (existing.exists()) {
        logger.info("useOrders", `Notificação de review já existe para pedido ${orderId}`);
        return;
      }

      await setDoc(notifRef, {
        userId: customerId,
        type: 'order_review',
        title: 'Como foi sua experiência?',
        message: 'Seu pedido foi entregue. Avalie sua experiência e ajude a melhorar nosso atendimento.',
        relatedOrderId: orderId,
        isRead: false,
        isResolved: false,
        createdAt: Timestamp.now(),
      });
      logger.info("useOrders", `Notificação de review criada para pedido ${orderId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useOrders", `Erro ao criar notificação de review: ${errMsg}`, error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      const orderData = orders.find((o) => o.id === orderId);
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'finished') {
        updateData.deliveredAt = Timestamp.now();
      }
      if (newStatus === 'paid') {
        updateData.paymentStatus = "PAID";
      }
      await updateDoc(orderRef, updateData);
      logger.info("useOrders", `Pedido ${orderId} atualizado para ${newStatus}`);

      if (orderData?.customerId && auth.currentUser) {
        const statusMessages: Record<string, { title: string; body: string }> = {
          paid: { title: "Pedido Confirmado", body: "Seu pagamento foi confirmado! Seu pedido já está sendo preparado." },
          preparing: { title: "Preparando", body: "Seu pedido está sendo preparado com todo carinho!" },
          ready: { title: "Pedido Pronto", body: "Seu pedido está pronto para entrega/retirada!" },
          delivering: { title: "Saiu para Entrega", body: "Seu pedido saiu para entrega. Fique atento!" },
          finished: { title: "Pedido Entregue", body: "Seu pedido foi entregue. Bom apetite!" },
          cancelled: { title: "Pedido Cancelado", body: "Seu pedido foi cancelado. Entre em contato para mais informações." },
        };

        const msg = statusMessages[newStatus];
        if (msg) {
          const idToken = await auth.currentUser.getIdToken();
          fetch("/api/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ target: "user", uid: orderData.customerId, title: msg.title, body: msg.body, data: { orderId, type: "order_status" } }),
          }).catch((err) => logger.error("useOrders", "Erro ao enviar push", err));
        }
      }

      if (newStatus === 'finished' && orderData?.customerId) {
        await scheduleReviewNotification(orderId, orderData.customerId, (orderData as any).companyId);
      }

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useOrders", `Erro ao atualizar pedido ${orderId}: ${errMsg}`, error);
      throw error;
    }
  };

  const removeOrder = async (orderId: string) => {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await deleteDoc(orderRef);
      logger.info("useOrders", `Pedido ${orderId} removido`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useOrders", `Erro ao remover pedido ${orderId}: ${errMsg}`, error);
    }
  };

  return { orders, loading, addOrder, updateOrderStatus, removeOrder };
};
