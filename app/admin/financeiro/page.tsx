"use client";

import { useEffect, useState } from "react";
import { firestore, auth } from "@/src/services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Wallet, Plug, PlugZap, Loader, ExternalLink, RefreshCw } from "lucide-react";
import { useConfirm } from "@/app/components/ConfirmProvider";
import HelpTooltip from "../components/HelpTooltip";
import HelpModal from "../components/HelpModal";
import "./page.css";

export default function FinanceiroPage() {
  const { showAlert, showConfirm } = useConfirm();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
        await showAlert("Erro ao conectar com Mercado Pago.");
      }
    } catch (err) {
      console.error("Erro ao conectar:", err);
      await showAlert("Erro ao conectar com Mercado Pago.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!companyId) return;
    if (!await showConfirm("Tem certeza que deseja desconectar o Mercado Pago?")) return;
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
          mercadopago_account: null,
        }));
      } else {
        await showAlert("Erro ao desconectar.");
      }
    } catch (err) {
      console.error("Erro ao desconectar:", err);
      await showAlert("Erro ao desconectar.");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRefresh = async () => {
    if (!companyId) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/mercadopago/oauth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        await showAlert(errData.error || "Não foi possível atualizar os dados da conta Mercado Pago.");
      }
    } catch (err) {
      console.error("Erro ao atualizar:", err);
      await showAlert("Não foi possível atualizar os dados da conta Mercado Pago.");
    } finally {
      setRefreshing(false);
    }
  };

  const account = company?.mercadopago_account;
  const displayName =
    [account?.mpFirstName, account?.mpLastName].filter(Boolean).join(" ").trim()
    || account?.mpNickname
    || account?.mpEmail
    || "";

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
            {isConnected ? "Conta Mercado Pago conectada" : "Nenhuma conta Mercado Pago conectada"}
          </span>
        </div>

        {isConnected && account && (
          <div className="connection-info" style={{ marginTop: 16 }}>
            <div className="info-item" style={{ gridColumn: "1 / -1" }}>
              <div className="info-label">Nome</div>
              <div className="info-value" style={{ fontSize: 15, fontWeight: 600 }}>{displayName}</div>
            </div>
            <div className="info-item">
              <div className="info-label">E-mail</div>
              <div className="info-value">{account.mpEmail || "-"}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Nickname</div>
              <div className="info-value">{account.mpNickname || "-"}</div>
            </div>
            <div className="info-item">
              <div className="info-label">ID da Conta</div>
              <div className="info-value">{account.mpUserId || "-"}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Conectada em</div>
              <div className="info-value">
                {account.mpConnectedAt
                  ? new Date(
                      account.mpConnectedAt.seconds
                        ? account.mpConnectedAt.seconds * 1000
                        : account.mpConnectedAt
                    ).toLocaleString("pt-BR")
                  : company.mercadopago_connected_at
                  ? new Date(
                      company.mercadopago_connected_at.seconds * 1000
                    ).toLocaleString("pt-BR")
                  : "-"}
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", gridColumn: "1 / -1", marginTop: 4 }}>
              Esta é a conta que receberá os pagamentos PIX, débito e crédito da loja.
            </p>
          </div>
        )}

        {isConnected && !account && (
          <div className="connection-info" style={{ marginTop: 16 }}>
            <div className="info-item">
              <div className="info-label">Conta</div>
              <div className="info-value">{company.mercadopago_user_id || "-"}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Conectado em</div>
              <div className="info-value">
                {company.mercadopago_connected_at
                  ? new Date(company.mercadopago_connected_at.seconds * 1000).toLocaleString("pt-BR")
                  : "-"}
              </div>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="connection-info" style={{ marginTop: 16 }}>
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
            <>
              <button className="btn-connect" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader size={16} className="loading-spinner" /> : <RefreshCw size={16} />}
                {refreshing ? "Atualizando..." : "Atualizar dados da conta"}
              </button>
              <button className="btn-disconnect" onClick={handleDisconnect} disabled={disconnecting}>
                {disconnecting ? <Loader size={16} className="loading-spinner" /> : <Plug size={16} />}
                {disconnecting ? "Desconectando..." : "Desconectar"}
              </button>
            </>
          )}
        </div>
      </div>
      <HelpModal helpId={helpModal || ""} open={!!helpModal} onClose={() => setHelpModal(null)} />
    </div>
  );
}
