"use client";

"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product } from '../types';
import { firestore } from '@/src/services/firebase';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
      })) as Product[]);
      setLoading(false);
    });
  }, []);

  const saveProduct = async (data: Partial<Product>) => {

    if (data.id) {
      const productRef = doc(firestore, 'products', data.id);
      await updateDoc(productRef, { ...data });
    } else {
      await addDoc(collection(firestore, 'products'), {
        ...data,
        active: data.active ?? true,
        featured: data.featured ?? false,
        createdAt: Timestamp.now(),
      });
    }
  };

  const removeProduct = async (id: string) => {
    await deleteDoc(doc(firestore, 'products', id));
  };

  return { products, loading, saveProduct, removeProduct };
};
