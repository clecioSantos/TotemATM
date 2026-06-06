"use client";

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, doc, addDoc, updateDoc,
  deleteDoc, Timestamp, where
} from 'firebase/firestore';
import { firestore } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { logger } from '@/src/lib/logger';

export interface Condiment {
  id: string;
  companyId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  enabled: boolean;
  categoryIds: string[];
  createdAt: Date;
}

export const useCondiments = () => {
  const [condiments, setCondiments] = useState<Condiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'condiments'),
      where('companyId', '==', user.companyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            imageUrl: data.imageUrl || "",
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          };
        }) as Condiment[];

        setCondiments(items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        setLoading(false);
      } catch (mapError) {
        logger.error("useCondiments", "Erro ao mapear condimentos", mapError);
        setLoading(false);
      }
    }, (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("useCondiments", `Erro ao carregar condimentos: ${errMsg}`, err);
      setError('Falha ao carregar condimentos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  const saveCondiment = async (data: Partial<Condiment>, file?: File) => {
    let imageUrl = data.imageUrl || "";

    if (file) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        if (data.imageUrl) formData.append('oldImageUrl', data.imageUrl);

        const response = await fetch(`/api/upload`, { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || 'Falha no upload');
        imageUrl = result.imageUrl;
      } catch (err: any) {
        logger.warn("useCondiments", `Upload de imagem falhou: ${err?.message || err}`, err);
      }
    }

    try {
      const condimentData = {
        ...data,
        imageUrl,
        price: Number(data.price),
        enabled: data.enabled ?? true,
        categoryIds: data.categoryIds || [],
      };

      if (data.id) {
        const ref = doc(firestore, 'condiments', data.id);
        await updateDoc(ref, condimentData);
        logger.info("useCondiments", `Condimento ${data.id} atualizado`);
      } else {
        const docRef = await addDoc(collection(firestore, 'condiments'), {
          ...condimentData,
          companyId: user?.companyId,
          createdAt: Timestamp.now(),
        });
        logger.info("useCondiments", `Condimento criado: ${docRef.id}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useCondiments", `Erro ao salvar condimento: ${errMsg}`, error);
      throw error;
    }
  };

  const removeCondiment = async (id: string) => {
    try {
      const condiment = condiments.find(c => c.id === id);
      if (condiment?.imageUrl?.includes('res.cloudinary.com')) {
        try {
          await fetch(`/api/upload?fileUrl=${encodeURIComponent(condiment.imageUrl)}`, { method: 'DELETE' });
        } catch {
          logger.warn("useCondiments", `Não foi possível deletar imagem do condimento ${id}`);
        }
      }
      await deleteDoc(doc(firestore, 'condiments', id));
      logger.info("useCondiments", `Condimento ${id} removido`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useCondiments", `Erro ao remover condimento ${id}: ${errMsg}`, error);
      throw error;
    }
  };

  return { condiments, loading, error, saveCondiment, removeCondiment };
};
