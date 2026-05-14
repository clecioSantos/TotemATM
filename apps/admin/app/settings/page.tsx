"use client";

import { useAuth } from "../orders/AuthContext";
import "./page.css";

export default function ConfigurationsPage() {
  const { signOut, user } = useAuth();

  return (
    <div className="configurations-view">
      <header className="header">
        <div className="page-title-area">
          <h2 className="page-title">Configurações</h2>
          <p className="page-subtitle">Gerencie as preferências da sua conta e do sistema</p>
        </div>
      </header>

      <div className="settings-card">
        <div className="user-profile-info">
          <h3 className="section-title">Minha Conta</h3>
          <p className="user-detail">Nome: <strong>{user?.displayName || "Administrador"}</strong></p>
          <p className="user-detail">E-mail: <strong>{user?.email}</strong></p>
        </div>

        <div className="settings-footer">
          <button className="logout-button" onClick={signOut}>
            <span>🚪</span> Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}