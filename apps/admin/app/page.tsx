"use client";

import { useState } from "react";
import "./page.css";

export default function AdminPage() {
  const [collapsed, setCollapsed] = useState(false);

  const stats = [
    {
      title: "Pedidos Hoje",
      value: "128",
      growth: "+12%",
    },
    {
      title: "Em Produção",
      value: "14",
      growth: "+4%",
    },
    {
      title: "Finalizados",
      value: "97",
      growth: "+18%",
    },
    {
      title: "Faturamento",
      value: "R$ 4.820",
      growth: "+22%",
    },
  ];

  const orders = [
    {
      id: "#1042",
      customer: "Mesa 04",
      items: "2x Smash Burger + Fritas",
      status: "Preparando",
      total: "R$ 58,90",
    },
    {
      id: "#1043",
      customer: "Totem 02",
      items: "3x Combo Chicken",
      status: "Pendente",
      total: "R$ 89,00",
    },
    {
      id: "#1044",
      customer: "Mesa 07",
      items: "Pizza + Refrigerante",
      status: "Pronto",
      total: "R$ 42,50",
    },
  ];

  const menuItems = [
    "Dashboard",
    "Pedidos",
    "Produtos",
    "Categorias",
    "Cupons",
    "Relatórios",
    "Configurações",
  ];

  return (
    <main className="admin-container">
      {/* SIDEBAR */}
      <aside
        className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="sidebar-top">
          {!collapsed && (
            <div>
              <h1 className="logo-title">NexOrder</h1>
              <p className="logo-subtitle">
                Painel Administrativo
              </p>
            </div>
          )}

          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item, index) => (
            <button
              key={item}
              className={`menu-item ${
                index === 0 ? "menu-item-active" : ""
              }`}
            >
              {collapsed ? item.charAt(0) : item}
            </button>
          ))}
        </nav>

        {!collapsed && (
          <div className="sidebar-status">
            <p className="status-label">
              Sistema Online
            </p>

            <div className="status-row">
              <div className="status-dot" />

              <span>
                Todos serviços operando
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* CONTENT */}
      <section
        className={`content ${
          collapsed ? "content-expanded" : ""
        }`}
      >
        {/* HEADER */}
        <div className="header">
          <div>
            <h2 className="page-title">
              Dashboard
            </h2>

            <p className="page-subtitle">
              Visão geral da operação em tempo real
            </p>
          </div>

          <button className="primary-button">
            + Novo Produto
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          {stats.map((item) => (
            <div
              key={item.title}
              className="stat-card"
            >
              <p className="stat-title">
                {item.title}
              </p>

              <h3 className="stat-value">
                {item.value}
              </h3>

              <span className="stat-growth">
                {item.growth}
              </span>
            </div>
          ))}
        </div>

        {/* ORDERS */}
        <div className="orders-card">
          <div className="orders-header">
            <div>
              <h3 className="orders-title">
                Pedidos Recentes
              </h3>

              <p className="orders-subtitle">
                Atualização automática em tempo real
              </p>
            </div>

            <button className="secondary-button">
              Atualizar
            </button>
          </div>

          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className="order-item"
              >
                <div>
                  <h4 className="order-id">
                    {order.id}
                  </h4>

                  <p className="order-customer">
                    {order.customer}
                  </p>

                  <span className="order-items">
                    {order.items}
                  </span>
                </div>

                <div className="order-actions">
                  <span
                    className={`status-badge ${
                      order.status === "Preparando"
                        ? "status-warning"
                        : order.status === "Pendente"
                        ? "status-danger"
                        : "status-success"
                    }`}
                  >
                    {order.status}
                  </span>

                  <strong className="order-total">
                    {order.total}
                  </strong>

                  <button className="view-button">
                    Ver Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}