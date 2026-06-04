"use client";
import { useState, useEffect } from "react";
import { Product, Category, CartItem, Condiment } from "@totem/shared/types";
import { ShoppingBag, Trash2, Plus, Minus, X, RotateCcw, Check } from "lucide-react";

interface OrderingScreenProps {
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
  const [tempSelectedCondimentIds, setTempSelectedCondimentIds] = useState<string[]>([]);
  const [loading] = useState(false); // Assume loading is handled outside or logic needed

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.categoryId === activeCategory);

  const cartTotal = cart.reduce((acc, i) => {
    const condimentsPrice = i.condiments?.reduce((sum, c) => sum + c.price, 0) || 0;
    return acc + ((i.price + condimentsPrice) * i.quantity);
  }, 0);
  const cartItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const productCondiments = selectedProduct 
    ? condiments.filter(c => c.enabled && c.categoryIds?.includes(selectedProduct.categoryId))
    : [];

  const modalTotalPrice = selectedProduct 
    ? selectedProduct.price + condiments
        .filter(c => tempSelectedCondimentIds.includes(c.id))
        .reduce((sum, c) => sum + c.price, 0)
    : 0;

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
      {/* 1. ÁREA PRINCIPAL: CATEGORIAS E PRODUTOS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-brand-surface border-b border-brand-border px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-1.5">
              NexOrder
              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary"></span>
            </h1>
          </div>
          <button 
            className="flex items-center gap-1.5 text-xs font-bold text-brand-muted hover:text-brand-primary transition-colors bg-brand-light px-4 py-2 rounded-[12px] border border-brand-border" 
            onClick={() => { actions.clearCart(); onCancel(); }}
          >
            <span>Voltar</span>
          </button>
        </header>

        {/* Grade de Produtos */}
        <main className="flex-1 overflow-y-auto bg-brand-light">
          {loading ? (
             <div className="p-4 space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} />)}</div>
          ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-brand-muted">
                <p>Nenhum produto encontrado.</p>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-0">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="bg-brand-surface border-b border-r border-brand-border p-6 transition-all hover:bg-brand-light cursor-pointer flex gap-4 w-full"
                    onClick={() => {
                      setTempSelectedCondimentIds([]);
                      setSelectedProduct(product);
                    }}
                  >
                    <div className="w-24 h-24 rounded-[12px] overflow-hidden bg-brand-light flex-shrink-0 border border-brand-border">
                      <img src={product.imageUrl || 'https://placehold.co/400x400?text=Sem+Imagem'} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-1">
                      <h3 className="font-bold text-base text-brand-dark leading-snug">{product.name}</h3>
                      <p className="text-xs text-brand-muted leading-snug line-clamp-2">{product.description}</p>
                      <span className="font-black text-brand-primary text-base mt-1">R$ {product.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>

        {/* NAVIGATION BOTTOM */}
        <nav className="h-16 bg-brand-surface border-t border-brand-border flex items-center justify-around shrink-0 px-4">
          <div className="flex flex-col items-center gap-1 text-brand-primary" onClick={() => setActiveCategory("all")}>
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold">Início</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-brand-muted" onClick={() => setIsMobileCartOpen(true)}>
            <span className="text-xl">🛒</span>
            <span className="text-[10px] font-bold">Pedido ({cartItemsCount})</span>
          </div>
        </nav>
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

      {/* 4. MODAL/DRAWER DO CARRINHO EM DISPOSITIVOS MÓVEIS */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-surface">
          
          {/* Card do Modal Ocupando a Tela Toda */}
          <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden">
            
            {/* Botão Fechar (X) */}
            <button 
              className="absolute top-6 left-6 z-20 p-3 rounded-full bg-brand-light text-brand-dark transition-colors border border-brand-border"
              onClick={() => setSelectedProduct(null)}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Lado Esquerdo: Imagem (Superior em mobile) */}
            <div className="w-full md:w-1/2 bg-brand-light flex items-center justify-center p-8 md:p-16 shrink-0">
              <img 
                src={selectedProduct.imageUrl || 'https://placehold.co/600x600?text=Sem+Imagem'} 
                alt={selectedProduct.name}
                className="max-w-full max-h-[40vh] md:max-h-full object-contain"
              />
            </div>

            {/* Lado Direito: Informações */}
            <div className="w-full md:w-1/2 flex flex-col p-8 md:p-20 overflow-y-auto bg-brand-surface">
              <div className="mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-brand-dark leading-tight mb-4">
                  {selectedProduct.name}
                </h2>
                <p className="text-2xl font-bold text-brand-primary">
                  R$ {modalTotalPrice.toFixed(2)}
                </p>
              </div>

              <div className="space-y-8 flex-1">
                {selectedProduct.description && (
                  <div>
                    <h4 className="text-[12px] font-bold text-brand-muted uppercase tracking-widest mb-3">Descrição</h4>
                    <p className="text-brand-muted text-base leading-relaxed max-w-xl">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                {productCondiments.length > 0 && (
                  <div>
                    <h4 className="text-[12px] font-bold text-brand-muted uppercase tracking-widest mb-6">Adicionais</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {productCondiments.map(cond => (
                      <button
                        key={cond.id}
                        onClick={() => {
                          setTempSelectedCondimentIds(prev => 
                            prev.includes(cond.id) ? prev.filter(id => id !== cond.id) : [...prev, cond.id]
                          );
                        }}
                        className={`flex items-center justify-between p-5 rounded-[16px] border-2 transition-all ${
                          tempSelectedCondimentIds.includes(cond.id)
                            ? 'border-brand-primary bg-brand-primary/5'
                            : 'border-brand-border bg-brand-surface hover:border-brand-muted'
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className={`text-sm font-bold ${tempSelectedCondimentIds.includes(cond.id) ? 'text-brand-dark' : 'text-brand-dark'}`}>
                            {cond.name}
                          </span>
                          <span className="text-xs text-brand-primary font-bold">+ R$ {cond.price.toFixed(2)}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-[8px] flex items-center justify-center border-2 transition-colors ${
                          tempSelectedCondimentIds.includes(cond.id) 
                            ? 'bg-brand-primary border-brand-primary' 
                            : 'border-brand-border bg-brand-surface'
                        }`}>
                          {tempSelectedCondimentIds.includes(cond.id) && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-brand-border">
                <button 
                  className="w-full flex items-center justify-center gap-4 bg-brand-primary hover:bg-brand-primaryHover text-white py-6 rounded-[16px] font-bold text-lg transition-all active:scale-[0.98]"
                  onClick={() => {
                    const selected = condiments.filter(c => tempSelectedCondimentIds.includes(c.id));
                    actions.addToCart(selectedProduct, selected);
                    setSelectedProduct(null);
                    setTempSelectedCondimentIds([]);
                  }}
                >
                  <span>ADICIONAR • R$ {modalTotalPrice.toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
