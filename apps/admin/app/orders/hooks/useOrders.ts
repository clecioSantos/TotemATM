"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Order } from '../../../../../index';
import { firestore } from '@/src/services/firebase';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data().createdAt as Timestamp).toDate(),
        })) as Order[]);
        setLoading(false);
      },
      (error) => {
        console.error("LOG: [useOrders] Erro de permissão ou consulta:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addOrder = async (orderData: Partial<Order>) => {
    try {
      await addDoc(collection(firestore, 'orders'), {
        ...orderData,
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

  return { orders, loading, addOrder, updateOrderStatus };
};
