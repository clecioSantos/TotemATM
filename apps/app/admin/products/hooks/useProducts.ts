"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, addDoc, updateDoc, deleteDoc, Timestamp, where } from 'firebase/firestore';
import { Product } from '@totem/shared/types';
import { firestore } from '@/src/services/firebase';
import { useAuth } from '@totem/shared/types/AuthProvider';

// Usar a mesma aplicação Next.js para upload
const API_BASE_URL = '';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.companyId) return;

    const q = query(
      collection(firestore, 'products'),
      where('companyId', '==', user.companyId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          imageUrl: data.imageUrl || "",
          // Conversão segura: serverTimestamp() pode retornar null localmente antes de sincronizar
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
    }, (error) => {
      console.error("🔥 Erro useProducts:", error);
      setError(error?.message || 'Falha ao carregar produtos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  const saveProduct = async (data: Partial<Product>, file?: File) => {
    let imageUrl = data.imageUrl || "";

    // 1. Se houver um novo arquivo, faz o upload para a rota API do Next.js
    if (file) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        // Se for edição, envia a URL antiga para o servidor deletar o arquivo anterior
        if (data.imageUrl) {
          formData.append('oldImageUrl', data.imageUrl);
        }

        const response = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          console.error('LOG: [useProducts] Upload response not ok:', response.status, result);
          throw new Error(result?.error || 'Falha no servidor de imagens');
        }

        imageUrl = result.imageUrl;
      } catch (error: any) {
        // Se o servidor de imagens falhar, ainda permitimos salvar o produto sem imagem
        console.warn("LOG: [useProducts] Servidor de imagens offline. Salvando sem nova imagem.", error?.message || error);
        alert(`Aviso: A imagem não pôde ser enviada: ${error?.message || 'Erro no upload'}. Os dados do produto serão salvos sem imagem.`);
      }
    }

    // 2. Salva ou atualiza no Firestore
    if (data.id) {
      const productRef = doc(firestore, 'products', data.id);
      await updateDoc(productRef, { ...data, imageUrl });
    } else {
      await addDoc(collection(firestore, 'products'), {
        ...data,
        companyId: user?.companyId,
        imageUrl,
        active: data.active ?? true,
        featured: data.featured ?? false,
        createdAt: Timestamp.now(),
      });
    }
  };

  const removeProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    
    // 1. Solicita ao backend a exclusão do arquivo físico apenas se houver um nome de arquivo válido
    const fileUrl = product?.imageUrl;
    if (fileUrl && fileUrl.includes('res.cloudinary.com')) {
      try {
        await fetch(`/api/upload?fileUrl=${encodeURIComponent(fileUrl)}`, { method: 'DELETE' });
      } catch (error) {
        console.warn("LOG: [useProducts] Não foi possível deletar o arquivo físico no servidor:", error);
      }
    }

    // 2. Remove o documento do Firestore
    await deleteDoc(doc(firestore, 'products', id));
  };

  return { products, loading, error, saveProduct, removeProduct };
};
