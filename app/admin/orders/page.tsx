"use client";

import { useOrders } from "@/app/admin/orders/hooks/useOrders";
import { useProducts } from "@/app/admin/products/hooks/useProducts";
import { useCondiments } from "@/app/admin/condiments/hooks/useCondiments";
import OrderItem from "@/app/admin/orders/components/OrderItem";
import OrderForm from "@/app/admin/orders/components/OrderForm";
import Modal from "@/app/admin/components/Modal";
import { useState } from "react";
import "./page.css";

export default function OrdersPage() {
  const { orders, loading, addOrder, updateOrderStatus, removeOrder } = useOrders();
  const { products } = useProducts();
  const { condiments } = useCondiments();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statuses = [
    { id: "all", label: "Todos" },
    { id: "pending", label: "Pendentes" },
    { id: "paid", label: "Pagos" },
    { id: "preparing", label: "Em preparo" },
    { id: "ready", label: "Prontos" },
    { id: "delivering", label: "Em entrega" },
    { id: "finished", label: "Finalizados" },
    { id: "canceled", label: "Cancelados" },
  ];
  const getStatusCount = (statusId: string) => {
    if (statusId === "all") return orders.length;
    return orders.filter((order) => order.status === statusId).length;
  };
  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter(order => order.status === statusFilter);

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

      <div className="filters-container">
        {statuses.map((status) => {
          const count = getStatusCount(status.id);
          return (
            <button
              key={status.id}
              className={`filter-btn ${statusFilter === status.id ? "active" : ""}`}
              onClick={() => setStatusFilter(status.id)}
            >
              {status.label}
              {count > 0 && <span className="filter-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <section className="orders-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Sincronizando com a cozinha...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>{statusFilter === 'all' ? 'Nenhum pedido realizado hoje.' : 'Nenhum pedido com este status.'}</p>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <OrderItem 
                key={order.id} 
                order={order} 
                onStatusUpdate={(id, next) => updateOrderStatus(id, next)}
                onCancel={(id) => updateOrderStatus(id, 'cancelled')}
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
          condiments={condiments}
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
