"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Product, Category, CartItem, Condiment, CategoryFlavor, SelectedSize, SelectedFlavor, ProductSize, Promotion } from "@totem/shared/types";
import { ShoppingBag, Trash2, Plus, Minus, X, ArrowLeft, Store, Star, Bell, Tag, MapPin } from "lucide-react";
import { firestore } from "@/src/services/firebase";
import { collection, query, where, onSnapshot, getDocs, orderBy } from "firebase/firestore";
import StoreReviewsModal from "../StoreReviewsModal";

interface OrderingScreenProps {
  companyId: string;
  companyName: string;
  companyBanner: string;
  companyLogo: string;
  companyOpen: boolean | null;
  averageRating: number;
  reviewCount: number;
  tempoPreparoMin: number;
  tempoPreparoMax: number;
  products: Product[];
  categories: Category[];
  condiments: Condiment[];
  flavors: CategoryFlavor[];
  cart: CartItem[];
  actions: {
    addToCart: (product: Product, selectedCondiments?: Condiment[], tamanhoSelecionado?: SelectedSize, saboresSelecionados?: SelectedFlavor[], quantity?: number, selectedRequiredItems?: { groupName: string; items: { name: string; additionalPrice: number }[] }[]) => { message?: string; usedRegularPrice?: boolean } | undefined;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    updateItemObservation: (id: string, obs: string) => void;
    clearCart: () => void;
  };
  onFinish: () => void;
  onCancel: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenOrders: () => void;
  promotions?: Promotion[];
  getProductPromotion?: (productId: string) => Promotion | undefined;
  getPromotionalPrice?: (productId: string, basePrice: number) => number;
  initialProductId?: string;
  initialSize?: string;
  initialCondiments?: string[];
  initialFlavors?: string[];
  initialQuantity?: number;
  initialRequiredSelections?: Record<string, string[]>;
  isFavorite?: (productId: string) => boolean;
  onToggleFavorite?: (productId: string, config: { size?: string; condiments: string[]; flavors: string[]; quantity: number; requiredSelections: Record<string, string[]> }) => void;
}

const BANNER_HEIGHT = 168;

