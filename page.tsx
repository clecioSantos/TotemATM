"use client";

import React from "react";
import "./page.css";

export default function DashboardPage() {
  const stats = [
    { title: "Pedidos Hoje", value: "128", growth: "+12%" },
    { title: "Em Produção", value: "14", growth: "+4%" },
    { title: "Faturamento", value: "R$ 4.820", growth: "+22%" },
    { title: "Ticket Médio", value: "R$ 37,65", growth: "+5%" },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Bem-vindo ao NexOrder Admin</p>
        </div>
      </header>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.title} className="stat-card">
            <span className="stat-title">{stat.title}</span>
            <div className="stat-value-container">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-growth">{stat.growth}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="recent-orders-card">
        <header className="card-header">
          <h2>Pedidos Recentes</h2>
        </header>
        <p className="empty-text">Nenhum pedido recente para exibir.</p>
      </div>
    </div>
  );
}