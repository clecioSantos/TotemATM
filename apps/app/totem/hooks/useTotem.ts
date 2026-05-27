"use client";
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product, Category, CartItem, Condiment } from '@totem/shared/types';

export const useTotem = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db.app.options.projectId) return;

    // Padrão modular: Escuta de categorias (Idêntico ao que o Admin deve fazer)
    const categoryRef = collection(db, 'categories');
    const unsubCat = onSnapshot(categoryRef, (snapshot) => {
      const catData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Category[];
      
      console.log(`[Firebase] ${catData.length} categorias carregadas`);
      setCategories(catData);
    });

    // Padrão modular: Escuta de produtos ativos
    const productRef = collection(db, 'products');
    const q = query(productRef, where('active', '==', true));
    
    const unsubProd = onSnapshot(q, (snapshot) => {
      const prodData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Product[];

      console.log(`[Firebase] ${prodData.length} produtos ativos carregados`);
      setProducts(prodData);
      setLoading(false);
    });

    return () => {
      unsubCat();
      unsubProd();
    };
  }, []);

  const addToCart = (product: Product, selectedCondiments: Condiment[] = []) => {
    setCart(prev => {
      // Cria uma chave única baseada no ID do produto e nos condimentos selecionados
      const condimentsKey = selectedCondiments.map(c => c.id).sort().join(',');
      const cartItemId = `${product.id}-${condimentsKey}`;

      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      
      return [...prev, { 
        ...product, 
        id: cartItemId, // ID único para controle na listagem do carrinho
        productId: product.id, // Preserva o ID original do produto para o banco de dados
        quantity: 1, 
        condiments: selectedCondiments 
      } as CartItem];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => setCart([]);

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const updateItemObservation = (itemId: string, observation: string) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, observation } : item
    ));
  };

  const finishOrder = async (customerName: string, tableNumber: string) => {
    if (cart.length === 0) return;
    
    // Calcula o total considerando (preço base + soma dos condimentos) * quantidade
    const total = cart.reduce((acc, item) => {
      const condimentsTotal = item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0;
      return acc + ((item.price + condimentsTotal) * item.quantity);
    }, 0);
    
    const orderData = {
      customerName,
      tableNumber,
      items: cart.map(i => ({ 
        productId: i.productId || i.id, 
        name: i.name, 
        price: i.price, 
        quantity: i.quantity,
        observation: i.observation || "",
        condiments: i.condiments || [] // AGORA PERSISTE OS CONDIMENTOS NO FIREBASE
      })),
      total,
      status: 'pending',
      source: 'totem',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'orders'), orderData);
    clearCart();
  };

  return { products, categories, cart, addToCart, removeFromCart, updateQuantity, updateItemObservation, finishOrder, clearCart, loading };
};
