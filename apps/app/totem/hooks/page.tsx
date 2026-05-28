"use client";

import React from "react";
import { useCompanies } from "../hooks/useCompanies";
import { useRouter } from "next/navigation";
import "./page.css";

export default function SelectCompanyPage() {
  const { companies, loading } = useCompanies();
  const router = useRouter();

  const handleSelect = (companyId: string) => {
    // Ao selecionar, navegamos para a rota do totem específica
    router.push(`/totem/${companyId}`);
  };

  return (
    <div className="select-company-view">
      <header className="selection-header">
        <h1>Bem-vindo!</h1>
        <p>Selecione a unidade que deseja acessar</p>
      </header>

      <main className="selection-content">
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
            <p>Buscando unidades disponíveis...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="empty-selection">
            <p>Nenhuma unidade encontrada.</p>
          </div>
        ) : (
          <div className="company-list">
            {companies.map((company) => (
              <button
                key={company.id}
                className="company-item"
                onClick={() => handleSelect(company.id)}
              >
                <span className="company-name">{company.name}</span>
                <span className="arrow">→</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}