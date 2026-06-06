"use client";

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy, doc, addDoc,
  updateDoc, deleteDoc, Timestamp, where
} from 'firebase/firestore';
import { Product } from '@totem/shared/types';
import { firestore } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { logger } from '@/src/lib/logger';

const API_BASE_URL = '';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'products'),
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
        }) as Product[];

        const normalizeDate = (value: Date | { seconds: number; nanoseconds: number }) =>
          value instanceof Date
            ? value
            : new Date(value.seconds * 1000 + value.nanoseconds / 1e6);

        setProducts(items.sort((a, b) => {
          const dateA = normalizeDate(a.createdAt);
          const dateB = normalizeDate(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        }));
        setLoading(false);
      } catch (mapError) {
        logger.error("useProducts", "Erro ao mapear produtos", mapError);
        setLoading(false);
      }
    }, (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("useProducts", `Erro ao carregar produtos: ${errMsg}`, err);
      setError(errMsg || 'Falha ao carregar produtos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  const saveProduct = async (data: Partial<Product>, file?: File) => {
    let imageUrl = data.imageUrl || "";

    if (file) {
      try {
        const formData = new FormData();
        formData.append('image', file);

        if (data.imageUrl) {
          formData.append('oldImageUrl', data.imageUrl);
        }

        const response = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          logger.warn("useProducts", "Upload response not ok", undefined, {
            status: response.status,
            result,
          });
          throw new Error(result?.error || 'Falha no servidor de imagens');
        }

        imageUrl = result.imageUrl;
      } catch (uploadError: any) {
        logger.warn("useProducts", `Upload de imagem falhou: ${uploadError?.message || uploadError}`, uploadError);
        alert(`Aviso: A imagem não pôde ser enviada. Os dados do produto serão salvos sem imagem.`);
      }
    }

    try {
      if (data.id) {
        const productRef = doc(firestore, 'products', data.id);
        await updateDoc(productRef, { ...data, imageUrl });
        logger.info("useProducts", `Produto ${data.id} atualizado`);
      } else {
        const docRef = await addDoc(collection(firestore, 'products'), {
          ...data,
          companyId: user?.companyId,
          imageUrl,
          active: data.active ?? true,
          featured: data.featured ?? false,
          createdAt: Timestamp.now(),
        });
        logger.info("useProducts", `Produto criado: ${docRef.id}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useProducts", `Erro ao salvar produto: ${errMsg}`, error);
      throw error;
    }
  };

  const removeProduct = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      const fileUrl = product?.imageUrl;

      if (fileUrl && fileUrl.includes('res.cloudinary.com')) {
        try {
          await fetch(`/api/upload?fileUrl=${encodeURIComponent(fileUrl)}`, { method: 'DELETE' });
          logger.info("useProducts", `Imagem do produto ${id} deletada`);
        } catch (deleteError) {
          logger.warn("useProducts", `Não foi possível deletar a imagem do produto ${id}`, deleteError);
        }
      }

      await deleteDoc(doc(firestore, 'products', id));
      logger.info("useProducts", `Produto ${id} removido`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useProducts", `Erro ao remover produto ${id}: ${errMsg}`, error);
      throw error;
    }
  };

  return { products, loading, error, saveProduct, removeProduct };
};
