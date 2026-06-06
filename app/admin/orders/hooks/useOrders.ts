"use client";

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy, Timestamp, addDoc,
  doc, updateDoc, deleteDoc, where
} from 'firebase/firestore';
import { Order } from '../types';
import { firestore } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { logger } from '@/src/lib/logger';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

          setOrders(items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
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
      alert("Erro ao criar pedido. Verifique as permissões do Firestore.");
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      logger.info("useOrders", `Status do pedido ${orderId} atualizado para ${newStatus}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useOrders", `Erro ao atualizar status do pedido ${orderId}: ${errMsg}`, error);
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
