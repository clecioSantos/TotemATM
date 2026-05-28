"use client";

import { use } from "react";

import { useTotem } from "@totem/hooks/useTotem";
// Como page.css está na raiz de apps/, usamos o alias @/
import "@/page.css";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default function TotemPage({ params }: PageProps) {
  // No Next.js 15, params é uma Promise que deve ser resolvida com 'use'
  const { companyId } = use(params);

  const { 
    products, 
    categories, 
    condiments,
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    finishOrder, 
    loading 
  } = useTotem(companyId);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">Carregando cardápio...</div>
      </div>
    );
  }

  return (
    <main className="totem-container">
      <header className="totem-header">
        <h1>Cardápio Digital</h1>
        <p>ID da Unidade: {companyId}</p>
      </header>

      {/* Renderize aqui a sua UI de Categorias e Produtos filtrados */}
      <section className="menu-section">
        {categories.map(category => (
          <div key={category.id}>
            <h2>{category.name}</h2>
            <div className="products-grid">
              {products
                .filter(p => p.categoryId === category.id)
                .map(product => (
                  <button key={product.id} onClick={() => addToCart(product)}>
                    {product.name} - R$ {product.price}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </section>

      {/* Exemplo de rodapé com carrinho */}
      {cart.length > 0 && (
        <footer className="totem-footer">
          <button onClick={() => finishOrder({})}>
            Finalizar Pedido ({cart.length} itens)
          </button>
        </footer>
      )}
    </main>
  );
}