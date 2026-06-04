"use client";
import { useState, useEffect } from "react";
import { Product, Category, CartItem, Condiment } from "@totem/shared/types";
import { ShoppingBag, Trash2, Plus, Minus, X, ArrowLeft, Check } from "lucide-react";
import { firestore } from "@/src/services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface OrderingScreenProps {
  companyId: string;
  companyName: string;
  products: Product[];
  categories: Category[];
  condiments: Condiment[];
  cart: CartItem[];
  actions: {
    addToCart: (product: Product, selectedCondiments?: Condiment[]) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    updateItemObservation: (id: string, obs: string) => void;
    clearCart: () => void;
  };
  onFinish: () => void;
  onCancel: () => void;
}

export default function OrderingScreen({ 
  companyId,
  companyName,
  products = [], 
  categories = [], 
  condiments = [], 
  cart = [], 
  actions, 
  onFinish, 
  onCancel 
}: OrderingScreenProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCondiments, setSelectedCondiments] = useState<Condiment[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading] = useState(false);
  const [deliveryCosts, setDeliveryCosts] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId) return;
    
    const q = query(collection(firestore, "deliveryCosts"), where("companyId", "==", companyId));
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      setDeliveryCosts(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [companyId]);

  // Filtra condimentos relevantes para o produto selecionado
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

  const productTotal = selectedProduct 
    ? (selectedProduct.price + selectedCondiments.reduce((sum, c) => sum + c.price, 0)) * quantity
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

  const Skeleton = () => (
    <div className="animate-pulse flex gap-4 w-full p-4">
      <div className="w-20 h-20 bg-brand-light rounded-[8px]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-brand-light rounded w-3/4" />
        <div className="h-3 bg-brand-light rounded w-1/2" />
      </div>
    </div>
  );

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
                <div className="flex items-center gap-2 text-[12px] text-green-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Aberto
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
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                        {cartItemsCount}
                    </span>
                )}
             </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Hero do Restaurante (Fixo) */}
          <div className="p-6 shrink-0">
              <div className="bg-gradient-to-r from-red-600 to-red-400 rounded-3xl p-6 text-white shadow-lg">
                <h2 className="text-2xl font-black mb-2">{companyName || (categories.length > 0 ? "Bem-vindo ao Bora" : "Cardápio")}</h2>
                <div className="flex items-center gap-4 text-sm font-medium opacity-90">
                    <div className="flex items-center gap-1">⭐ 4.8</div>
                    <div className="flex items-center gap-1">🕒 25-35 min</div>
                    <div className="flex items-center gap-1">
                      🚚 {deliveryCosts.length > 0 ? `Entrega R$ ${Math.min(...deliveryCosts.map(d => d.deliveryPrice)).toFixed(2)}` : "Entrega rápida"}
                    </div>
                </div>
              </div>
          </div>
          
          {/* Categorias (Sticky) */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-100 p-4 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button 
                onClick={() => setActiveCategory("featured")}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${activeCategory === "featured" ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                ⭐ Destaques
              </button>
              <button 
                onClick={() => setActiveCategory("all")}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${activeCategory === "all" ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Todos
              </button>
              {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${activeCategory === cat.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {cat.name}
                  </button>
              ))}
          </div>

          {/* Lista de Produtos (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 p-4 flex flex-row items-center cursor-pointer transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative w-[35%] aspect-square shrink-0 rounded-2xl overflow-hidden">
                      <img src={product.imageUrl || 'https://placehold.co/400x400?text=Sem+Imagem'} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 ml-4 flex flex-col justify-center">
                      <h3 className="text-[18px] font-bold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-[14px] text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                      <span className="text-[22px] font-bold text-red-600">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>
                    {/* Botão removido */}
                  </div>
                ))}
            </div>
        </main>

        {cart.length > 0 && (
            <div className="fixed bottom-6 left-6 right-6 z-40">
                <button 
                    className="w-full h-[60px] bg-red-600 text-white rounded-[18px] shadow-[0_15px_40px_rgba(220,38,38,0.3)] flex items-center justify-between px-6 font-bold text-lg"
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
      
      {/* Carrinho Desktop (Fixado à direita) */}
      <aside className="hidden lg:flex flex-col w-96 bg-brand-surface border-l border-brand-border p-6 shrink-0 h-full overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 border-b border-brand-border pb-4 shrink-0">
          <ShoppingBag className="h-5 w-5 text-brand-primary" />
          <h2 className="text-lg font-bold text-brand-dark">Seu Pedido</h2>
          <span className="ml-auto bg-brand-light text-brand-dark font-bold text-xs px-2.5 py-1 rounded-[8px]">
            {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}
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
                <div key={item.id} className="bg-brand-surface rounded-[8px] p-3 border border-brand-border flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-brand-dark text-sm leading-tight">{item.name}</span>
                    <button 
                      className="text-brand-muted hover:text-brand-primary transition-colors p-1" 
                      onClick={() => actions.removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2 bg-brand-light rounded-[6px] p-1 border border-brand-border">
                      <button 
                        onClick={() => actions.updateQuantity(item.id, -1)} 
                        disabled={item.quantity <= 1}
                        className="w-6 h-6 bg-brand-surface border border-brand-border rounded-[4px] flex items-center justify-center active:bg-brand-light disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => actions.updateQuantity(item.id, 1)}
                        className="w-6 h-6 bg-brand-surface border border-brand-border rounded-[4px] flex items-center justify-center active:bg-brand-light"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-bold text-brand-primary text-xs">
                      R$ {((item.price + (item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-border pt-4 mt-auto space-y-4 shrink-0">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase text-brand-muted">Total</span>
                <span className="text-2xl font-bold text-brand-dark">R$ {cartTotal.toFixed(2)}</span>
              </div>
              
              <button 
                className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white py-4 rounded-[12px] font-bold text-base transition-all"
                onClick={onFinish}
              >
                FINALIZAR PEDIDO
              </button>
            </div>
          </>
        )}
      </aside>

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
                <div key={item.id} className="bg-brand-light rounded-[12px] p-4 border border-brand-border flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-brand-dark text-sm leading-tight">{item.name}</span>
                    <button 
                      className="text-brand-muted hover:text-brand-primary transition-colors p-1" 
                      onClick={() => actions.removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2 bg-brand-surface rounded-[8px] p-1 border border-brand-border">
                      <button 
                        onClick={() => actions.updateQuantity(item.id, -1)} 
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 bg-brand-light border border-brand-border rounded-[6px] flex items-center justify-center active:bg-brand-surface disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => actions.updateQuantity(item.id, 1)}
                        className="w-7 h-7 bg-brand-light border border-brand-border rounded-[6px] flex items-center justify-center active:bg-brand-surface"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-bold text-brand-primary text-sm">
                      R$ {((item.price + (item.condiments?.reduce((sum, c) => sum + c.price, 0) || 0)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-border pt-6 mt-auto space-y-4 shrink-0">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase text-brand-muted">Total</span>
                <span className="text-xl font-bold text-brand-dark">R$ {cartTotal.toFixed(2)}</span>
              </div>
              
              <button 
                className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white py-4 rounded-[12px] font-bold text-base transition-all"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  onFinish();
                }}
              >
                FINALIZAR PEDIDO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DE DETALHES DO PRODUTO (TELA CHEIA) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          
          <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden">
            
            <button 
              className="absolute top-6 left-6 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => setSelectedProduct(null)}
            >
              <ArrowLeft className="h-6 w-6 text-gray-900" />
            </button>

            <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-8 shrink-0">
              <img 
                src={selectedProduct.imageUrl || 'https://placehold.co/600x600?text=Sem+Imagem'} 
                alt={selectedProduct.name}
                className="max-w-full max-h-[50vh] md:max-h-full object-cover rounded-3xl shadow-xl"
              />
            </div>

            <div className="w-full md:w-1/2 flex flex-col p-8 md:p-16 bg-white">
              <div className="mb-6">
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  {selectedProduct.name}
                </h2>
                <p className="text-gray-500 text-lg">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                 {productCondiments.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-900">Adicionais</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {productCondiments.map(cond => {
                          const isSelected = selectedCondiments.find(c => c.id === cond.id);
                          return (
                            <button
                              key={cond.id}
                              onClick={() => toggleCondiment(cond)}
                              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                isSelected ? 'border-red-600 bg-red-50' : 'border-gray-100 bg-gray-50'
                              }`}
                            >
                              <span className="font-medium text-gray-900">{cond.name}</span>
                              <span className="font-bold text-gray-600">+ R$ {cond.price.toFixed(2)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                 )}
              </div>

              <div className="mt-auto pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-bold">Quantidade</span>
                    <div className="flex items-center gap-4 border border-gray-200 rounded-2xl p-2">
                        <button 
                          className="p-3 text-2xl font-bold text-gray-600 disabled:opacity-50"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >-</button>
                        <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                        <button 
                          className="p-3 text-2xl font-bold text-red-600"
                          onClick={() => setQuantity(quantity + 1)}
                        >+</button>
                    </div>
                </div>

                <button 
                  className="w-full h-[64px] flex items-center justify-between px-8 bg-red-600 hover:bg-red-700 text-white rounded-[16px] font-bold text-lg transition-all"
                  onClick={() => {
                    actions.addToCart(selectedProduct, selectedCondiments);
                    setSelectedProduct(null);
                    setQuantity(1);
                    setSelectedCondiments([]);
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



