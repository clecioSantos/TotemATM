"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Order } from '../types';
import { firestore } from '@/src/services/firebase';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Removido orderBy da query para evitar erros de índice ausente no console do Firebase
    const q = query(collection(firestore, 'orders'));
    
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
