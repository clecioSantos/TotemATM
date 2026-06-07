"use client";
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, where, addDoc, serverTimestamp,
  doc, getDoc, orderBy
} from 'firebase/firestore';
import { firestore as db } from '@/src/services/firebase';
import { Product, Category, CartItem, Condiment, CategoryFlavor, SelectedSize, SelectedFlavor } from '@totem/shared/types';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { authService } from '@totem/shared/types/auth.service';
import { logger } from '@/src/lib/logger';

export const useTotem = (companyId: string) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [condiments, setCondiments] = useState<Condiment[]>([]);
  const [flavors, setFlavors] = useState<CategoryFlavor[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>("");
  const [companyBanner, setCompanyBanner] = useState<string>("");
  const [tempoPreparoMin, setTempoPreparoMin] = useState<number>(0);
  const [tempoPreparoMax, setTempoPreparoMax] = useState<number>(0);
  const [companyOpen, setCompanyOpen] = useState<boolean | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!db?.app?.options?.projectId || !companyId) {
      setLoading(false);
      return;
    }

    const fetchCompany = async () => {
      try {
        const docRef = doc(db, 'companies', companyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCompanyName(data.name);
          setCompanyBanner(data.banner || "");
          setTempoPreparoMin(data.tempoPreparoMin || 0);
          setTempoPreparoMax(data.tempoPreparoMax || 0);
          setCompanyOpen(data.open !== undefined ? data.open : null);
          setAverageRating(data.averageRating || 0);
          setReviewCount(data.reviewCount || 0);
        }
      } catch (error) {
        logger.error("useTotem", "Erro ao buscar empresa", error);
      }
    };
    fetchCompany().catch(err => logger.error("useTotem", "fetchCompany falhou", err));

    setLoading(true);

    const categoryRef = collection(db, 'categories');
    const qCat = query(categoryRef, where('companyId', '==', companyId));

    const unsubCat = onSnapshot(qCat, (snapshot) => {
      try {
        const catData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(catData);
      } catch (mapError) {
        logger.error("useTotem", "Erro ao processar categorias", mapError);
      }
    }, (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("useTotem", `Erro ao carregar categorias: ${errMsg}`, err);
      setLoading(false);
    });

    const productRef = collection(db, 'products');
    const q = query(
      productRef,
      where('active', '==', true),
      where('companyId', '==', companyId)
    );

    const unsubProd = onSnapshot(q, (snapshot) => {
      try {
        const prodData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(prodData);
        setLoading(false);
      } catch (mapError) {
        logger.error("useTotem", "Erro ao processar produtos", mapError);
        setLoading(false);
      }
    }, (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("useTotem", `Erro ao carregar produtos: ${errMsg}`, err);
      setLoading(false);
    });

    const condimentRef = collection(db, 'condiments');
    const qCond = query(condimentRef, where('companyId', '==', companyId));

    const unsubCond = onSnapshot(qCond, (snapshot) => {
      try {
        const condData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Condiment[];
        setCondiments(condData);
      } catch (mapError) {
        logger.error("useTotem", "Erro ao processar adicionais", mapError);
        setLoading(false);
      }
    }, (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("useTotem", `Erro ao carregar adicionais: ${errMsg}`, err);
      setLoading(false);
    });

    const flavorRef = collection(db, 'flavors');
    const qFlavors = query(
      flavorRef,
      where('companyId', '==', companyId)
    );

    const unsubFlavors = onSnapshot(qFlavors, (snapshot) => {
      try {
        const allFlavors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as CategoryFlavor[];
        setFlavors(allFlavors
          .filter(f => f.ativo !== false)
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        );
      } catch (mapError) {
        logger.error("useTotem", "Erro ao processar sabores", mapError);
      }
    }, (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("useTotem", `Erro ao carregar sabores: ${errMsg}`, err);
    });

    return () => {
      unsubCat();
      unsubProd();
      unsubCond();
      unsubFlavors();
    };
  }, [companyId]);

  const addToCart = (
    product: Product,
    selectedCondiments: Condiment[] = [],
    tamanhoSelecionado?: SelectedSize,
    saboresSelecionados?: SelectedFlavor[]
  ) => {
    try {
      setCart(prev => {
        const condimentsKey = selectedCondiments.map(c => c.id).sort().join(',');
        const sizeKey = tamanhoSelecionado?.id || '';
        const flavorsKey = (saboresSelecionados || []).map(f => f.id).sort().join(',');
        const cartItemId = `${product.id}-${sizeKey}-${flavorsKey}-${condimentsKey}`;

        const existing = prev.find(item => item.id === cartItemId);
        if (existing) {
          return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
        }

        return [...prev, {
          ...product,
          id: cartItemId,
          productId: product.id,
          quantity: 1,
          condiments: selectedCondiments,
          tamanhoSelecionado,
          saboresSelecionados,
        } as CartItem];
      });
    } catch (error) {
      logger.error("useTotem", "Erro ao adicionar ao carrinho", error);
    }
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
    paymentMethod?: string;
    paymentStatus?: string;
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
      const itemsTotal = cart.reduce((acc, item) => {
        const basePrice = item.tamanhoSelecionado ? item.tamanhoSelecionado.preco : item.price;
        const condimentsTotal = item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0;
        const flavorsTotal = item.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0;
        return acc + ((basePrice + flavorsTotal + condimentsTotal) * item.quantity);
      }, 0);

      const deliveryFee = identification.deliveryFee || 0;
      const total = itemsTotal + deliveryFee;

      const orderData = {
        companyId: companyId,
        customerName: user?.name || "Cliente",
        userName: user?.name || "Cliente",
        customerId: user?.uid || null,
        tableNumber: "",
        address: identification.address || null,
        deliveryFee,
        paymentMethod: identification.paymentMethod || "PIX",
        paymentStatus: identification.paymentStatus || "WAITING_PAYMENT",
        items: cart.map(i => ({
          productId: i.productId || i.id,
          name: i.name,
          price: i.tamanhoSelecionado ? i.tamanhoSelecionado.preco : i.price,
          quantity: i.quantity,
          observation: i.observation || "",
          condiments: i.condiments || [],
          tamanhoSelecionado: i.tamanhoSelecionado || null,
          saboresSelecionados: i.saboresSelecionados || null,
        })),
        total,
        status: 'pending',
        source: 'totem',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      logger.info("useTotem", `Pedido finalizado: ${docRef.id}`);
      clearCart();
      return docRef.id;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useTotem", `Erro ao finalizar pedido: ${errMsg}`, error);
      alert("Erro ao processar pedido. Tente novamente.");
      return undefined;
    } finally {
      setIsFinishing(false);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      logger.error("useTotem", "Erro ao fazer logout", error);
    }
  };

  return {
    products,
    categories,
    condiments,
    flavors,
    companyName,
    companyBanner,
    companyOpen,
    averageRating,
    reviewCount,
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
    logout,
  };
};
