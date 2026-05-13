"use client";
import { useState } from "react";
import { Product, Category, CartItem } from "../../../../../packages/shared/src/types/index";

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

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.categoryId === activeCategory);

  const cartTotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  return (
    <div className="totem-layout">
      <aside className="categories-sidebar">
        <button 
          className={`cat-btn ${activeCategory === "all" ? 'active' : ''}`}
          onClick={() => setActiveCategory("all")}
        >
          Todas
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id} 
            className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </aside>

      <main className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="empty-category">
            <p>Nenhum produto disponível nesta categoria.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <button key={product.id} className="product-card" onClick={() => actions.addToCart(product)}>
              <div className="product-image-wrapper">
                <img src={product.imageUrl || 'https://placehold.co/400x400?text=Sem+Imagem'} alt={product.name} />
              </div>
              <h3 className="product-name">{product.name}</h3>
              <p className="product-price">R$ {product.price.toFixed(2)}</p>
            </button>
          ))
        )}
      </main>

      <aside className="cart-summary">
        <h2>Seu Pedido</h2>
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item-card">
              <div className="cart-item-header">
                <span className="item-name">{item.name}</span>
                <button className="remove-item-btn" onClick={() => actions.removeFromCart(item.id)}>&times;</button>
              </div>
              <div className="cart-item-details">
                <div className="quantity-selector">
                  <button onClick={() => actions.updateQuantity(item.id, -1)} disabled={item.quantity <= 1}>-</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button onClick={() => actions.updateQuantity(item.id, 1)}>+</button>
                </div>
                <span className="item-price">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
              <input 
                type="text"
                className="item-obs-input"
                placeholder="Observação (ex: sem cebola)"
                value={item.observation || ""}
                onChange={(e) => actions.updateItemObservation(item.id, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="cart-footer">
          <div className="total">
            Total: R$ {cartTotal.toFixed(2)}
          </div>
          <button 
            className="finish-btn" 
            disabled={cart.length === 0} 
            onClick={onFinish}
          >
            FINALIZAR
          </button>
          <button className="cancel-btn" onClick={() => { actions.clearCart(); onCancel(); }}>
            CANCELAR
          </button>
        </div>
      </aside>
    </div>
  );
}