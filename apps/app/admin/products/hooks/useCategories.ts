"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Category } from '@totem/shared/types';
import { firestore } from '@/src/services/firebase';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(firestore, 'categories'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Category[]);
      setLoading(false);
    }, (error) => {
      console.error("🔥 Erro useCategories:", error);
      setError(error?.message || 'Falha ao carregar categorias');
      setLoading(false);
    });
  }, []);

  return { categories, loading, error };
};
