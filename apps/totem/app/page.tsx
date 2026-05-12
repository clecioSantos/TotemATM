"use client";
import { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import { useTotem } from "./hooks/useTotem";
import "./page.css";

export default function TotemPage() {
  const [step, setStep] = useState<'WELCOME' | 'ORDERING' | 'IDENTIFICATION' | 'FINISHED'>('WELCOME');
  const { products, categories, cart, addToCart, removeFromCart, updateQuantity, finishOrder, clearCart, updateItemObservation, loading } = useTotem();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  // Garante que uma categoria esteja selecionada ao entrar na tela de pedidos
  useEffect(() => {
    if (step === 'ORDERING' && !activeCategory) {
      setActiveCategory("all");
    }
  }, [step, categories, activeCategory]);


  if (step === 'WELCOME') {
    return <WelcomeScreen onStart={() => {
      setStep('ORDERING');
      if (categories.length > 0) setActiveCategory(categories[0].id);
    }} />;
  }

  const handleFinish = async () => {
    await finishOrder(customerName, tableNumber);
    setStep('FINISHED');
    setCustomerName("");
    setTableNumber("");
    setTimeout(() => {
      setStep('WELCOME');
    }, 5000);
  };

  if (step === 'FINISHED') {
    return (
      <div className="finished-screen">
        <h1>Pedido Enviado!</h1>
        <p>Acompanhe seu número no painel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (step === 'IDENTIFICATION') {
    return (
      <div className="identification-screen">
        <div className="identification-card">
          <h1>Quase lá!</h1>
          <p>Informe seu nome e o número da mesa para entregarmos seu pedido.</p>
          
          <div className="id-inputs">
            <div className="input-group">
              <label>Seu Nome</label>
              <input 
                type="text" 
                placeholder="Como quer ser chamado?" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="totem-input-large"
              />
            </div>
            <div className="input-group">
              <label>Número da Mesa</label>
              <input 
                type="number" 
                placeholder="00" 
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="totem-input-large"
              />
            </div>
          </div>

          <button className="confirm-btn" disabled={!customerName || !tableNumber} onClick={handleFinish}>
            CONFIRMAR E ENVIAR
          </button>
          <button className="back-btn" onClick={() => setStep('ORDERING')}>VOLTAR PARA O PEDIDO</button>
        </div>
      </div>
    );
  }

  return (
    <div className="totem-layout">
      {categories.length === 0 ? (
        <div className="empty-state-full">
          <p>Nenhuma categoria cadastrada.</p>
        </div>
      ) : (
        <>
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
            {(activeCategory === "all" 
              ? products 
              : products.filter(p => p.categoryId === activeCategory)
            ).length === 0 ? (
              <div className="empty-category">
                <p>Nenhum produto disponível.</p>
              </div>
            ) : (
              (activeCategory === "all" 
                ? products 
                : products.filter(p => p.categoryId === activeCategory)
              ).map(product => (
                <button 
                  key={product.id} 
                  className="product-card" 
                  onClick={() => addToCart(product)}
                >
                  <div className="product-image-wrapper">
                    <img src={product.imageUrl || 'https://placehold.co/400x400?text=Sem+Imagem'} alt={product.name} />
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">R$ {product.price.toFixed(2)}</p>
                </button>
              ))
            )}
          </main>
        </>
      )}

      <aside className="cart-summary">
        <h2>Seu Pedido</h2>
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item-card">
              <div className="cart-item-header">
                <span className="item-name">{item.name}</span>
                <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}>&times;</button>
              </div>
              
              <div className="cart-item-details">
                <div className="quantity-selector">
                  <button onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1}>-</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>
                <span className="item-price">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>

              <input 
                type="text"
                className="item-obs-input"
                placeholder="Observação (ex: sem cebola)"
                value={item.observation || ""}
                onChange={(e) => updateItemObservation(item.id, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="cart-footer">
          <div className="total">
            Total: R$ {cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}
          </div>
          <button 
            className="finish-btn" 
            disabled={cart.length === 0} 
            onClick={() => setStep('IDENTIFICATION')}
          >
            FINALIZAR
          </button>
          <button className="cancel-btn" onClick={() => { clearCart(); setStep('WELCOME'); }}>
            CANCELAR
          </button>
        </div>
      </aside>
    </div>
  );
}
