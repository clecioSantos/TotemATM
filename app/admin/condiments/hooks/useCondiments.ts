"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, Timestamp, where } from 'firebase/firestore';
import { firestore } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';

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
    if (!user?.companyId) return;

    const q = query(
      collection(firestore, 'condiments'),
      where('companyId', '==', user.companyId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    }, (err) => {
      console.error("🔥 Error useCondiments:", err);
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
        console.warn("LOG: [useCondiments] Erro no upload", err);
      }
    }

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
    } else {
      await addDoc(collection(firestore, 'condiments'), {
        ...condimentData,
        companyId: user?.companyId,
        createdAt: Timestamp.now(),
      });
    }
  };

  const removeCondiment = async (id: string) => {
    const condiment = condiments.find(c => c.id === id);
    if (condiment?.imageUrl?.includes('res.cloudinary.com')) {
      try { await fetch(`/api/upload?fileUrl=${encodeURIComponent(condiment.imageUrl)}`, { method: 'DELETE' }); } catch {}
    }
    await deleteDoc(doc(firestore, 'condiments', id));
  };

  return { condiments, loading, error, saveCondiment, removeCondiment };
};
