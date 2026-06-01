"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp, addDoc, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { Order } from '../types';
import { firestore } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) return;

    const q = query(
      collection(firestore, 'orders'),
      where('companyId', '==', user.companyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date();

          return {
            id: doc.id,
            ...data,
            // Conversão segura: se o timestamp for nulo ou tipo já convertido
            createdAt,
          } as Omit<Order, 'createdAt'> & { createdAt: Date };
        });
        
        // Ordenação manual no cliente
        setOrders(items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        setLoading(false);
      },
      (error) => {
        console.error("LOG: [useOrders] Erro de permissão ou consulta:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.companyId]);

  const addOrder = async (orderData: Partial<Order>) => {
    try {
      await addDoc(collection(firestore, 'orders'), {
        ...orderData,
        companyId: user?.companyId,
        total: Number(orderData.total) || 0,
        status: orderData.status || 'pending',
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("LOG: [useOrders] Erro ao criar pedido:", error);
      alert("Erro de permissão: Verifique as regras de segurança do Firestore para a coleção 'orders'.");
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("LOG: [useOrders] Erro ao atualizar status:", error);
    }
  };

  const removeOrder = async (orderId: string) => {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await deleteDoc(orderRef);
    } catch (error) {
      console.error("LOG: [useOrders] Erro ao remover pedido:", error);
    }
  };

  return { orders, loading, addOrder, updateOrderStatus, removeOrder };
};
