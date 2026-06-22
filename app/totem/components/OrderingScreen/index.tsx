"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Product, Category, CartItem, Condiment, CategoryFlavor, SelectedSize, SelectedFlavor, ProductSize, Promotion } from "@totem/shared/types";
import { ShoppingBag, Trash2, Plus, Minus, X, ArrowLeft, Store, Star, Bell, User, Tag, MapPin } from "lucide-react";
import { firestore } from "@/src/services/firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import StoreReviewsModal from "../StoreReviewsModal";

interface OrderingScreenProps {
  companyId: string;
  companyName: string;
  companyBanner: string;
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
  onOpenProfile: () => void;
  profileDropdownOpen?: boolean;
  onToggleProfileDropdown?: () => void;
  onEditProfile?: () => void;
  onOpenAddresses?: () => void;
  onViewAdmin?: () => void;
  onViewOwner?: () => void;
  onSignOut?: () => void;
  userName?: string;
  userEmail?: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  promotions?: Promotion[];
  getProductPromotion?: (productId: string) => Promotion | undefined;
  getPromotionalPrice?: (productId: string, basePrice: number) => number;
}

const BANNER_HEIGHT = 168;

export default function OrderingScreen({ 
  companyId,
  companyName,
  companyBanner,
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
  onOpenProfile,
  profileDropdownOpen,
  onToggleProfileDropdown,
  onEditProfile,
  onOpenAddresses,
  onViewAdmin,
  onViewOwner,
  onSignOut,
  userName,
  userEmail,
  isAdmin,
  isOwner,
  promotions = [],
  getProductPromotion,
  getPromotionalPrice,
}: OrderingScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [detailScrollY, setDetailScrollY] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("featured");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
            query(collection(firestore, "requiredItems"), where("groupId", "==", g.id), ...([] as any[]))
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
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    setRequiredSelections({});
  }, [selectedProduct?.id, selectedSize?.nome]);

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
      setScrollY(scrollRef.current.scrollTop);
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

  const filteredProducts = activeCategory === "all" 
    ? products 
    : activeCategory === "featured"
    ? products.filter(p => p.featured || hasPromotion(p.id, p))
    : products.filter(p => p.categoryId === activeCategory);

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

  return (
    <div className="flex h-screen w-screen bg-brand-light overflow-hidden text-brand-dark font-sans select-none">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="sticky top-0 bg-white z-10 border-b border-[#EAEAEA]">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <img src="/Logo.png" alt="Bora" className="h-[42px] w-auto" />
            </div>
            <div className="flex items-center gap-1">
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
              <div className="relative profile-dropdown-container">
                <button
                  onClick={onToggleProfileDropdown || onOpenProfile}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#666] hover:bg-gray-200 transition-colors"
                  title="Perfil"
                >
                  <User className="h-5 w-5" />
                </button>
                {(profileDropdownOpen ?? false) && (
                  <div
                  className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-[#EAEAEA] p-3 w-64 z-50 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B00] font-bold text-sm">
                        {userName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{userName || "Usuário"}</p>
                        <p className="text-[10px] text-[#999] truncate">{userEmail || ""}</p>
                      </div>
                    </div>
                    <button onClick={onEditProfile} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">Editar Perfil</button>
                    <button onClick={onOpenAddresses} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2"><MapPin size={14} /> Meus Endereços</button>
                    {isAdmin ? <button onClick={onViewAdmin} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">Painel Admin</button> : null}
                    {isOwner ? <button onClick={onViewOwner} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">Painel Owner</button> : null}
                    <button onClick={onSignOut} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-medium text-red-500 transition-colors mt-1 border-t border-gray-100 pt-3">Sair</button>
                  </div>
                )}
              </div>
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

          {/* Categories - sticky, follows banner */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200/60 p-4 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory("featured")}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                activeCategory === "featured"
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⭐ Destaques
            </button>
            <button
              onClick={() => setActiveCategory("all")}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                activeCategory === "all"
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
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

          {/* Products list */}
          <div className="p-4 space-y-4 lg:max-w-4xl lg:mx-auto lg:p-6 lg:space-y-5">
            {filteredProducts.map(product => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 md:px-0">
          <div className="relative w-full h-full md:w-[85vw] md:h-auto max-w-[95vw] lg:max-w-[1200px] md:max-h-[95vh] md:min-h-[75vh] mx-auto flex flex-col md:flex-row overflow-hidden bg-white md:rounded-2xl md:shadow-2xl">
            <button
              className="absolute top-6 left-6 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => {
                setSelectedProduct(null);
                setSelectedCondiments([]);
                setSelectedSize(null);
                setSelectedFlavors([]);
                setQuantity(1);
              }}
            >
              <ArrowLeft className="h-6 w-6 text-gray-900" />
            </button>
            <div
              className="w-full md:w-1/2 bg-gray-100 shrink-0 overflow-hidden relative transition-all duration-200 min-h-[280px] md:min-h-[320px]"
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
                {/* Tamanhos */}
                {productSizes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-lg text-brand-dark">Escolha o Tamanho</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {productSizes.map((size, idx) => {
                        const isSelected = selectedSize?.nome === size.nome;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedSize(size);
                              setSelectedFlavors([]);
                            }}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all min-w-0 ${
                              isSelected ? "border-brand-primary bg-brand-light" : "border-gray-200/60 bg-gray-50"
                            }`}
                          >
                            <span className="font-medium text-brand-dark min-w-0 truncate">{size.nome}</span>
                            <span className="font-bold text-brand-muted ml-4 flex-shrink-0 text-right">
                              {(() => {
                                const p = getPrice(selectedProduct!, size.preco);
                                return p > 0 ? `R$ ${p.toFixed(2)}` : "Grátis";
                              })()}
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

                  return (
                    <div key={groupKey} className="space-y-3">
                      <h4 className="font-bold text-lg text-brand-dark">{group.name}</h4>
                      <p className="text-sm text-brand-muted">
                        {selections.size} de{" "}
                        {group.rule === "BETWEEN"
                          ? `${minQty} - ${maxQty}`
                          : group.rule === "MIN"
                          ? `mín. ${minQty}`
                          : group.rule === "MAX"
                          ? `máx. ${maxQty}`
                          : `exatas ${maxQty}`}
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {items.map((item: any) => {
                          const isSelected = selections.has(item.id);
                          const disabled = !isSelected && selections.size >= maxQty;
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              disabled={disabled}
                              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all min-w-0 ${
                                isSelected
                                  ? "border-brand-primary bg-brand-light"
                                  : disabled
                                  ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                  : "border-gray-200/60 bg-gray-50"
                              }`}
                            >
                              <span className="font-medium text-brand-dark min-w-0 truncate">{item.name}</span>
                              <span className="font-bold text-brand-muted ml-4 flex-shrink-0 text-right">
                                {item.additionalPrice > 0 ? `+ R$ ${Number(item.additionalPrice).toFixed(2)}` : ""}
                                {isSelected && <span className="ml-2 text-brand-primary">✓</span>}
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
                  <div className="space-y-3">
                    <h4 className="font-bold text-lg text-brand-dark">Adicionais</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {productCondiments.map(cond => {
                        const isSelected = selectedCondiments.find(c => c.id === cond.id);
                        return (
                          <button
                            key={cond.id}
                            onClick={() => toggleCondiment(cond)}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all min-w-0 ${
                              isSelected ? "border-brand-primary bg-brand-light" : "border-gray-200/60 bg-gray-50"
                            }`}
                          >
                            <span className="font-medium text-brand-dark min-w-0 truncate">{cond.name}</span>
                            <span className="font-bold text-brand-muted ml-4 flex-shrink-0 text-right">+ R$ {cond.price.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantidade */}
                <div className="space-y-3 pt-4 border-t border-gray-200/60">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg text-brand-dark">Quantidade</h4>
                    {(() => {
                      if (!selectedProduct) return null;
                      const promo = getProductPromotion?.(selectedProduct.id);
                      if (promo?.maxPerOrder != null) {
                        return <span className="text-xs text-brand-muted">Máx. {promo.maxPerOrder} unidade(s) no valor promocional</span>;
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="w-10 h-10 rounded-xl border border-gray-200/60 text-lg font-bold text-brand-muted disabled:opacity-50 flex items-center justify-center"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >-</button>
                    <span className="text-lg font-bold w-10 text-center text-brand-dark">{quantity}</span>
                    <button
                      className="w-10 h-10 rounded-xl border border-gray-200/60 text-lg font-bold text-brand-primary flex items-center justify-center"
                      onClick={() => setQuantity(quantity + 1)}
                    >+</button>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                <button
                  className="w-full h-[64px] flex items-center justify-between gap-4 px-6 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-[16px] font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    setSelectedProduct(null);
                    setQuantity(1);
                    setSelectedCondiments([]);
                    setSelectedSize(null);
                    setSelectedFlavors([]);
                  }}
                >
                  <span className="flex-1 min-w-0 truncate whitespace-nowrap text-left">Adicionar ao Pedido</span>
                  <span className="flex-shrink-0 whitespace-nowrap">R$ {productTotal.toFixed(2)}</span>
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