export default function OrderingScreen({ 
  companyId,
  companyName,
  companyBanner,
  companyLogo,
  companyOpen,
  averageRating,
  reviewCount,
  tempoPreparoMin,
  tempoPreparoMax,
  products = [], 
  categories = [], 
  condiments = [],
  flavors = [],
  cart = [], 
  actions, 
  onFinish, 
  onCancel,
  unreadCount = 0,
  onOpenNotifications,
  onOpenOrders,
  promotions = [],
  getProductPromotion,
  getPromotionalPrice,
  initialProductId,
  initialSize,
  initialCondiments,
  initialFlavors,
  initialQuantity,
  initialRequiredSelections,
  isFavorite,
  onToggleFavorite,
}: OrderingScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [detailScrollY, setDetailScrollY] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const userClosedRef = useRef(false);
  const [selectedCondiments, setSelectedCondiments] = useState<Condiment[]>([]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<CategoryFlavor[]>([]);
  const [requiredSelections, setRequiredSelections] = useState<Record<string, Set<string>>>({});
  const [quantity, setQuantity] = useState(1);
  const [isStoreReviewsOpen, setIsStoreReviewsOpen] = useState(false);
  const [deliveryCosts, setDeliveryCosts] = useState<any[]>([]);
  const [requiredGroups, setRequiredGroups] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "info" } | null>(null);

  useEffect(() => {
    if (!selectedProduct?.id) { setRequiredGroups([]); return; }
    const unsub = onSnapshot(
      query(collection(firestore, "requiredGroups"), where("productId", "==", selectedProduct.id)),
      async (snap) => {
        const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const withItems = await Promise.all(groups.map(async (g: any) => {
          const itemsSnap = await getDocs(
            query(collection(firestore, "requiredItems"), where("groupId", "==", g.id), orderBy("order"))
          );
          return { ...g, items: itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.order - b.order) };
        }));
        setRequiredGroups(withItems.sort((a: any, b: any) => a.order - b.order));
      },
      () => setRequiredGroups([])
    );
    return () => unsub();
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (!initialProductId || products.length === 0 || selectedProduct || userClosedRef.current) return;
    userClosedRef.current = false;
    const found = products.find(p => p.id === initialProductId);
    if (!found) return;
    setSelectedProduct(found);
    setActiveCategory(found.categoryId || "featured");
  }, [initialProductId, products, selectedProduct]);

  useEffect(() => {
    if (!selectedProduct || selectedProduct.id !== initialProductId || userClosedRef.current) return;
    if (initialSize) {
      const sizes = selectedProduct.sizes || [];
      const size = sizes.find(s => s.nome === initialSize);
      if (size) setSelectedSize(size);
    }
    if (initialCondiments && initialCondiments.length > 0) {
      const found = condiments.filter(c => initialCondiments.includes(c.id));
      if (found.length > 0) setSelectedCondiments(found);
    }
    if (initialFlavors && initialFlavors.length > 0) {
      const found = flavors.filter(f => initialFlavors.includes(f.id));
      if (found.length > 0) setSelectedFlavors(found);
    }
    if (initialQuantity && initialQuantity > 1) setQuantity(initialQuantity);
    if (initialRequiredSelections && Object.keys(initialRequiredSelections).length > 0) {
      const mapped: Record<string, Set<string>> = {};
      for (const [key, items] of Object.entries(initialRequiredSelections)) {
        mapped[key] = new Set(items);
      }
      setRequiredSelections(mapped);
    }
  }, [selectedProduct, initialProductId, initialSize, initialCondiments, initialFlavors, initialQuantity, initialRequiredSelections, condiments, flavors]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(firestore, "deliveryCosts"), where("companyId", "==", companyId));
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      setDeliveryCosts(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("🔥 Erro ao carregar custos de entrega:", error);
    });
    return () => unsubscribe();
  }, [companyId]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const top = scrollRef.current.scrollTop;
      setScrollY(top);

      // Detecta qual categoria está visível
      const scrollContainer = scrollRef.current;
      let currentCat = "all";
      for (const [catId, el] of Object.entries(categoryRefs.current)) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        if (rect.top - containerRect.top < 200) {
          currentCat = catId;
        }
      }
      setActiveCategory(currentCat);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const parallaxOffset = Math.min(scrollY * 0.4, 56);
  const bannerOpacity = Math.max(1 - scrollY / BANNER_HEIGHT, 0.3);

  const productCategory = selectedProduct 
    ? categories.find(c => c.id === selectedProduct.categoryId) 
    : null;

  const productSizes: ProductSize[] = selectedProduct
    ? selectedProduct.sizes || []
    : [];

  const productFlavors = selectedProduct
    ? flavors.filter(f => f.categoryId === selectedProduct.categoryId)
    : [];

  const maxFlavors = selectedSize?.quantidadeSabores || 0;

  const productCondiments = selectedProduct 
    ? condiments.filter(c => c.categoryIds?.includes(selectedProduct.categoryId)) 
    : [];

  const toggleCondiment = (condiment: Condiment) => {
    setSelectedCondiments(prev => 
      prev.find(c => c.id === condiment.id)
        ? prev.filter(c => c.id !== condiment.id)
        : [...prev, condiment]
    );
  };

  const toggleFlavor = (flavor: CategoryFlavor) => {
    setSelectedFlavors(prev => {
      const exists = prev.find(f => f.id === flavor.id);
      if (exists) return prev.filter(f => f.id !== flavor.id);
      if (maxFlavors > 0 && prev.length >= maxFlavors) return prev;
      return [...prev, flavor];
    });
  };

  const today = new Date().getDay();

  const getDayDiscount = (product: Product): number | null => {
    if (!product.dayPromotions || product.dayPromotions.length === 0) return null;
    const match = product.dayPromotions.find(p => p.dayOfWeek === today);
    return match ? match.discountPercent : null;
  };

  const getPrice = (product: Product, sizePrice?: number) => {
    const base = sizePrice ?? product.price;
    if (getProductPromotion) {
      const promo = getProductPromotion(product.id);
      if (promo && getPromotionalPrice) return getPromotionalPrice(product.id, base);
    }
    const dayDisc = getDayDiscount(product);
    if (dayDisc) return base - (base * dayDisc / 100);
    return base;
  };

  const hasPromotion = (productId: string, product?: Product) => {
    if (getProductPromotion && getProductPromotion(productId) != null) return true;
    if (product && getDayDiscount(product)) return true;
    return false;
  };

  const getPromoStock = (productId: string) => {
    const promo = getProductPromotion?.(productId);
    if (!promo || promo.stockLimit == null) return null;
    return { sold: promo.soldUnits || 0, limit: promo.stockLimit };
  };

  const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  const hasDayPromotionToday = products.some(p => getDayDiscount(p) !== null);
  const dayPromoLabel = weekDays[today];

  const effectivePrice = selectedProduct
    ? selectedSize
      ? getPrice(selectedProduct, selectedSize.preco)
      : getPrice(selectedProduct)
    : 0;

  const requiredGroupsTotal = (selectedProduct ? requiredGroups.filter((g: any) => g.active !== false).reduce((sum, group: any) => {
    const groupKey = group.id || group.name;
    const selections = requiredSelections[groupKey] || new Set<string>();
    const items = (group.items || []).filter((i: any) => i.available !== false);
    const selectedItems = items.filter((i: any) => selections.has(i.id));
    return sum + selectedItems.reduce((s: number, i: any) => s + (Number(i.additionalPrice) || 0), 0);
  }, 0) : 0);

  const requiredGroupsValid = !selectedProduct || requiredGroups.filter((g: any) => g.active !== false).every((group: any) => {
    const items = (group.items || []).filter((i: any) => i.available !== false);
    if (items.length === 0) return true;
    const sizeOverride = selectedSize && group.sizeOverrides
      ? group.sizeOverrides.find((o: any) => o.sizeName === selectedSize.nome)
      : null;
    const minQty = sizeOverride?.minQuantity ?? group.minQuantity ?? 0;
    const maxQty = sizeOverride?.maxQuantity ?? group.maxQuantity ?? items.length;
    const groupKey = group.id || group.name;
    const count = (requiredSelections[groupKey] || new Set<string>()).size;
    if (group.rule === 'EXACTLY') return count === maxQty;
    if (group.rule === 'MIN') return count >= minQty;
    if (group.rule === 'MAX') return count <= maxQty;
    if (group.rule === 'BETWEEN') return count >= minQty && count <= maxQty;
    return true;
  });

  const productTotal = selectedProduct 
    ? (effectivePrice + selectedFlavors.reduce((sum, f) => sum + (f.preco || 0), 0) + selectedCondiments.reduce((sum, c) => sum + c.price, 0) + requiredGroupsTotal) * quantity
    : 0;

  // Produtos agrupados por categoria para exibição em lista contínua
  const sortedCategories = useMemo(() => {
    return categories
      .filter((c) => products.some((p) => p.categoryId === c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, products]);

  const featuredProducts = useMemo(() => {
    return products.filter(p => p.featured || hasPromotion(p.id, p));
  }, [products]);

  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const cat of sortedCategories) {
      map[cat.id] = products.filter(p => p.categoryId === cat.id);
    }
    return map;
  }, [products, sortedCategories]);

  const requiredItemsPrice = (item: any) =>
    item.selectedRequiredItems?.reduce((s: number, rg: any) => s + rg.items.reduce((ss: number, i: any) => ss + (Number(i.additionalPrice) || 0), 0), 0) || 0;

  const cartTotal = cart.reduce((acc, i) => {
    const basePrice = i.tamanhoSelecionado ? i.tamanhoSelecionado.preco : i.price;
    const condimentsPrice = i.condiments?.reduce((sum, c) => sum + c.price, 0) || 0;
    const flavorsPrice = i.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0;
    return acc + ((basePrice + flavorsPrice + condimentsPrice + requiredItemsPrice(i)) * i.quantity);
  }, 0);
  const cartItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const hasRegularItems = cart.some(item => item.id.includes('-regular-'));

  const isClosed = companyOpen === false;

  const renderProduct = (product: Product) => {
    const promo = getProductPromotion?.(product.id);
    const dayDiscount = getDayDiscount(product);
    const hasAnyPromo = promo !== undefined || dayDiscount !== null;
    const displayPrice = getPrice(product);
    const promoStock = getPromoStock(product.id);
    return (
      <div
        key={product.id}
        className="bg-white rounded-[16px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-200/60 p-3 lg:p-5 flex flex-row items-center cursor-pointer transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
        onClick={() => { setSelectedProduct(product); setDetailScrollY(0); }}
      >
        <div className="relative w-[30%] lg:w-[25%] aspect-[4/3] shrink-0 rounded-xl overflow-hidden">
          <img
            src={product.imageUrl || "https://placehold.co/400x400?text=Sem+Imagem"}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          {hasAnyPromo && (
            <div className="absolute top-1 left-1 bg-[#FF6B00] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
              PROMOÇÃO
            </div>
          )}
        </div>
        <div className="flex-1 ml-3 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-gray-900 mb-0.5">{product.name}</h3>
            {promoStock && promoStock.limit - promoStock.sold <= 5 && (
              <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                ÚLTIMAS UNIDADES
              </span>
            )}
          </div>
          <p className="text-[13px] text-gray-500 mb-1 line-clamp-2">{product.description}</p>
          {hasAnyPromo ? (
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-brand-primary">
                R$ {displayPrice.toFixed(2)}
              </span>
              <span className="text-[12px] text-gray-400 line-through">
                R$ {product.price.toFixed(2)}
              </span>
              {promo?.promotionType === "percentage_discount" && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  {promo.percentageOff}% OFF
                </span>
              )}
              {dayDiscount && !promo && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  {dayDiscount}% OFF
                </span>
              )}
            </div>
          ) : (
            <span className="text-[20px] font-bold text-brand-primary">
              R$ {product.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-brand-light overflow-hidden text-brand-dark font-sans select-none">
      <div className="flex-1 flex flex-col h-full overflow-x-hidden relative">
        <header className="sticky top-0 bg-white z-10 border-b border-[#EAEAEA]">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 max-w-full">
            <div className="flex items-center gap-2 shrink-0">
              <img src="/Logo.png" alt="Bora" className="h-[42px] w-auto" />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onOpenNotifications}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#666] hover:bg-gray-100 transition-colors relative"
                title="Notificações"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 shadow-md">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={onOpenOrders}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#666] hover:bg-gray-100 transition-colors"
                title="Pedidos"
              >
                <ShoppingBag className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {isClosed && (
          <div className="sticky top-0 z-20 bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-3 text-sm font-semibold text-red-700">
            <Store size={16} />
            Loja fechada · Visualização do cardápio apenas
          </div>
        )}

        <main ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50">
          {/* Hero Banner - full width */}
          <div
            className="relative w-full overflow-hidden"
            style={{ height: BANNER_HEIGHT }}
          >
            {/* Back button overlay */}
            <button
              onClick={onCancel}
              className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Parallax background layer */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translateY(${parallaxOffset}px)`,
                opacity: bannerOpacity,
              }}
            >
              {companyBanner ? (
                <>
                  <img
                    src={companyBanner}
                    alt=""
                    className="w-full h-[calc(100%+80px)] object-cover"
                    style={{ objectPosition: "center 30%", filter: isClosed ? 'grayscale(1)' : 'none' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-brand-primary to-brand-primaryHover" style={{ filter: isClosed ? 'grayscale(1)' : 'none' }} />
              )}
            </div>

            {/* Text content */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-6 text-white">
              <h2 className="text-2xl font-black mb-2 drop-shadow-lg">
                {companyName || (categories.length > 0 ? "Bem-vindo ao Bora" : "Cardápio")}
              </h2>
              <div className="flex items-center gap-4 text-sm font-medium opacity-90 drop-shadow">
                <button
                onClick={() => setIsStoreReviewsOpen(true)}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                title="Ver avaliações"
              >
                <Star className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                <span>{averageRating > 0 ? averageRating.toFixed(1) : '--'}</span>
                {reviewCount > 0 && <span className="text-[10px] opacity-70">({reviewCount})</span>}
              </button>
                <div className="flex items-center gap-1">🕒 {tempoPreparoMin}-{tempoPreparoMax} min</div>
                <div className="flex items-center gap-1">
                  🚚 {deliveryCosts.length > 0
                    ? `Entrega R$ ${Math.min(...deliveryCosts.map(d => d.deliveryPrice)).toFixed(2)}`
                    : "Entrega rápida"}
                </div>
              </div>
            </div>
          </div>

          {/* Day Promotion Event Card */}
          {hasDayPromotionToday && (
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 mx-4 mt-4 rounded-2xl shadow-lg flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Tag size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-black text-lg leading-tight">{dayPromoLabel}</p>
                <p className="text-orange-100 text-xs font-medium">Descontos especiais hoje!</p>
              </div>
              <button
                onClick={() => setActiveCategory("featured")}
                className="bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-orange-50 transition-colors"
              >
                Ver ofertas
              </button>
            </div>
          )}

          {/* Categories - sticky, scrolls to section */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200/60 p-4 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setActiveCategory("all");
                scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                activeCategory === "all"
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Início
            </button>
            {featuredProducts.length > 0 && (
              <button
                onClick={() => {
                  setActiveCategory("featured");
                  const el = categoryRefs.current["featured"];
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                  activeCategory === "featured"
                    ? "bg-brand-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ⭐ Destaques
              </button>
            )}
            {sortedCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const el = categoryRefs.current[cat.id];
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                  activeCategory === cat.id
                    ? "bg-brand-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products list - grouped by category */}
          <div className="p-4 space-y-4 lg:max-w-4xl lg:mx-auto lg:p-6 lg:space-y-5 pb-24">
            {/* Destaques */}
            {featuredProducts.length > 0 && (
              <div ref={(el) => { categoryRefs.current["featured"] = el; }} className="scroll-mt-16">
                <h2 className="text-lg font-black text-gray-900 mb-3">⭐ Destaques</h2>
                {featuredProducts.map(product => renderProduct(product))}
              </div>
            )}

            {/* Categorias */}
            {sortedCategories.map(cat => {
              const catProducts = productsByCategory[cat.id];
              if (!catProducts?.length) return null;
              return (
                <div key={cat.id} ref={(el) => { categoryRefs.current[cat.id] = el; }} className="scroll-mt-16">
                  <h2 className="text-lg font-black text-gray-900 mb-3">{cat.name}</h2>
                  {catProducts.map(product => renderProduct(product))}
                </div>
              );
            })}
          </div>
        </main>

        {cart.length > 0 && (
          <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40">
            <button
              type="button"
              className="w-full h-[60px] bg-brand-primary text-white rounded-[18px] shadow-[0_15px_40px_rgba(220,38,38,0.3)] flex items-center justify-between px-6 font-bold text-lg"
              onClick={() => setIsMobileCartOpen(true)}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag /> Ver Pedido
              </div>
              <div>{cartItemsCount} itens • R$ {cartTotal.toFixed(2)}</div>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Cart Sidebar */}
      <aside className="hidden lg:flex flex-col w-[28rem] bg-brand-surface border-l border-brand-border/40 p-6 shrink-0 h-full overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 border-b border-brand-border/40 pb-4 shrink-0">
          <ShoppingBag className="h-5 w-5 text-brand-primary" />
          <h2 className="text-lg font-bold text-brand-dark">Seu Pedido</h2>
          <span className="ml-auto bg-brand-light text-brand-dark font-bold text-xs px-2.5 py-1 rounded-[8px]">
            {cartItemsCount} {cartItemsCount === 1 ? "item" : "itens"}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-brand-muted p-6">
            <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-bold text-sm">Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              {cart.map(item => (
                <div key={item.id} className="bg-brand-surface rounded-[8px] p-3 border border-brand-border/40 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-brand-dark text-sm leading-tight">{item.name}</span>
                      {item.tamanhoSelecionado && (
                        <p className="text-xs text-brand-muted mt-0.5">{item.tamanhoSelecionado.nome}</p>
                      )}
                      {item.saboresSelecionados && item.saboresSelecionados.length > 0 && (
                        <p className="text-xs text-brand-muted">
                          {item.saboresSelecionados.map(f => f.nome).join(', ')}
                        </p>
                      )}
                      {item.condiments && item.condiments.length > 0 && (
                        <p className="text-xs text-brand-muted">
                          +{item.condiments.map(c => c.name).join(', ')}
                        </p>
                      )}
                      {item.selectedRequiredItems?.map((rg: any) => (
                        <p key={rg.groupName} className="text-xs text-brand-muted">
                          {rg.items.map((i: any) => i.name).join(', ')}
                        </p>
                      ))}
                    </div>
                    <button
                      className="text-brand-muted hover:text-brand-primary transition-colors p-1"
                      onClick={() => actions.removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {(() => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    return cat?.requiresCustomerContact && cat.schedulingMode !== "none" ? (
                      <p className="text-[10px] text-purple-600 font-bold mt-1">🔄 Requer alinhamento com a loja</p>
                    ) : null;
                  })()}
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2 bg-brand-light rounded-[6px] p-1 border border-brand-border/40">
                      <button
                        onClick={() => actions.updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className="w-6 h-6 bg-brand-surface border border-brand-border/40 rounded-[4px] flex items-center justify-center active:bg-brand-light disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => actions.updateQuantity(item.id, 1)}
                        className="w-6 h-6 bg-brand-surface border border-brand-border/40 rounded-[4px] flex items-center justify-center active:bg-brand-light"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                      <span className="font-bold text-brand-primary text-xs">
                        R$ {((
                          (item.tamanhoSelecionado ? item.tamanhoSelecionado.preco : item.price) +
                          (item.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0) +
                          (item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0) +
                          requiredItemsPrice(item)
                        ) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Observação (ex: sem alface)"
                    value={item.observation || ""}
                    onChange={(e) => actions.updateItemObservation(item.id, e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-brand-light border border-brand-border/40 rounded-[6px] text-xs font-medium text-brand-dark outline-none focus:border-brand-primary transition-colors placeholder:text-brand-muted/60"
                    maxLength={100}
                  />
                </div>
              ))}
            </div>
            {hasRegularItems && (
              <div className="flex items-start gap-2 px-1 py-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg mx-1">
                <span className="text-amber-500 font-bold text-sm leading-none mt-0.5">(!)</span>
                <span>Alguns itens estão fora da promoção e foram adicionados ao preço normal.</span>
              </div>
            )}
            <div className="border-t border-brand-border/40 pt-4 mt-auto space-y-4 shrink-0">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase text-brand-muted">Total</span>
                <span className="text-2xl font-bold text-brand-dark">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button
                className={`w-full py-4 rounded-[12px] font-bold text-base transition-all ${isClosed ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-primaryHover text-white'}`}
                onClick={isClosed ? undefined : onFinish}
                disabled={isClosed}
                title={isClosed ? "Loja fechada" : ""}
              >
                {isClosed ? "LOJA FECHADA" : "FINALIZAR PEDIDO"}
              </button>
            </div>
          </>
        )}
      </aside>

      <StoreReviewsModal
        companyId={companyId}
        isOpen={isStoreReviewsOpen}
        onClose={() => setIsStoreReviewsOpen(false)}
      />

      {/* Mobile Cart Sheet */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" onClick={() => setIsMobileCartOpen(false)} />
          <div className="relative bg-brand-surface w-full rounded-t-[24px] p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col">
            <div className="w-12 h-1 bg-brand-border rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between pb-4 mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-primary" />
                <h3 className="font-bold text-lg">Meu Pedido</h3>
              </div>
              <button className="text-brand-muted hover:text-brand-dark p-1" onClick={() => setIsMobileCartOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
                  <div className="flex-1 overflow-y-auto space-y-4 py-2">
              {cart.map(item => (
                <div key={item.id} className="bg-brand-light rounded-[12px] p-4 border border-brand-border/40 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-brand-dark text-sm leading-tight">{item.name}</span>
                        {item.id.includes('-regular-') && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">Preço normal</span>
                        )}
                      </div>
                      {item.tamanhoSelecionado && (
                        <p className="text-xs text-brand-muted mt-0.5">{item.tamanhoSelecionado.nome}</p>
                      )}
                      {item.saboresSelecionados && item.saboresSelecionados.length > 0 && (
                        <p className="text-xs text-brand-muted">
                          {item.saboresSelecionados.map(f => f.nome).join(', ')}
                        </p>
                      )}
                      {item.condiments && item.condiments.length > 0 && (
                        <p className="text-xs text-brand-muted">
                          +{item.condiments.map(c => c.name).join(', ')}
                        </p>
                      )}
                      {item.selectedRequiredItems?.map((rg: any) => (
                        <p key={rg.groupName} className="text-xs text-brand-muted">
                          {rg.items.map((i: any) => i.name).join(', ')}
                        </p>
                      ))}
                    </div>
                    <button
                      className="text-brand-muted hover:text-brand-primary transition-colors p-1"
                      onClick={() => actions.removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {(() => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    return cat?.requiresCustomerContact && cat.schedulingMode !== "none" ? (
                      <p className="text-[10px] text-purple-600 font-bold mt-1">🔄 Requer alinhamento com a loja</p>
                    ) : null;
                  })()}
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2 bg-brand-surface rounded-[8px] p-1 border border-brand-border/40">
                      <button
                        onClick={() => actions.updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 bg-brand-light border border-brand-border/40 rounded-[6px] flex items-center justify-center active:bg-brand-surface disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => actions.updateQuantity(item.id, 1)}
                        className="w-7 h-7 bg-brand-light border border-brand-border/40 rounded-[6px] flex items-center justify-center active:bg-brand-surface"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-bold text-brand-primary text-sm">
                      R$ {((
                        (item.tamanhoSelecionado ? item.tamanhoSelecionado.preco : item.price) +
                        (item.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0) +
                        (item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0) +
                        requiredItemsPrice(item)
                      ) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Observação (ex: sem alface)"
                    value={item.observation || ""}
                    onChange={(e) => actions.updateItemObservation(item.id, e.target.value)}
                    className="w-full px-3 py-2.5 bg-brand-surface border border-brand-border/40 rounded-[8px] text-xs font-medium text-brand-dark outline-none focus:border-brand-primary transition-colors placeholder:text-brand-muted/60"
                    maxLength={100}
                  />
                </div>
              ))}
            </div>
            {hasRegularItems && (
              <div className="flex items-start gap-2 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg mx-0">
                <span className="text-amber-500 font-bold text-sm leading-none mt-0.5">(!)</span>
                <span>Alguns itens estão fora da promoção e foram adicionados ao preço normal.</span>
              </div>
            )}
            <div className="border-t border-brand-border/40 pt-6 mt-auto space-y-4 shrink-0">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase text-brand-muted">Total</span>
                <span className="text-xl font-bold text-brand-dark">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button
                className={`w-full py-4 rounded-[12px] font-bold text-base transition-all ${isClosed ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-primaryHover text-white'}`}
                onClick={isClosed ? undefined : () => { setIsMobileCartOpen(false); onFinish(); }}
                disabled={isClosed}
                title={isClosed ? "Loja fechada" : ""}
              >
                {isClosed ? "LOJA FECHADA" : "FINALIZAR PEDIDO"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full h-full md:w-[85vw] md:h-auto md:max-h-[95vh] md:min-h-[75vh] mx-auto flex flex-col md:flex-row overflow-hidden bg-white md:rounded-2xl md:shadow-2xl max-w-[100vw]">
            {/* Header fixo para mobile (Estilo aiqfome) */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 z-30 shrink-0 sticky top-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => {
                    userClosedRef.current = true;
                    setSelectedProduct(null);
                    setSelectedCondiments([]);
                    setSelectedSize(null);
                    setSelectedFlavors([]);
                    setQuantity(1);
                    if (initialProductId) window.history.replaceState({}, "", window.location.pathname);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6 text-brand-primary" />
                </button>
                <h3 className="font-extrabold text-[15px] text-gray-900 uppercase truncate">
                  {selectedProduct.name}
                </h3>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-brand-primary">
                <button
                  onClick={async () => {
                    const params = new URLSearchParams();
                    params.set("product", selectedProduct.id);
                    if (selectedSize) params.set("size", selectedSize.nome);
                    if (selectedCondiments.length > 0) params.set("cond", selectedCondiments.map(c => c.id).join(","));
                    if (selectedFlavors.length > 0) params.set("flav", selectedFlavors.map(f => f.id).join(","));
                    if (quantity > 1) params.set("qty", String(quantity));
                    if (Object.keys(requiredSelections).length > 0) {
                      const req = Object.entries(requiredSelections)
                        .map(([key, items]) => `${key}:${Array.from(items).join(",")}`)
                        .join("|");
                      params.set("req", req);
                    }
                    const shareUrl = `${window.location.origin}/totem/${companyId}?${params.toString()}`;
                    const shareData = {
                      title: selectedProduct.name,
                      text: `Olha só esse produto da ${companyName || "Bora"}: ${selectedProduct.name}${selectedProduct.description ? ` - ${selectedProduct.description}` : ""}`,
                      url: shareUrl,
                    };
                    if (navigator.share) {
                      try { await navigator.share(shareData); return; } catch {}
                    }
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setToast({ message: "Link copiado!" });
                    } catch {
                      setToast({ message: "Erro ao copiar link" });
                    }
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <button
                  onClick={() => {
                    if (!onToggleFavorite) return;
                    const config: any = {};
                    if (selectedSize) config.size = selectedSize.nome;
                    if (selectedCondiments.length > 0) config.condiments = selectedCondiments.map(c => c.id);
                    if (selectedFlavors.length > 0) config.flavors = selectedFlavors.map(f => f.id);
                    if (quantity > 1) config.quantity = quantity;
                    if (Object.keys(requiredSelections).length > 0) {
                      const req: Record<string, string[]> = {};
                      for (const [key, items] of Object.entries(requiredSelections)) {
                        req[key] = Array.from(items);
                      }
                      config.requiredSelections = req;
                    }
                    onToggleFavorite(selectedProduct.id, config);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isFavorite?.(selectedProduct.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
              </div>
            </div>

            <button
              className="absolute top-6 left-6 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors hidden md:block"
              onClick={() => {
                userClosedRef.current = true;
                setSelectedProduct(null);
                setSelectedCondiments([]);
                setSelectedSize(null);
                setSelectedFlavors([]);
                setQuantity(1);
                if (initialProductId) window.history.replaceState({}, "", window.location.pathname);
              }}
            >
              <ArrowLeft className="h-6 w-6 text-gray-900" />
            </button>
            <div
              className="w-full md:w-1/2 bg-gray-100 shrink-0 overflow-hidden relative transition-all duration-200 min-h-[280px] md:min-h-[320px] hidden md:block"
              style={{ height: Math.max(24, 40 - detailScrollY * 0.12) + "vh" }}
            >
              <div
                className="absolute inset-0 transition-transform duration-200"
                style={{ transform: `translateY(${Math.min(detailScrollY * 0.25, 25)}px)` }}
              >
                <img
                  src={selectedProduct.imageUrl || "https://placehold.co/600x600?text=Sem+Imagem"}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain object-center bg-gray-100"
                />
              </div>
              <div
                className="absolute inset-0 transition-opacity duration-200"
                style={{ opacity: Math.min(detailScrollY / 60, 1) }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              </div>
              {/* Product info overlay on image */}
              <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-3 md:p-6 text-white">
                <h2 className="font-bold leading-tight text-[1.1rem] md:text-2xl">
                  {selectedProduct.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {(() => {
                    const finalPrice = getPrice(selectedProduct);
                    const basePrice = selectedProduct.price;
                    return (
                      <>
                        <span className="font-bold text-[0.9rem] md:text-xl">
                          R$ {finalPrice.toFixed(2)}
                        </span>
                        {finalPrice !== basePrice && (
                          <span className="text-xs text-white/70 line-through">R$ {basePrice.toFixed(2)}</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 flex-1 min-h-0 flex flex-col p-4 md:px-16 md:py-12 bg-white">
              {(() => {
                const cat = categories.find(c => c.id === selectedProduct.categoryId);
                if (cat?.requiresCustomerContact && cat.schedulingMode !== "none") {
                  return (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 shrink-0">
                      <p className="text-xs font-bold text-purple-800">🔄 Requer alinhamento com a loja</p>
                      {cat.customerInstructions && (
                        <p className="text-[11px] text-purple-700 mt-1 whitespace-pre-wrap">{cat.customerInstructions}</p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
              <div
                className="flex-1 min-h-0 overflow-y-auto space-y-6"
                onScroll={(e) => setDetailScrollY(e.currentTarget.scrollTop)}
              >
                {/* Imagem para mobile (Estilo aiqfome) */}
                <div className="md:hidden w-full aspect-[4/3] relative overflow-hidden bg-gray-50 rounded-xl shrink-0 mb-3 shadow-sm">
                  <img
                    src={selectedProduct.imageUrl || "https://placehold.co/600x600?text=Sem+Imagem"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Detalhes do produto para mobile (Estilo aiqfome) */}
                <div className="md:hidden flex flex-col pb-4 border-b border-gray-100">
                  {/* Info da Loja */}
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setSelectedProduct(null)} className="flex items-center gap-1.5">
                      <img src={companyLogo || companyBanner || "/Logo.png"} alt={companyName} className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                      <span className="font-bold text-[14px] text-gray-800 flex items-center gap-0.5">
                        {companyName || "Carregando..."} <span className="text-gray-400 text-xs font-normal">›</span>
                      </span>
                    </button>
                    {isClosed ? (
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        loja fechada
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        loja aberta
                      </span>
                    )}
                  </div>

                  {/* Nome do Produto */}
                  <h2 className="text-[20px] font-black text-gray-950 leading-snug uppercase mb-1">
                    {selectedProduct.name}
                  </h2>

                  {/* Preço do Produto */}
                  <div className="text-brand-primary text-[19px] font-black mb-2">
                    R$ {effectivePrice.toFixed(2)}
                  </div>

                  {/* Descrição */}
                  <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Tamanhos */}
                {productSizes.length > 0 && (
                  <div className="space-y-1">
                    {/* Cabeçalho do Grupo Estilo aiqfome */}
                    <div className="flex items-center justify-between -mx-4 px-4 py-2.5 bg-[#F4F5F7] border-y border-gray-100/80 md:mx-0 md:rounded-lg md:px-3 md:py-2">
                      <div>
                        <h4 className="font-extrabold text-[14px] text-gray-800 lowercase">
                          escolha o tamanho
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium">
                          selecione 1
                        </p>
                      </div>
                      <span className="bg-brand-primary text-white text-[9px] font-extrabold px-2.5 py-1 rounded-[10px] uppercase tracking-wider shrink-0">
                        obrigatório
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {productSizes.map((size, idx) => {
                        const isSelected = selectedSize?.nome === size.nome;
                        const price = getPrice(selectedProduct!, size.preco);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedSize(size);
                              setSelectedFlavors([]);
                            }}
                            className="w-full flex items-center justify-between py-3.5 border-b border-gray-100 transition-all text-left hover:bg-gray-50/40 active:bg-gray-50/60"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? 'border-brand-primary bg-brand-primary' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="font-bold text-[13.5px] text-gray-700 uppercase min-w-0 truncate">
                                {size.nome}
                              </span>
                            </div>
                            <span className="font-bold text-[13.5px] text-gray-600 ml-4 flex-shrink-0 text-right">
                              {price > 0 ? `R$ ${price.toFixed(2)}` : "Grátis"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Obrigatórios do Produto */}
                {requiredGroups.filter((g: any) => g.active !== false).map((group: any) => {
                  const items = (group.items || []).filter((i: any) => i.available !== false);
                  if (items.length === 0) return null;

                  const sizeOverride = selectedSize && group.sizeOverrides
                    ? group.sizeOverrides.find((o: any) => o.sizeName === selectedSize.nome)
                    : null;
                  const minQty = sizeOverride?.minQuantity ?? group.minQuantity ?? 0;
                  const maxQty = sizeOverride?.maxQuantity ?? group.maxQuantity ?? items.length;
                  const groupKey = group.id || group.name;
                  const selections = requiredSelections[groupKey] || new Set<string>();

                  const toggleItem = (itemId: string) => {
                    setRequiredSelections(prev => {
                      const current = prev[groupKey] || new Set<string>();
                      const next = new Set(current);
                      if (next.has(itemId)) {
                        next.delete(itemId);
                      } else if (next.size < maxQty) {
                        next.add(itemId);
                      }
                      return { ...prev, [groupKey]: next };
                    });
                  };

                  const isSingleSelect = maxQty === 1;
                  const isRequired = minQty > 0;

                  return (
                    <div key={groupKey} className="space-y-1">
                      {/* Cabeçalho do Grupo Estilo aiqfome */}
                      <div className="flex items-center justify-between -mx-4 px-4 py-2.5 bg-[#F4F5F7] border-y border-gray-100/80 md:mx-0 md:rounded-lg md:px-3 md:py-2">
                        <div>
                          <h4 className="font-extrabold text-[14px] text-gray-800 lowercase">
                            {group.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 font-medium">
                            {group.rule === "EXACTLY" && maxQty === 1
                              ? "selecione 1"
                              : group.rule === "BETWEEN"
                              ? `selecione de ${minQty} a ${maxQty}`
                              : `selecione até ${maxQty}`}
                          </p>
                        </div>
                        {isRequired && (
                          <span className="bg-brand-primary text-white text-[9px] font-extrabold px-2.5 py-1 rounded-[10px] uppercase tracking-wider shrink-0">
                            obrigatório
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        {items.map((item: any) => {
                          const isSelected = selections.has(item.id);
                          const disabled = !isSelected && selections.size >= maxQty;
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              disabled={disabled}
                              className={`w-full flex items-center justify-between py-3.5 border-b border-gray-100 transition-all text-left ${
                                disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50/40 active:bg-gray-50/60"
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {isSingleSelect ? (
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isSelected ? 'border-brand-primary bg-brand-primary' : 'border-gray-300 bg-white'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                ) : (
                                  <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isSelected ? 'border-brand-primary bg-brand-primary' : 'border-gray-300 bg-white'
                                  }`}>
                                    {isSelected && (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    )}
                                  </div>
                                )}
                                <span className="font-bold text-[13.5px] text-gray-700 uppercase min-w-0 truncate">
                                  {item.name}
                                </span>
                              </div>
                              <span className="font-bold text-[13.5px] text-gray-600 ml-4 flex-shrink-0 text-right">
                                {item.additionalPrice > 0 ? `+ R$ ${Number(item.additionalPrice).toFixed(2)}` : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Condimentos */}
                {productCondiments.length > 0 && (
                  <div className="space-y-1">
                    {/* Cabeçalho do Grupo Estilo aiqfome */}
                    <div className="flex items-center justify-between -mx-4 px-4 py-2.5 bg-[#F4F5F7] border-y border-gray-100/80 md:mx-0 md:rounded-lg md:px-3 md:py-2">
                      <div>
                        <h4 className="font-extrabold text-[14px] text-gray-800 lowercase">
                          mais alguma coisa?
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium">
                          opcional • escolha quantos quiser
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      {productCondiments.map(cond => {
                        const isSelected = !!selectedCondiments.find(c => c.id === cond.id);
                        return (
                          <button
                            key={cond.id}
                            onClick={() => toggleCondiment(cond)}
                            className="w-full flex items-center justify-between py-3.5 border-b border-gray-100 transition-all text-left hover:bg-gray-50/40 active:bg-gray-50/60"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? 'border-brand-primary bg-brand-primary' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                )}
                              </div>
                              <span className="font-bold text-[13.5px] text-gray-700 uppercase min-w-0 truncate">
                                {cond.name}
                              </span>
                            </div>
                            <span className="font-bold text-[13.5px] text-gray-600 ml-4 flex-shrink-0 text-right">
                              + R$ {cond.price.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Barra inferior flutuante (Estilo aiqfome) */}
              <div className="shrink-0 pt-4 pb-2 border-t border-gray-100 bg-white flex items-center justify-between gap-4 w-full">
                {/* Seletor de Quantidade minimalista */}
                <div className="flex items-center gap-3.5 bg-[#F4F5F7] rounded-full p-1.5 px-3 shrink-0">
                  <button
                    className="w-8 h-8 rounded-full bg-white text-gray-600 font-extrabold text-[18px] disabled:opacity-40 flex items-center justify-center shadow-sm transition-all active:scale-95"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="text-[16px] font-extrabold w-6 text-center text-gray-800">{quantity}</span>
                  <button
                    className="w-8 h-8 rounded-full bg-white text-gray-600 font-extrabold text-[18px] flex items-center justify-center shadow-sm transition-all active:scale-95"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>

                {/* Botão de Adicionar / Loja Fechada */}
                <button
                  className={`flex-1 h-[52px] flex items-center justify-between gap-3 px-6 rounded-full font-black text-[15px] tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase shadow-md ${
                    isClosed
                      ? 'bg-[#B0B3C1] text-white cursor-not-allowed'
                      : 'bg-brand-primary hover:bg-brand-primaryHover text-white active:scale-98'
                  }`}
                  disabled={(productSizes.length > 0 && !selectedSize) || !requiredGroupsValid}
                  onClick={() => {
                    const selectedSizeData: SelectedSize | undefined = selectedSize
                      ? { id: `size-${selectedProduct.id}-${selectedSize.nome}`, nome: selectedSize.nome, preco: selectedSize.preco }
                      : undefined;
                    const selectedFlavorsData: SelectedFlavor[] | undefined = selectedFlavors.length > 0
                      ? selectedFlavors.map(f => ({ id: f.id, nome: f.nome, preco: f.preco }))
                      : undefined;
                    const selectedRequiredItemsData = requiredGroups.filter((g: any) => g.active !== false).map((group: any) => {
                      const groupKey = group.id || group.name;
                      const selections = requiredSelections[groupKey] || new Set<string>();
                      const selected = (group.items || []).filter((i: any) => selections.has(i.id));
                      return { groupName: group.name, items: selected.map((i: any) => ({ name: i.name, additionalPrice: Number(i.additionalPrice) || 0 })) };
                    }).filter((g: any) => g.items.length > 0);
                    const result: any = actions.addToCart(selectedProduct, selectedCondiments, selectedSizeData, selectedFlavorsData, quantity, selectedRequiredItemsData);
                    if (result?.message) setToast({ message: result.message, type: "info" });
                    userClosedRef.current = true;
                    setSelectedProduct(null);
                    setQuantity(1);
                    setSelectedCondiments([]);
                    setSelectedSize(null);
                    setSelectedFlavors([]);
                  }}
                >
                  <span className="truncate whitespace-nowrap text-left">
                    {isClosed ? 'loja fechada' : 'adicionar'}
                  </span>
                  {!isClosed && (
                    <span className="whitespace-nowrap bg-white/20 px-3 py-1 rounded-full text-[13px] font-bold">
                      R$ {productTotal.toFixed(2)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-view toast */}
      {toast && (
        <div
          className="fixed bottom-28 left-4 right-4 z-[60] max-w-[430px] mx-auto animate-slide-up"
          style={{
            background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: toast.type === "error" ? "#991b1b" : "#166534",
            border: `1px solid ${toast.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <div className="flex items-center gap-2">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ marginLeft: "auto", opacity: 0.6, background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
