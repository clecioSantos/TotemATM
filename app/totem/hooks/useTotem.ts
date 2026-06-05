"use client";
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { firestore as db } from '@/src/services/firebase';
import { Product, Category, CartItem, Condiment } from '@totem/shared/types';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { authService } from '@totem/shared/types/auth.service';

export const useTotem = (companyId: string) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [condiments, setCondiments] = useState<Condiment[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>("");
  const [companyBanner, setCompanyBanner] = useState<string>("");
  const [tempoPreparoMin, setTempoPreparoMin] = useState<number>(0);
  const [tempoPreparoMax, setTempoPreparoMax] = useState<number>(0);
  const [companyOpen, setCompanyOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (!db.app.options.projectId || !companyId) return;

    // Busca nome e banner da empresa
    const fetchCompany = async () => {
        const docRef = doc(db, 'companies', companyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setCompanyName(data.name);
            setCompanyBanner(data.banner || "");
            setTempoPreparoMin(data.tempoPreparoMin || 0);
            setTempoPreparoMax(data.tempoPreparoMax || 0);
            setCompanyOpen(data.open !== undefined ? data.open : null);
        }
    }
    fetchCompany();
    
    setLoading(true);

    // Escuta apenas categorias da empresa atual
    const categoryRef = collection(db, 'categories');
    const qCat = query(categoryRef, where('companyId', '==', companyId));
    
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const catData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Category[];
      
      console.log(`[Firebase] ${catData.length} categorias carregadas`);
      setCategories(catData);
    }, (error) => {
      console.error("❌ Erro ao carregar categorias:", error);
      setLoading(false);
    });

    // Escuta apenas produtos ativos da empresa atual
    const productRef = collection(db, 'products');
    const q = query(
      productRef, 
      where('active', '==', true),
      where('companyId', '==', companyId)
    );
    
    const unsubProd = onSnapshot(q, (snapshot) => {
      const prodData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Product[];

      console.log(`[Firebase] ${prodData.length} produtos ativos carregados`);
      setProducts(prodData);
      setLoading(false);
    }, (error) => {
      console.error("❌ Erro ao carregar produtos:", error);
      setLoading(false);
    });

    // Escuta apenas condimentos da empresa atual
    const condimentRef = collection(db, 'condiments');
    const qCond = query(condimentRef, where('companyId', '==', companyId));

    const unsubCond = onSnapshot(qCond, (snapshot) => {
      const condData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Condiment[];
      console.log(`[Firebase] ${condData.length} condimentos carregados`);
      setCondiments(condData);
    }, (error) => {
      console.error("❌ Erro ao carregar adicionais:", error);
      setLoading(false);
    });

    return () => {
      unsubCat();
      unsubProd();
      unsubCond();
    };
  }, [companyId]);

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

  interface OrderIdentification {
    address?: {
      street: string;
      number: string;
      neighborhood: string;
      complement?: string;
    };
    deliveryFee?: number;
  }

  const [isFinishing, setIsFinishing] = useState(false);

  const finishOrder = async (identification: OrderIdentification): Promise<string | undefined> => {
    if (cart.length === 0 || !companyId || isFinishing) return;
    if (companyOpen === false) {
      alert("Loja fechada. Não é possível realizar pedidos no momento.");
      return;
    }
    
    setIsFinishing(true);
    
    try {
      // Calcula o total considerando (preço base + soma dos condimentos) * quantidade
      const itemsTotal = cart.reduce((acc, item) => {
        const condimentsTotal = item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0;
        return acc + ((item.price + condimentsTotal) * item.quantity);
      }, 0);

      const deliveryFee = identification.deliveryFee || 0;
      const total = itemsTotal + deliveryFee;
      
      const orderData = {
        companyId: companyId,
        customerName: user?.name || "Cliente",
        userName: user?.name || "Cliente",
        customerId: user?.uid || null,
        tableNumber: "", // Campo mantido vazio para compatibilidade com o schema
        address: identification.address || null,
        deliveryFee,
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

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      return docRef.id;
    } finally {
      setIsFinishing(false);
    }
  };

  const logout = async () => {
    await authService.signOut();
  };

  return { 
    products, 
    categories, 
    condiments, 
    companyName,
    companyBanner,
    companyOpen,
    tempoPreparoMin,
    tempoPreparoMax,
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    updateItemObservation, 
    finishOrder, 
    clearCart, 
    loading, 
    logout 
  };
};
