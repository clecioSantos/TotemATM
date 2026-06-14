"use client";
import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, query, where, addDoc, serverTimestamp,
  doc, getDoc, orderBy
} from 'firebase/firestore';
import { firestore as db } from '@/src/services/firebase';
import { Product, Category, CartItem, Condiment, CategoryFlavor, SelectedSize, SelectedFlavor, Promotion } from '@totem/shared/types';
import { useAuth } from '@totem/shared/types/AuthProvider';
import { authService } from '@totem/shared/types/auth.service';
import { logger } from '@/src/lib/logger';
import { incrementSoldUnits } from '@/src/services/promotions.service';

const CART_STORAGE_KEY = "totem-cart";

function savePersistedCart(companyId: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ companyId, items }));
  } catch {}
}

function getPersistedStoreInfo(): { companyId: string; items: CartItem[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data.items)) return { companyId: data.companyId, items: data.items };
  } catch {}
  return null;
}

export const useTotem = (companyId: string) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [condiments, setCondiments] = useState<Condiment[]>([]);
  const [flavors, setFlavors] = useState<CategoryFlavor[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = getPersistedStoreInfo();
    return stored?.items || [];
  });
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>("");
  const [companyBanner, setCompanyBanner] = useState<string>("");
  const [tempoPreparoMin, setTempoPreparoMin] = useState<number>(0);
  const [tempoPreparoMax, setTempoPreparoMax] = useState<number>(0);
  const [companyOpen, setCompanyOpen] = useState<boolean | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

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

    // Active promotions for this store
    const promoRef = collection(db, 'promotions');
    const qPromos = query(
      promoRef,
      where('storeId', '==', companyId),
      where('status', '==', 'active')
    );

    const unsubPromos = onSnapshot(qPromos, (snapshot) => {
      try {
        const promoData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Promotion[];
        setPromotions(promoData);
      } catch (err) {
        logger.error("useTotem", "Erro ao processar promoções", err);
      }
    }, (err: unknown) => {
      logger.error("useTotem", `Erro ao carregar promoções: ${err}`, err);
    });

    return () => {
      unsubCat();
      unsubProd();
      unsubCond();
      unsubFlavors();
      unsubPromos();
    };
  }, [companyId]);

  useEffect(() => {
    if (cart.length === 0) {
      savePersistedCart(companyId, []);
      return;
    }
    const stored = getPersistedStoreInfo();
    const originId = (stored?.companyId && stored.items.length > 0) ? stored.companyId : companyId;
    savePersistedCart(originId, cart);
  }, [cart]);

  const addToCart = (
    product: Product,
    selectedCondiments: Condiment[] = [],
    tamanhoSelecionado?: SelectedSize,
    saboresSelecionados?: SelectedFlavor[],
    requestedQty: number = 1
  ): { message?: string; usedRegularPrice?: boolean; clearedFromOtherStore?: boolean } => {
    try {
      const stored = getPersistedStoreInfo();
      const fromOtherStore = stored && stored.companyId !== companyId && stored.items.length > 0;

      if (fromOtherStore) {
        logger.info("useTotem", `Carrinho de outra loja (${stored!.companyId}) será limpo ao adicionar item da loja atual.`);
      }

      const existingSchedulingMode = (() => {
        for (const item of cart) {
          const cat = categories.find((c) => c.id === item.categoryId);
          if (cat?.schedulingMode === "required") return "required";
          if (cat?.schedulingMode === "optional") return "optional";
        }
        return "none";
      })();

      const newItemCategory = categories.find((c) => c.id === product.categoryId);
      const newItemMode = newItemCategory?.schedulingMode || "none";

      if (cart.length > 0 && (
        (existingSchedulingMode === "required" && newItemMode === "none") ||
        (newItemMode === "required" && existingSchedulingMode === "none")
      )) {
        logger.info("useTotem", "Item não pode ser adicionado: conflito de agendamento");
        return { message: "Este produto não pode ser comprado junto com itens que exigem agendamento." };
      }

      const promo = getProductPromotion(product.id);
      let promoQty = 0;
      let regularQty = requestedQty;
      let message = "";

      if (promo) {
        const availableStock = promo.stockLimit != null ? promo.stockLimit - (promo.soldUnits || 0) : Infinity;
        const maxPerOrder = promo.maxPerOrder ?? Infinity;
        const allowedPromo = Math.min(availableStock, maxPerOrder);

        if (allowedPromo <= 0) {
          message = `Estoque promocional esgotado. Adicionado ao preço normal.`;
        } else if (requestedQty > allowedPromo) {
          promoQty = allowedPromo;
          regularQty = requestedQty - allowedPromo;
          message = `${allowedPromo} unidade(s) no valor promocional e ${regularQty} ao preço normal.`;
        } else {
          promoQty = requestedQty;
          regularQty = 0;
        }
      } else {
        promoQty = 0;
        regularQty = requestedQty;
      }

      const condimentsKey = selectedCondiments.map(c => c.id).sort().join(',');
      const flavorsKey = (saboresSelecionados || []).map(f => f.id).sort().join(',');
      const sizeKey = tamanhoSelecionado?.id || '';

      const promoItemId = `${product.id}-${sizeKey}-${flavorsKey}-${condimentsKey}`;
      const promoPrice = promo ? getPromotionalPrice(product.id, product.price) : product.price;

      let adjustedSize: SelectedSize | undefined;
      if (tamanhoSelecionado && promo && promoQty > 0) {
        adjustedSize = { ...tamanhoSelecionado, preco: getPromotionalPrice(product.id, tamanhoSelecionado.preco) };
      } else {
        adjustedSize = tamanhoSelecionado;
      }

      if (fromOtherStore) {
        savePersistedCart(companyId, []);
      }

      setCart(prev => {
        let updated = fromOtherStore ? [] : [...prev];

        if (promoQty > 0) {
          const existingPromo = updated.find(item => item.id === promoItemId);
          if (existingPromo) {
            updated = updated.map(item =>
              item.id === promoItemId ? { ...item, quantity: item.quantity + promoQty } : item
            );
          } else {
            updated.push({
              ...product,
              id: promoItemId,
              productId: product.id,
              price: promoPrice,
              quantity: promoQty,
              condiments: selectedCondiments,
              tamanhoSelecionado: adjustedSize,
              saboresSelecionados,
            } as CartItem);
          }
        }

        if (regularQty > 0) {
          const regularItemId = `${promoItemId}-regular-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          updated.push({
            ...product,
            id: regularItemId,
            productId: product.id,
            price: product.price,
            quantity: regularQty,
            condiments: selectedCondiments,
            tamanhoSelecionado,
            saboresSelecionados,
          } as CartItem);
        }

        return updated;
      });

      const addMessage = fromOtherStore ? "Itens de outra loja removidos do carrinho." : (message || undefined);
      return { message: addMessage, usedRegularPrice: regularQty > 0 || undefined, clearedFromOtherStore: fromOtherStore || undefined };
    } catch (error) {
      logger.error("useTotem", "Erro ao adicionar ao carrinho", error);
      return { message: "Erro ao adicionar ao carrinho." };
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    savePersistedCart(companyId, []);
  };

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
    isScheduled?: boolean;
    scheduledDate?: string;
    scheduledTime?: string;
    requiresCustomerContact?: boolean;
    couponId?: string;
    couponCode?: string;
    discountValue?: number;
  }

  const [isFinishing, setIsFinishing] = useState(false);

  const finishOrder = async (identification: OrderIdentification): Promise<{ orderId?: string; error?: string }> => {
    if (cart.length === 0 || !companyId || isFinishing) return { error: "Carrinho vazio." };
    if (companyOpen === false) {
      return { error: "Loja fechada. Não é possível realizar pedidos no momento." };
    }

    setIsFinishing(true);

    try {
      const orderItems: any[] = [];
      let itemsTotal = 0;

      for (const item of cart) {
        const isRegularItem = item.id.includes('-regular-');
        const basePrice = item.tamanhoSelecionado ? item.tamanhoSelecionado.preco : item.price;
        const condimentsTotal = item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0;
        const flavorsTotal = item.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0;
        const unitTotal = basePrice + flavorsTotal + condimentsTotal;

        const promo = getProductPromotion(item.productId || item.id);

        if (promo && !isRegularItem && promo.stockLimit != null) {
          const availableStock = promo.stockLimit - (promo.soldUnits || 0);
          const promoQty = Math.min(item.quantity, Math.max(0, availableStock));
          const regularQty = item.quantity - promoQty;

          if (promoQty > 0) {
            const promoPrice = getPromotionalPrice(item.productId || item.id, item.price);
            const promoUnitTotal = promoPrice + flavorsTotal + condimentsTotal;
            orderItems.push({
              productId: item.productId || item.id,
              name: item.name,
              price: promoPrice,
              quantity: promoQty,
              observation: item.observation || "",
              condiments: item.condiments || [],
              tamanhoSelecionado: item.tamanhoSelecionado || null,
              saboresSelecionados: item.saboresSelecionados || null,
            });
            itemsTotal += promoUnitTotal * promoQty;
          }

          if (regularQty > 0) {
            orderItems.push({
              productId: item.productId || item.id,
              name: item.name,
              price: item.price,
              quantity: regularQty,
              observation: item.observation || "",
              condiments: item.condiments || [],
              tamanhoSelecionado: item.tamanhoSelecionado || null,
              saboresSelecionados: item.saboresSelecionados || null,
            });
            itemsTotal += unitTotal * regularQty;
          }
        } else {
          orderItems.push({
            productId: item.productId || item.id,
            name: item.name,
            price: basePrice,
            quantity: item.quantity,
            observation: item.observation || "",
            condiments: item.condiments || [],
            tamanhoSelecionado: item.tamanhoSelecionado || null,
            saboresSelecionados: item.saboresSelecionados || null,
          });
          itemsTotal += unitTotal * item.quantity;
        }
      }

      const deliveryFee = identification.deliveryFee || 0;
      const total = itemsTotal + deliveryFee;

      const stored = getPersistedStoreInfo();
      const orderCompanyId = (stored && stored.companyId) || companyId;

      const orderData: Record<string, unknown> = {
        companyId: orderCompanyId,
        customerName: user?.name || "Cliente",
        userName: user?.name || "Cliente",
        customerId: user?.uid || null,
        tableNumber: "",
        address: identification.address || null,
        deliveryFee,
        paymentMethod: identification.paymentMethod || "PIX",
        paymentStatus: identification.paymentStatus || "WAITING_PAYMENT",
        items: orderItems,
        total,
        status: 'pending',
        source: 'totem',
        createdAt: serverTimestamp(),
      };

      if (identification.isScheduled) {
        orderData.isScheduled = true;
        orderData.scheduledDate = identification.scheduledDate;
        orderData.scheduledTime = identification.scheduledTime;
        orderData.scheduledAt = new Date(`${identification.scheduledDate}T${identification.scheduledTime}`);
      }

      if (identification.requiresCustomerContact) {
        orderData.requiresCustomerContact = true;
      }

      if (identification.couponId) {
        orderData.couponId = identification.couponId;
        orderData.couponCode = identification.couponCode;
        orderData.discountValue = identification.discountValue;
        orderData.total = orderData.total as number - (identification.discountValue || 0);
      }

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      logger.info("useTotem", `Pedido finalizado: ${docRef.id}`);

      // Increment sold units for promoted products
      try {
        for (const item of cart) {
          const promo = getProductPromotion(item.productId || item.id);
          if (!promo) continue;
          const isRegularItem = item.id.includes('-regular-');
          if (isRegularItem) continue;
          if (promo.stockLimit != null) {
            const availableStock = promo.stockLimit - (promo.soldUnits || 0);
            const promoQty = Math.min(item.quantity, Math.max(0, availableStock));
            if (promoQty > 0) await incrementSoldUnits(promo.id, promoQty);
          } else {
            await incrementSoldUnits(promo.id, item.quantity);
          }
        }
      } catch (err) {
        logger.error("useTotem", "Erro ao atualizar unidades vendidas", err);
      }

      return { orderId: docRef.id };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("useTotem", `Erro ao finalizar pedido: ${errMsg}`, error);
      return { error: "Erro ao processar pedido. Tente novamente." };
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

  const getProductPromotion = (productId: string): Promotion | undefined => {
    const promo = promotions.find((p) => p.productId === productId);
    if (!promo) return undefined;
    if (promo.stockLimit != null && (promo.soldUnits || 0) >= promo.stockLimit) return undefined;
    return promo;
  };

  const getPromotionalPrice = (productId: string, basePrice: number): number => {
    const promo = getProductPromotion(productId);
    if (!promo) return basePrice;
    if (promo.promotionType === "fixed_price") return promo.promotionalPrice;
    if (promo.promotionType === "percentage_discount") return basePrice - (basePrice * promo.percentageOff / 100);
    if (promo.promotionType === "amount_discount") return Math.max(0, basePrice - promo.promotionalPrice);
    return basePrice;
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
    promotions,
    getProductPromotion,
    getPromotionalPrice,
  };
};
