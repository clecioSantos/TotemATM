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

  const categories = [
    { name: "Lanches", icon: "🍔" },
    { name: "Pizza", icon: "🍕" },
    { name: "Japonês", icon: "🍣" },
    { name: "Doces", icon: "🍰" },
    { name: "Mercado", icon: "🛒" },
  ];

  return (
    <div className="dashboard-container">
      {/* Veloce-style top header */}
      <header className="delivery-header">
        <div className="header-top">
          <div className="logo-area">
            <div className="logo-icon">
              <span className="logo-letter">B</span>
            </div>
            <span className="logo-text">Bora De Delivery</span>
          </div>
          <div className="header-actions">
            <button className="header-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <button className="header-btn profile-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
            </button>
          </div>
        </div>

        <div className="location-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="location-text">R. das Flores, 123</span>
          <svg className="location-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <div className="search-area">
          <div className="city-selector">
            <select className="city-select" defaultValue="">
              <option value="" disabled>Cidade</option>
              <option value="sp">São Paulo</option>
              <option value="rj">Rio de Janeiro</option>
              <option value="bh">Belo Horizonte</option>
            </select>
          </div>
          <div className="search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar restaurantes ou pratos"
            />
          </div>
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

      <div className="categories-row">
        {categories.map((cat, i) => (
          <div key={i} className="cat-item">
            <div className="cat-icon">{cat.icon}</div>
            <span className="cat-label">{cat.name}</span>
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
