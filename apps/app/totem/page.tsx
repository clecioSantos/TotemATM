"use client";

import React from "react";
import { useCompanies } from "./hooks/useCompanies";
import { useRouter } from "next/navigation";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { LogOut, Store, ChevronRight } from "lucide-react";
import "./page.css";

export default function SelectCompanyPage() {
  const { companies, loading } = useCompanies();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSelect = (companyId: string) => {
    router.push(`/totem/${companyId}`);
  };

  return (
    <div className="select-company-screen">
      {/* Background texture overlay */}
      <div
        className="select-company-bg-overlay"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop')",
        }}
      />

      {/* User menu - top right */}
      {user && (
        <div className="select-company-user-bar">
          <span className="select-company-user-name">
            Olá, {user.name || "Usuário"}
          </span>
          <button
            className="select-company-logout-btn"
            onClick={() => signOut()}
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="select-company-header">
        <span className="select-company-label">NexOrder</span>
        <h1 className="select-company-title">Escolha a Loja</h1>
        <p className="select-company-subtitle">
          Selecione a unidade para fazer seu pedido
        </p>
      </header>

      {/* Company list */}
      <main className="select-company-content">
        {loading ? (
          <div className="select-company-loader-wrapper">
            <div className="select-company-spinner" />
            <p className="select-company-loader-text">
              Buscando unidades disponíveis...
            </p>
          </div>
        ) : companies.length === 0 ? (
          <div className="select-company-empty">
            <Store size={48} strokeWidth={1.5} />
            <p>Nenhuma unidade encontrada.</p>
          </div>
        ) : (
          <div className="select-company-grid">
            {companies.map((company, index) => (
              <button
                key={company.id}
                className="select-company-card"
                onClick={() => handleSelect(company.id)}
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="select-company-card-icon">
                  <Store size={28} strokeWidth={1.8} />
                </div>
                <div className="select-company-card-info">
                  <span className="select-company-card-name">
                    {company.name}
                  </span>
                  <span className="select-company-card-action">
                    Acessar cardápio
                  </span>
                </div>
                <ChevronRight
                  size={22}
                  className="select-company-card-arrow"
                />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="select-company-footer">
        <p>Toque em uma unidade para começar</p>
      </footer>
    </div>
  );
}