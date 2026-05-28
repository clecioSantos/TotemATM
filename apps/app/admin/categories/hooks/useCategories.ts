"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, addDoc, updateDoc, deleteDoc, Timestamp, where } from 'firebase/firestore'; 
import { firestore as db } from '@/src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';

export interface Category {
  id: string;
  companyId: string;
  name: string;
  createdAt: Date;
}

export const useCategoriesStore = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) return;

    const q = query(
      collection(db, 'categories'), 
      where('companyId', '==', user.companyId),
      orderBy('name', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp 
          ? doc.data().createdAt.toDate() 
          : new Date(),
      })) as Category[];
      
      setCategories(data);
      setLoading(false);
    }, (error) => {
      console.error("❌ Erro ao carregar categorias:", error);
      setLoading(false);
    });
  }, [user?.companyId]);

  const saveCategory = async (data: Partial<Category>) => {
    console.log("LOG: [useCategoriesStore] Entrando em saveCategory.");
    console.log("LOG: [useCategoriesStore] DB Instance:", db ? "Conectado" : "ERRO: DB não definido");
    
    try {
    if (data.id) {
      console.log("LOG: [useCategoriesStore] Modo: ATUALIZAÇÃO. ID:", data.id);
      const ref = doc(db, 'categories', data.id);
      await updateDoc(ref, { name: data.name });
      console.log("LOG: [useCategoriesStore] updateDoc concluído.");
    } else {
      console.log("LOG: [useCategoriesStore] Modo: CRIAÇÃO. Nome:", data.name);
      const docRef = await addDoc(collection(db, 'categories'), {
        name: data.name,
        companyId: user?.companyId,
        createdAt: Timestamp.now(),
      });
      console.log("LOG: [useCategoriesStore] addDoc concluído. ID gerado:", docRef.id);
    }
    } catch (error) {
      console.error("LOG: [useCategoriesStore] Erro fatal no Firestore:", error);
      throw error;
    }
  };

  const removeCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
  };

  return { categories, loading, saveCategory, removeCategory };
};
