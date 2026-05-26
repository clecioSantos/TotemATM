"use client";
import { useState } from "react";
import { Product, Category, CartItem } from "@totem/shared/types";
import { ShoppingBag, Trash2, Plus, Minus, X, RotateCcw, ArrowRight } from "lucide-react";

interface OrderingScreenProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  actions: {
    addToCart: (product: Product) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    updateItemObservation: (id: string, obs: string) => void;
    clearCart: () => void;
  };
  onFinish: () => void;
  onCancel: () => void;
}

export default function OrderingScreen({ products, categories, cart, actions, onFinish, onCancel }: OrderingScreenProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.categoryId === activeCategory);

  const cartTotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const cartItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  // Componente de lista de itens do carrinho reutilizável
  const CartItemsList = () => (
    <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
      {cart.map(item => (
        <div key={item.id} className="bg-white rounded-xl p-4 border border-brand-border/60 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start gap-2">
            <span className="font-bold text-brand-dark text-sm md:text-base leading-tight">{item.name}</span>
            <button 
              className="text-stone-400 hover:text-red-500 transition-colors p-1" 
              onClick={() => actions.removeFromCart(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-3 bg-stone-100 rounded-lg p-1">
              <button 
                onClick={() => actions.updateQuantity(item.id, -1)} 
                disabled={item.quantity <= 1}
                className="w-7 h-7 bg-white border border-stone-200 rounded-md font-bold flex items-center justify-center text-brand-dark active:bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="font-bold text-sm text-stone-800 min-w-4 text-center">{item.quantity}</span>
              <button 
                onClick={() => actions.updateQuantity(item.id, 1)}
                className="w-7 h-7 bg-white border border-stone-200 rounded-md font-bold flex items-center justify-center text-brand-dark active:bg-brand-accent"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="font-black text-brand-success text-sm md:text-base">R$ {(item.price * item.quantity).toFixed(2)}</span>
          </div>

          <input 
            type="text"
            className="w-full text-xs bg-stone-50 border border-stone-200 p-2.5 rounded-lg text-stone-600 focus:outline-none focus:border-brand-accent"
            placeholder="Observação (ex: sem cebola)"
            value={item.observation || ""}
            onChange={(e) => actions.updateItemObservation(item.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-brand-light overflow-hidden text-brand-dark font-sans select-none pb-20 lg:pb-0">
      
      {/* 1. ÁREA PRINCIPAL: CATEGORIAS E PRODUTOS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header Superior */}
        <header className="bg-white border-b border-brand-border/60 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-1.5">
              NexOrder
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
            </h1>
            <p className="text-xs text-brand-muted">Escolha as suas delícias</p>
          </div>
          
          <button 
            className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-red-500 transition-colors bg-stone-100 hover:bg-red-50 px-3.5 py-2 rounded-full border border-stone-200" 
            onClick={() => { actions.clearCart(); onCancel(); }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Abandonar Pedido</span>
          </button>
        </header>

        {/* Categorias - Visão Mobile (Aba horizontal deslizante) */}
        <div className="lg:hidden bg-white border-b border-brand-border/40 py-3.5 px-4 overflow-x-auto scrollbar-none flex gap-2 shrink-0">
          <button 
            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              activeCategory === "all" 
                ? 'bg-brand-accent text-brand-dark shadow-md shadow-yellow-500/10' 
                : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
            onClick={() => setActiveCategory("all")}
          >
            🍔 Todas
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.id 
                  ? 'bg-brand-accent text-brand-dark shadow-md shadow-yellow-500/10' 
                  : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Layout Conteúdo Principal */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Categorias - Visão Desktop (Barra lateral esquerda) */}
          <aside className="hidden lg:flex flex-col w-44 bg-white border-r border-brand-border/60 py-6 px-3 shrink-0 overflow-y-auto gap-2">
            <span className="text-[10px] font-black tracking-widest text-brand-muted uppercase mb-2 px-3">Categorias</span>
            <button 
              className={`w-full text-left px-4 py-3 rounded-premium text-sm font-bold transition-all duration-200 ${
                activeCategory === "all" 
                  ? 'bg-brand-accent text-brand-dark shadow-md shadow-yellow-500/10' 
                  : 'text-stone-600 hover:bg-stone-50 border border-transparent'
              }`}
              onClick={() => setActiveCategory("all")}
            >
              🍔 Todas
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                className={`w-full text-left px-4 py-3 rounded-premium text-sm font-bold transition-all duration-200 ${
                  activeCategory === cat.id 
                    ? 'bg-brand-accent text-brand-dark shadow-md shadow-yellow-500/10' 
                    : 'text-stone-600 hover:bg-stone-50 border border-transparent'
                }`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </aside>

          {/* Grade de Produtos */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-stone-50">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="text-4xl mb-3">📦</div>
                <p className="font-bold text-stone-400">Nenhum produto nesta categoria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-auto items-start">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-premium border border-brand-border/60 p-3 md:p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex flex-col"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-stone-50 mb-3 border border-stone-100">
                      <img 
                        src={product.imageUrl || 'https://placehold.co/400x400?text=Sem+Imagem'} 
                        alt={product.name} 
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className="font-extrabold text-sm md:text-base text-brand-dark line-clamp-2 leading-tight min-h-[2.5rem]">{product.name}</h3>
                      <p className="text-brand-success font-black text-base md:text-lg mt-2">R$ {product.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 2. CARRINHO LATERAL - VISÃO DESKTOP (Fixado à direita) */}
      <aside className="hidden lg:flex flex-col w-96 bg-white border-l border-brand-border/60 p-6 shrink-0 h-full overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 border-b border-brand-border/60 pb-4 shrink-0">
          <ShoppingBag className="h-5 w-5 text-brand-accent" />
          <h2 className="text-lg font-black tracking-tight text-brand-dark">Seu Pedido</h2>
          <span className="ml-auto bg-brand-accent/20 text-brand-accent font-black text-xs px-2.5 py-1 rounded-full">
            {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-400 p-6">
            <ShoppingBag className="h-12 w-12 mb-3 stroke-[1.5] text-stone-300" />
            <p className="font-bold text-sm">Seu carrinho está vazio</p>
            <p className="text-xs text-stone-400 mt-1">Toque em um produto para adicioná-lo ao pedido.</p>
          </div>
        ) : (
          <>
            <CartItemsList />

            <div className="border-t border-brand-border/60 pt-4 mt-auto space-y-4 shrink-0">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black tracking-widest text-brand-muted uppercase">Total do Pedido</span>
                <span className="text-2xl font-black text-brand-success">R$ {cartTotal.toFixed(2)}</span>
              </div>
              
              <button 
                className="w-full flex items-center justify-center gap-2 bg-brand-success hover:bg-green-700 text-white py-4 rounded-premium font-black text-base shadow-lg shadow-green-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={cart.length === 0} 
                onClick={onFinish}
              >
                <span>FINALIZAR PEDIDO</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </aside>

      {/* 3. BARRA INFERIOR FIXA - VISÃO MOBILE */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-brand-border/60 p-4 flex items-center justify-between z-40 lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.06)] rounded-t-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brand-muted uppercase">Carrinho ({cartItemsCount})</span>
            <span className="text-lg font-black text-brand-success">R$ {cartTotal.toFixed(2)}</span>
          </div>
          <button 
            className="bg-brand-accent hover:bg-brand-accentHover text-brand-dark px-6 py-3.5 rounded-premium font-extrabold text-sm shadow-md shadow-yellow-500/10 flex items-center gap-2 transition-all active:scale-95"
            onClick={() => setIsMobileCartOpen(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Ver Carrinho</span>
          </button>
        </div>
      )}

      {/* 4. MODAL/DRAWER DO CARRINHO EM DISPOSITIVOS MÓVEIS */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Overlay escuro de fundo */}
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" onClick={() => setIsMobileCartOpen(false)} />
          
          {/* Corpo do Drawer */}
          <div className="relative bg-brand-light w-full rounded-t-3xl p-5 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-[slideUp_0.3s_ease]">
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-4" onClick={() => setIsMobileCartOpen(false)} />
            
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-accent" />
                <h3 className="font-black text-lg">Meu Pedido</h3>
              </div>
              <button className="text-stone-400 hover:text-brand-dark p-1" onClick={() => setIsMobileCartOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <CartItemsList />

            <div className="border-t border-brand-border/60 pt-4 mt-auto space-y-4 shrink-0">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black tracking-widest text-brand-muted uppercase">Total do Pedido</span>
                <span className="text-xl font-black text-brand-success">R$ {cartTotal.toFixed(2)}</span>
              </div>
              
              <button 
                className="w-full flex items-center justify-center gap-2 bg-brand-success hover:bg-green-700 text-white py-4 rounded-premium font-black text-base shadow-lg shadow-green-600/10 transition-colors"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  onFinish();
                }}
              >
                <span>FINALIZAR PEDIDO</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DE DETALHES DO PRODUTO (TELA FLUTUANTE) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 lg:p-12">
          {/* Overlay Escuro */}
          <div 
            className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setSelectedProduct(null)} 
          />
          
          {/* Card do Modal */}
          <div className="relative bg-white w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            
            {/* Botão Fechar (X) */}
            <button 
              className="absolute top-4 right-4 md:top-6 md:right-6 z-20 bg-stone-100 md:bg-white/80 md:backdrop-blur-md p-2 rounded-full text-stone-400 hover:text-brand-dark transition-colors shadow-sm border border-stone-100"
              onClick={() => setSelectedProduct(null)}
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* Lado Esquerdo: Imagem (Topo em Mobile, Esquerda em Desktop) */}
            <div className="w-full md:w-1/2 bg-stone-50 flex items-center justify-center p-8 md:p-16 border-b md:border-b-0 md:border-r border-stone-100 shrink-0">
              <img 
                src={selectedProduct.imageUrl || 'https://placehold.co/600x600?text=Sem+Imagem'} 
                alt={selectedProduct.name}
                className="max-w-full max-h-48 md:max-h-full object-contain drop-shadow-2xl"
              />
            </div>

            {/* Lado Direito: Informações e Ação */}
            <div className="w-full md:w-1/2 flex flex-col p-6 md:p-12 overflow-y-auto bg-white">
              <div className="mb-6 md:mb-8">
                <span className="inline-block px-3 py-1 bg-brand-accent/10 text-brand-dark text-[10px] font-black tracking-[0.2em] uppercase rounded-full mb-3 md:mb-4">
                  {categories.find(c => c.id === selectedProduct.categoryId)?.name || 'Produto'}
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-brand-dark leading-tight mb-2">
                  {selectedProduct.name}
                </h2>
                <p className="text-xl md:text-2xl font-black text-brand-success">
                  R$ {selectedProduct.price.toFixed(2)}
                </p>
              </div>

              <div className="space-y-6 md:space-y-8 flex-1">
                {selectedProduct.description && (
                  <div>
                    <h4 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-2">Descrição</h4>
                    <p className="text-stone-500 text-sm md:text-base leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-stone-100 flex flex-col gap-3">
                <button 
                  className="w-full flex items-center justify-center gap-4 bg-brand-accent hover:bg-brand-accentHover text-brand-dark py-4 md:py-5 rounded-premium font-black text-base md:text-lg shadow-xl shadow-yellow-500/20 transition-all active:scale-95"
                  onClick={() => {
                    actions.addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <Plus className="h-5 w-5 md:h-6 md:w-6" />
                  <span>ADICIONAR AO CARRINHO</span>
                </button>
                <p className="hidden md:block text-center text-xs text-stone-400 font-bold mt-4 uppercase tracking-widest">Toque fora para cancelar</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}