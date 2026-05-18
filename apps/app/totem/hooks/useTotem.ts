"use client";
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product, Category, CartItem } from '@totem/shared/types';

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

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const updateItemObservation = (productId: string, observation: string) => {
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, observation } : item
    ));
  };

  const finishOrder = async (customerName: string, tableNumber: string) => {
    if (cart.length === 0) return;
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    const orderData = {
      customerName,
      tableNumber,
      items: cart.map(i => ({ 
        productId: i.id, 
        name: i.name, 
        price: i.price, 
        quantity: i.quantity,
        observation: i.observation || "" 
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
