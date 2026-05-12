"use client";

import { useOrders } from "./hooks/useOrders";
import { useProducts } from "../products/hooks/useProducts";
import OrderItem from "./components/OrderItem";
import OrderForm from "./components/OrderForm";
import Modal from "../components/Modal";
import { useState } from "react";
import "./page.css";

export default function OrdersPage() {
  const { orders, loading, addOrder, updateOrderStatus } = useOrders();
  const { products } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="orders-page-view">
      <header className="page-header">
        <div className="page-title-area">
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">Acompanhe e gerencie a fila de produção em tempo real</p>
        </div>
        <button className="primary-button" onClick={() => setIsModalOpen(true)}>
          <span>➕</span> Novo Pedido
        </button>
      </header>

      <section className="orders-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Sincronizando com a cozinha...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum pedido realizado hoje.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <OrderItem 
                key={order.id} 
                order={order} 
                onStatusUpdate={(id, next) => updateOrderStatus(id, next)}
              />
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Pedido Manual"
      >
        <OrderForm
          products={products}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
            await addOrder(data);
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
