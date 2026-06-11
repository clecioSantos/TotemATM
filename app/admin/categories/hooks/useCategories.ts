"use client";

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy, doc, addDoc,
  updateDoc, deleteDoc, Timestamp, where
} from 'firebase/firestore';
import { firestore as db } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { logger } from '@/src/lib/logger';

export interface Category {
  id: string;
  companyId: string;
  name: string;
  possuiTamanhos?: boolean;
  possuiSabores?: boolean;
  schedulingMode?: "none" | "optional" | "required";
  minimumPreparationMinutes?: number;
  requiresCustomerContact?: boolean;
  customerInstructions?: string;
  createdAt: Date;
}

export const useCategoriesStore = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'categories'),
      where('companyId', '==', user.companyId),
      orderBy('name', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      try {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt instanceof Timestamp
            ? doc.data().createdAt.toDate()
            : new Date(),
        })) as Category[];

        setCategories(data);
        setLoading(false);
      } catch (mapError) {
        logger.error("useCategories", "Erro ao mapear categorias", mapError);
        setLoading(false);
      }
    }, (error: unknown) => {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useCategories", `Erro ao carregar categorias: ${errMsg}`, error);
      setLoading(false);
    });
  }, [user?.companyId]);

  const saveCategory = async (data: Partial<Category>) => {
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        possuiTamanhos: data.possuiTamanhos ?? false,
        possuiSabores: data.possuiSabores ?? false,
        schedulingMode: data.schedulingMode || "none",
        minimumPreparationMinutes: data.minimumPreparationMinutes ?? null,
        requiresCustomerContact: data.requiresCustomerContact ?? false,
        customerInstructions: data.customerInstructions || null,
      };
      if (data.id) {
        const ref = doc(db, 'categories', data.id);
        await updateDoc(ref, payload);
        logger.info("useCategories", `Categoria ${data.id} atualizada`);
      } else {
        const docRef = await addDoc(collection(db, 'categories'), {
          ...payload,
          companyId: user?.companyId,
          createdAt: Timestamp.now(),
        });
        logger.info("useCategories", `Categoria criada: ${docRef.id}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useCategories", `Erro ao salvar categoria: ${errMsg}`, error);
      throw error;
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      logger.info("useCategories", `Categoria ${id} removida`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useCategories", `Erro ao remover categoria ${id}: ${errMsg}`, error);
      throw error;
    }
  };

  return { categories, loading, saveCategory, removeCategory };
};
