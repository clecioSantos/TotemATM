"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Product, Category, CartItem, Condiment, CategoryFlavor, SelectedSize, SelectedFlavor, ProductSize } from "@totem/shared/types";
import { ShoppingBag, Trash2, Plus, Minus, X, ArrowLeft, Store } from "lucide-react";
import { firestore } from "@/src/services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface OrderingScreenProps {
  companyId: string;
  companyName: string;
  companyBanner: string;
  companyOpen: boolean | null;
  tempoPreparoMin: number;
  tempoPreparoMax: number;
  products: Product[];
  categories: Category[];
  condiments: Condiment[];
  flavors: CategoryFlavor[];
  cart: CartItem[];
  actions: {
    addToCart: (product: Product, selectedCondiments?: Condiment[], tamanhoSelecionado?: SelectedSize, saboresSelecionados?: SelectedFlavor[]) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    updateItemObservation: (id: string, obs: string) => void;
    clearCart: () => void;
  };
  onFinish: () => void;
  onCancel: () => void;
}

const BANNER_HEIGHT = 168;

export default function OrderingScreen({ 
  companyId,
  companyName,
  companyBanner,
  companyOpen,
  tempoPreparoMin,
  tempoPreparoMax,
  products = [], 
  categories = [], 
  condiments = [],
  flavors = [],
  cart = [], 
  actions, 
  onFinish, 
  onCancel 
}: OrderingScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("featured");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCondiments, setSelectedCondiments] = useState<Condiment[]>([]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<CategoryFlavor[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [deliveryCosts, setDeliveryCosts] = useState<any[]>([]);

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

  const productSizes: ProductSize[] = selectedProduct && productCategory?.possuiTamanhos
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
      if (prev.length >= maxFlavors) return prev;
      return [...prev, flavor];
    });
  };

  const productTotal = selectedProduct 
    ? (selectedProduct.price + (selectedSize?.preco || 0) + selectedFlavors.reduce((sum, f) => sum + (f.preco || 0), 0) + selectedCondiments.reduce((sum, c) => sum + c.price, 0)) * quantity
    : 0;

  const filteredProducts = activeCategory === "all" 
    ? products 
    : activeCategory === "featured"
    ? products.filter(p => p.featured)
    : products.filter(p => p.categoryId === activeCategory);

  const cartTotal = cart.reduce((acc, i) => {
    const condimentsPrice = i.condiments?.reduce((sum, c) => sum + c.price, 0) || 0;
    return acc + ((i.price + condimentsPrice) * i.quantity);
  }, 0);
  const cartItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const isClosed = companyOpen === false;

  return (
    <div className="flex h-screen w-screen bg-brand-light overflow-hidden text-brand-dark font-sans select-none">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="sticky top-0 z-30 backdrop-blur-[16px] bg-[rgba(255,255,255,0.85)] border-b border-[rgba(0,0,0,0.05)] px-6 h-[80px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <button 
                onClick={onCancel}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
             >
                <ArrowLeft className="h-6 w-6" />
             </button>
             <img src="/Logo.png" alt="Bora" className="h-10" />
             <div className="h-6 w-[1px] bg-gray-200" />
             <div> 
                <div className={`flex items-center gap-2 text-[12px] font-semibold ${isClosed ? 'text-red-600' : 'text-green-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${isClosed ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  {isClosed ? 'Fechado' : 'Aberto'}
                </div>
             </div>
          </div>
          <div className="h-6 w-[1px] bg-gray-200" />
          <div className="flex items-center gap-4">
             <button 
                className="relative p-3 rounded-full hover:bg-gray-100"
                onClick={() => setIsMobileCartOpen(true)}
             >
                <ShoppingBag className="h-6 w-6 text-gray-900" />
                {cartItemsCount > 0 && (
                    <span className="absolute top-1 right-1 bg-brand-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                        {cartItemsCount}
                    </span>
                )}
             </button>
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
                <div className="flex items-center gap-1">⭐ 4.8</div>
                <div className="flex items-center gap-1">🕒 {tempoPreparoMin}-{tempoPreparoMax} min</div>
                <div className="flex items-center gap-1">
                  🚚 {deliveryCosts.length > 0
                    ? `Entrega R$ ${Math.min(...deliveryCosts.map(d => d.deliveryPrice)).toFixed(2)}`
                    : "Entrega rápida"}
                </div>
              </div>
            </div>
          </div>

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
          <div className="p-4 space-y-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-[16px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-200/60 p-3 flex flex-row items-center cursor-pointer transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative w-[30%] aspect-[4/3] shrink-0 rounded-xl overflow-hidden">
                  <img
                    src={product.imageUrl || "https://placehold.co/400x400?text=Sem+Imagem"}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 ml-3 flex flex-col justify-center">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-0.5">{product.name}</h3>
                  <p className="text-[13px] text-gray-500 mb-1 line-clamp-2">{product.description}</p>
                  <span className="text-[20px] font-bold text-brand-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>

        {cart.length > 0 && (
          <div className="fixed bottom-6 left-6 right-6 z-40">
            <button
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
      <aside className="hidden lg:flex flex-col w-96 bg-brand-surface border-l border-brand-border/40 p-6 shrink-0 h-full overflow-hidden shadow-sm">
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
                    </div>
                    <button
                      className="text-brand-muted hover:text-brand-primary transition-colors p-1"
                      onClick={() => actions.removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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
                      R$ {((item.price + (item.tamanhoSelecionado?.preco || 0) + (item.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0) + (item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                      <span className="font-bold text-brand-dark text-sm leading-tight">{item.name}</span>
                      {item.tamanhoSelecionado && (
                        <p className="text-xs text-brand-muted mt-0.5">{item.tamanhoSelecionado.nome}</p>
                      )}
                      {item.saboresSelecionados && item.saboresSelecionados.length > 0 && (
                        <p className="text-xs text-brand-muted">
                          {item.saboresSelecionados.map(f => f.nome).join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      className="text-brand-muted hover:text-brand-primary transition-colors p-1"
                      onClick={() => actions.removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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
                      R$ {((item.price + (item.tamanhoSelecionado?.preco || 0) + (item.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0) + (item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden">
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
            <div className="w-full md:w-1/2 bg-gray-100 shrink-0 overflow-hidden relative" style={{ height: "40vh" }}>
              <img
                src={selectedProduct.imageUrl || "https://placehold.co/600x600?text=Sem+Imagem"}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            <div className="w-full md:w-1/2 flex-1 min-h-0 flex flex-col p-8 md:p-16 bg-white">
              <div className="mb-6 shrink-0">
                <h2 className="text-4xl font-bold text-brand-dark mb-2">{selectedProduct.name}</h2>
                <p className="text-brand-muted text-lg">{selectedProduct.description}</p>
                <p className="text-2xl font-bold text-brand-primary mt-2">
                  R$ {selectedProduct.price.toFixed(2)}
                </p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-6">
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
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                              isSelected ? "border-brand-primary bg-brand-light" : "border-gray-200/60 bg-gray-50"
                            }`}
                          >
                            <span className="font-medium text-brand-dark">{size.nome}</span>
                            <span className="font-bold text-brand-muted">
                              {size.preco > 0 ? `R$ ${size.preco.toFixed(2)}` : "Grátis"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sabores */}
                {maxFlavors > 0 && productFlavors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-lg text-brand-dark">
                      Escolha {maxFlavors} {maxFlavors === 1 ? "sabor" : "sabores"}
                    </h4>
                    <p className="text-sm text-brand-muted">
                      {selectedFlavors.length} de {maxFlavors} selecionados
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {productFlavors.map(flavor => {
                        const isSelected = selectedFlavors.find(f => f.id === flavor.id);
                        const isMaxed = selectedFlavors.length >= maxFlavors && !isSelected;
                        return (
                          <button
                            key={flavor.id}
                            onClick={() => toggleFlavor(flavor)}
                            disabled={isMaxed}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                              isSelected
                                ? "border-brand-primary bg-brand-light"
                                : isMaxed
                                ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-200/60 bg-gray-50"
                            }`}
                          >
                            <span className="font-medium text-brand-dark">{flavor.nome}</span>
                            <span className="font-bold text-brand-muted">
                              {flavor.preco > 0 ? `+ R$ ${flavor.preco.toFixed(2)}` : ""}
                              {isSelected && <span className="ml-2 text-brand-primary">✓</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                              isSelected ? "border-brand-primary bg-brand-light" : "border-gray-200/60 bg-gray-50"
                            }`}
                          >
                            <span className="font-medium text-brand-dark">{cond.name}</span>
                            <span className="font-bold text-brand-muted">+ R$ {cond.price.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="shrink-0 pt-8 border-t border-gray-200/60">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-bold text-brand-dark">Quantidade</span>
                  <div className="flex items-center gap-4 border border-gray-200/60 rounded-2xl p-2">
                    <button
                      className="p-3 text-2xl font-bold text-brand-muted disabled:opacity-50"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >-</button>
                    <span className="text-2xl font-bold w-12 text-center text-brand-dark">{quantity}</span>
                    <button
                      className="p-3 text-2xl font-bold text-brand-primary"
                      onClick={() => setQuantity(quantity + 1)}
                    >+</button>
                  </div>
                </div>
                <button
                  className="w-full h-[64px] flex items-center justify-between px-8 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-[16px] font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={productSizes.length > 0 && !selectedSize}
                  onClick={() => {
                    const selectedSizeData: SelectedSize | undefined = selectedSize
                      ? { id: `size-${selectedProduct.id}-${selectedSize.nome}`, nome: selectedSize.nome, preco: selectedSize.preco }
                      : undefined;
                    const selectedFlavorsData: SelectedFlavor[] | undefined = selectedFlavors.length > 0
                      ? selectedFlavors.map(f => ({ id: f.id, nome: f.nome, preco: f.preco }))
                      : undefined;
                    actions.addToCart(selectedProduct, selectedCondiments, selectedSizeData, selectedFlavorsData);
                    setSelectedProduct(null);
                    setQuantity(1);
                    setSelectedCondiments([]);
                    setSelectedSize(null);
                    setSelectedFlavors([]);
                  }}
                >
                  <span>Adicionar ao Pedido</span>
                  <span>R$ {productTotal.toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
