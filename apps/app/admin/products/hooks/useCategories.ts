"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { Category } from '@totem/shared/types';
import { firestore } from '../../../../src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) return;

    const q = query(
      collection(firestore, 'categories'),
      where('companyId', '==', user.companyId),
      orderBy('name', 'asc')
    );
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
  }, [user?.companyId]);

  return { categories, loading, error };
};
