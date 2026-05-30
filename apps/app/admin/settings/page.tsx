"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { Copy, Check, QrCode, ExternalLink, LogOut } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { firestore } from "@/src/services/firebase";
import "./page.css";

export default function ConfigurationsPage() {
  const { signOut, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [totemUrl, setTotemUrl] = useState("");

  useEffect(() => {
    if (user?.companyId && typeof window !== 'undefined') {
      const url = `${window.location.origin}/totem/${user.companyId}`;
      setTotemUrl(url);
    }
  }, [user]);

  const handleCopy = () => {
    if (!totemUrl) return;
    navigator.clipboard.writeText(totemUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="configurations-view">
      <header className="header">
        <div className="page-title-area">
          <h2 className="page-title">Configurações</h2>
          <p className="page-subtitle">Gerencie as preferências da sua conta e do sistema</p>
        </div>
      </header>

      <div className="settings-container">
        <div className="settings-card">
          <div className="totem-link-section">
            <header className="section-header">
              <QrCode size={20} className="section-icon" />
              <h3 className="section-title">Link do Totem</h3>
            </header>
            
            <div className="section-content">
              <p className="user-detail">Compartilhe este link com seus clientes ou abra em seus tablets:</p>
              
              <div className="link-copy-wrapper">
                <input 
                  type="text" 
                  readOnly 
                  value={totemUrl} 
                  className="totem-url-input"
                />
                <div className="link-actions">
                  <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copied ? "Copiado!" : "Copiar"}</span>
                  </button>
                  <a 
                    href={totemUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="totem-open-btn"
                  >
                    <ExternalLink size={18} />
                    <span>TOTEM</span>
                  </a>
                </div>
              </div>

              <div className="qr-code-area">
                <div className="qr-container">
                  {totemUrl ? (
                    <QRCodeCanvas 
                      value={totemUrl} 
                      size={160}
                      style={{ border: '8px solid #fff', borderRadius: '12px', width: '100%', height: 'auto', maxWidth: '160px' }}
                    />
                  ) : <p>Gerando QR Code...</p>}
                </div>
                <p className="qr-hint">Aponte a câmera para testar</p>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="user-profile-info">
            <h3 className="section-title">Minha Conta</h3>
            <p className="user-detail">Nome: <strong>{user?.name || "Administrador"}</strong></p>
            <p className="user-detail">E-mail: <strong>{user?.email}</strong></p>
          </div>

          <div className="settings-footer">
            <button className="logout-button" onClick={signOut}>
              <LogOut size={18} /> Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>

    
  );
}