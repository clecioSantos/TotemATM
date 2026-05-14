"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Product } from '../../../../totem/app/index';
import { firestore } from '@/src/services/firebase';

// URL do seu backend Express
const API_BASE_URL = 'http://localhost:3010';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Removido orderBy temporariamente para evitar falhas por falta de índice no Firestore
    const q = query(collection(firestore, 'products'));
    
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
      
      // Ordenação manual no cliente para garantir funcionamento sem erros de índice
      setProducts(items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setLoading(false);
    }, (error) => {
      console.error("🔥 Erro useProducts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveProduct = async (data: Partial<Product>, file?: File) => {
    let imageUrl = data.imageUrl || "";

    // 1. Se houver um novo arquivo, faz o upload para o backend Express
    if (file) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        // Se for edição, envia a URL antiga para o backend deletar o arquivo anterior
        if (data.imageUrl) {
          formData.append('oldImageUrl', data.imageUrl);
        }

        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Falha no servidor de imagens');

        const result = await response.json();
        imageUrl = `${API_BASE_URL}${result.imageUrl}`;
      } catch (error) {
        // Se o servidor de imagens falhar, ainda permitimos salvar o produto sem imagem
        console.warn("LOG: [useProducts] Servidor de imagens offline. Salvando sem nova imagem.");
        alert("Aviso: A imagem não pôde ser enviada porque o servidor de arquivos está offline, mas os dados do produto serão salvos.");
      }
    }

    // 2. Salva ou atualiza no Firestore
    if (data.id) {
      const productRef = doc(firestore, 'products', data.id);
      await updateDoc(productRef, { ...data, imageUrl });
    } else {
      await addDoc(collection(firestore, 'products'), {
        ...data,
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
    const fileName = product?.imageUrl?.split('/').pop();
    if (fileName && product?.imageUrl?.includes('/uploads/')) {
      try {
        await fetch(`${API_BASE_URL}/api/upload/${fileName}`, { method: 'DELETE' });
      } catch (error) {
        console.warn("LOG: [useProducts] Não foi possível deletar o arquivo físico no servidor:", error);
      }
    }

    // 2. Remove o documento do Firestore
    await deleteDoc(doc(firestore, 'products', id));
  };

  return { products, loading, saveProduct, removeProduct };
};
