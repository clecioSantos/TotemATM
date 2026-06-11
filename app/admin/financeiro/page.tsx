"use client";

import { useEffect, useState } from "react";
import { firestore, auth } from "@/src/services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Wallet, Plug, PlugZap, Loader, ExternalLink } from "lucide-react";
import HelpTooltip from "../components/HelpTooltip";
import HelpModal from "../components/HelpModal";
import "./page.css";

export default function FinanceiroPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [helpModal, setHelpModal] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const unsubUser = onSnapshot(userDocRef, (userSnap) => {
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const cid = userData.companyId;
            if (cid) {
              setCompanyId(cid);
              const companyRef = doc(firestore, "companies", cid);
              const unsubCompany = onSnapshot(companyRef, (compSnap) => {
                if (compSnap.exists()) {
                  setCompany(compSnap.data());
                }
                setLoading(false);
              });
              return () => unsubCompany();
            }
          }
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleConnect = async () => {
    if (!companyId) return;
    setConnecting(true);
    try {
      const params = new URLSearchParams({ companyId, userId: companyId });
      const res = await fetch(`/api/mercadopago/oauth/connect?${params.toString()}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro ao conectar com Mercado Pago.");
      }
    } catch (err) {
      console.error("Erro ao conectar:", err);
      alert("Erro ao conectar com Mercado Pago.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!companyId) return;
    if (!confirm("Tem certeza que deseja desconectar o Mercado Pago?")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/mercadopago/oauth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      if (res.ok) {
        setCompany((prev: any) => ({
          ...prev,
          mercadopago_connected: false,
          mercadopago_user_id: null,
          mercadopago_access_token: null,
          mercadopago_refresh_token: null,
          mercadopago_token_expires_at: null,
          mercadopago_connected_at: null,
        }));
      } else {
        alert("Erro ao desconectar.");
      }
    } catch (err) {
      console.error("Erro ao desconectar:", err);
      alert("Erro ao desconectar.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="financeiro-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  const isConnected = company?.mercadopago_connected === true;

  return (
    <div className="financeiro-container">
      <div className="financeiro-header">
        <h1>Financeiro</h1>
        <Wallet size={24} color="#64748b" />
      </div>

      <div className="connection-card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>
          Mercado Pago
          <HelpTooltip helpId="mercadopago" />
          <button
            className="help-saiba-mais"
            onClick={() => setHelpModal("mercadopago")}
            aria-label="Saiba mais sobre Mercado Pago"
          >
            <ExternalLink size={12} />
            <span>Saiba mais</span>
          </button>
        </h2>

        <div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
          <div className="connection-status-icon">
            {isConnected ? <PlugZap size={16} /> : <Plug size={16} />}
          </div>
          <span>
            {isConnected ? "Conectado ao Mercado Pago" : "Não conectado ao Mercado Pago"}
          </span>
        </div>

        {isConnected && (
          <div className="connection-info">
            <div className="info-item">
              <div className="info-label">Conta</div>
              <div className="info-value">{company.mercadopago_user_id || "-"}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Conectado em</div>
              <div className="info-value">
                {company.mercadopago_connected_at
                  ? new Date(company.mercadopago_connected_at.seconds * 1000).toLocaleDateString()
                  : "-"}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">
                Comissão da Plataforma
                <HelpTooltip helpId="taxas" />
                <button
                  className="help-saiba-mais"
                  onClick={() => setHelpModal("taxas")}
                  aria-label="Saiba mais sobre a taxa da plataforma"
                >
                  <ExternalLink size={12} />
                  <span>Saiba mais</span>
                </button>
              </div>
              <div className="info-value">{company.platform_commission_percent ?? 6}%</div>
            </div>
            <div className="info-item">
              <div className="info-label">Loja Ativa</div>
              <div className="info-value">{company.enabled !== false ? "Sim" : "Não"}</div>
            </div>
          </div>
        )}

        <div className="connection-actions">
          {!isConnected ? (
            <button className="btn-connect" onClick={handleConnect} disabled={connecting}>
              {connecting ? <Loader size={16} className="loading-spinner" /> : <PlugZap size={16} />}
              {connecting ? "Conectando..." : "Conectar Mercado Pago"}
            </button>
          ) : (
            <button className="btn-disconnect" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? <Loader size={16} className="loading-spinner" /> : <Plug size={16} />}
              {disconnecting ? "Desconectando..." : "Desconectar"}
            </button>
          )}
        </div>
      </div>
      <HelpModal helpId={helpModal || ""} open={!!helpModal} onClose={() => setHelpModal(null)} />
    </div>
  );
}
