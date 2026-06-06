"use client";

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, doc, addDoc, updateDoc,
  deleteDoc, where, orderBy
} from 'firebase/firestore';
import { firestore as db } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { CategoryFlavor } from '@totem/shared/types';
import { logger } from '@/src/lib/logger';

export const useFlavors = () => {
  const [flavors, setFlavors] = useState<CategoryFlavor[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'flavors'),
      where('companyId', '==', user.companyId),
      orderBy('ordem', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as CategoryFlavor[];

        setFlavors(items);
        setLoading(false);
      } catch (mapError) {
        logger.error("useFlavors", "Erro ao mapear sabores", mapError);
        setLoading(false);
      }
    }, (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("useFlavors", `Erro ao carregar sabores: ${errMsg}`, err);
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
        logger.info("useFlavors", `Sabor ${data.id} atualizado`);
      } else {
        const docRef = await addDoc(collection(db, 'flavors'), {
          companyId: user?.companyId,
          categoryId: data.categoryId,
          nome: data.nome,
          preco: data.preco ?? 0,
          ordem: data.ordem ?? 0,
          ativo: data.ativo ?? true,
        });
        logger.info("useFlavors", `Sabor criado: ${docRef.id}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useFlavors", `Erro ao salvar sabor: ${errMsg}`, error);
      throw error;
    }
  };

  const removeFlavor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'flavors', id));
      logger.info("useFlavors", `Sabor ${id} removido`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useFlavors", `Erro ao remover sabor ${id}: ${errMsg}`, error);
      throw error;
    }
  };

  return { flavors, loading, saveFlavor, removeFlavor };
};
