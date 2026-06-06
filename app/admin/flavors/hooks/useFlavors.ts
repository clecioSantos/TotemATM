"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, where, orderBy } from 'firebase/firestore';
import { firestore as db } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { CategoryFlavor } from '@totem/shared/types';

export const useFlavors = () => {
  const [flavors, setFlavors] = useState<CategoryFlavor[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) return;

    const q = query(
      collection(db, 'flavors'),
      where('companyId', '==', user.companyId),
      orderBy('ordem', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CategoryFlavor[];

      setFlavors(items);
      setLoading(false);
    }, (error) => {
      console.error("🔥 Erro ao carregar sabores:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  const saveFlavor = async (data: Partial<CategoryFlavor>) => {
    try {
      if (data.id) {
        const ref = doc(db, 'flavors', data.id);
        await updateDoc(ref, {
          nome: data.nome,
          preco: data.preco ?? 0,
          ordem: data.ordem ?? 0,
          ativo: data.ativo ?? true,
        });
      } else {
        await addDoc(collection(db, 'flavors'), {
          companyId: user?.companyId,
          categoryId: data.categoryId,
          nome: data.nome,
          preco: data.preco ?? 0,
          ordem: data.ordem ?? 0,
          ativo: data.ativo ?? true,
        });
      }
    } catch (error) {
      console.error("🔥 Erro ao salvar sabor:", error);
      throw error;
    }
  };

  const removeFlavor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'flavors', id));
    } catch (error) {
      console.error("🔥 Erro ao remover sabor:", error);
      throw error;
    }
  };

  return { flavors, loading, saveFlavor, removeFlavor };
};
