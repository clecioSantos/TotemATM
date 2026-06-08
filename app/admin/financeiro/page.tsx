"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { firestore } from "@/src/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Wallet, CheckCircle, AlertTriangle, Loader2, ExternalLink, Unlink } from "lucide-react";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { useRouter, useSearchParams } from "next/navigation";
import "./page.css";

function FinanceiroContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error === "oauth_invalid") {
      setNotification({ type: "error", message: "Código de autorização inválido. Tente novamente." });
    } else if (error === "oauth_invalid_state") {
      setNotification({ type: "error", message: "State inválido. Tente conectar novamente." });
    } else if (error === "oauth_token_exchange") {
      setNotification({ type: "error", message: "Erro ao obter token de acesso. Tente novamente." });
    } else if (error === "oauth_internal") {
      setNotification({ type: "error", message: "Erro interno ao conectar. Tente novamente." });
    } else if (success === "connected") {
      setNotification({ type: "success", message: "Conta Mercado Pago conectada com sucesso!" });
    }

    if (error || success) {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.companyId || user.companyId === "default") return;

    const fetchData = async () => {
      try {
        const companyRef = doc(firestore, "companies", user.companyId!);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          setCompanyData(companySnap.data());
        }
      } catch (error) {
        console.error("Erro ao carregar dados da empresa:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.companyId]);

  const handleConnect = useCallback(async () => {
    if (!user?.companyId || !user?.uid) return;
    setConnecting(true);

    try {
      const response = await fetch(
        `/api/mercadopago/oauth/connect?companyId=${user.companyId}&userId=${user.uid}`
      );
      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setNotification({ type: "error", message: data.error || "Erro ao conectar." });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Erro ao conectar com Mercado Pago." });
    } finally {
      setConnecting(false);
    }
  }, [user?.companyId, user?.uid]);

  const handleDisconnect = useCallback(async () => {
    if (!user?.companyId) return;

    const confirmed = window.confirm("Tem certeza que deseja desconectar sua conta Mercado Pago?");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/mercadopago/oauth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: user.companyId }),
      });
      const data = await response.json();

      if (data.success) {
        setCompanyData((prev: any) => ({
          ...prev,
          mercadopago_connected: false,
          mercadopago_user_id: null,
          mercadopago_connected_at: null,
        }));
        setNotification({ type: "success", message: "Conta Mercado Pago desconectada." });
      } else {
        setNotification({ type: "error", message: data.error || "Erro ao desconectar." });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Erro ao desconectar conta." });
    }
  }, [user?.companyId]);

  const formatDate = (date: any) => {
    if (!date) return "-";
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString("pt-BR");
  };

  const isConnected = companyData?.mercadopago_connected === true;

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 size={24} className="spin" />
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Configure o recebimento PIX via Mercado Pago</p>
        </div>
      </header>

      {notification && (
        <div className={`notification-banner ${notification.type === "success" ? "notification-success" : "notification-error"}`}>
          {notification.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{notification.message}</span>
          <button className="notification-close" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <div className="financeiro-card">
        <div className="financeiro-header">
          <Wallet size={24} className="financeiro-icon" />
          <h2 className="financeiro-title">Mercado Pago</h2>
        </div>

        {!isConnected ? (
          <div className="financeiro-disconnected">
            <div className="financeiro-status">
              <AlertTriangle size={20} className="text-yellow-500" />
              <span>Mercado Pago não conectado</span>
            </div>
            <p className="financeiro-description">
              Receba pagamentos PIX diretamente na sua conta Mercado Pago.
            </p>
            <button
              className="financeiro-connect-btn"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <><Loader2 size={18} className="spin" /> Conectando...</>
              ) : (
                <><ExternalLink size={18} /> Conectar Mercado Pago</>
              )}
            </button>
          </div>
        ) : (
          <div className="financeiro-connected">
            <div className="financeiro-status">
              <CheckCircle size={20} className="text-green-600" />
              <span className="financeiro-status-text connected">Mercado Pago conectado</span>
            </div>

            <div className="financeiro-info">
              <div className="financeiro-info-row">
                <span className="financeiro-info-label">ID da Conta:</span>
                <span className="financeiro-info-value">{companyData?.mercadopago_user_id || "-"}</span>
              </div>
              <div className="financeiro-info-row">
                <span className="financeiro-info-label">Conectado em:</span>
                <span className="financeiro-info-value">{formatDate(companyData?.mercadopago_connected_at)}</span>
              </div>
            </div>

            <div className="financeiro-actions">
              <button
                className="financeiro-reconnect-btn"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? <Loader2 size={16} className="spin" /> : <ExternalLink size={16} />}
                Reconectar Conta
              </button>
              <button
                className="financeiro-disconnect-btn"
                onClick={handleDisconnect}
              >
                <Unlink size={16} />
                Desconectar Conta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <ErrorBoundary context="FinanceiroPage">
      <Suspense fallback={
        <div className="condiments-page-container">
          <div className="loading-container">
            <Loader2 size={24} className="spin" />
            <p>Carregando...</p>
          </div>
        </div>
      }>
        <FinanceiroContent />
      </Suspense>
    </ErrorBoundary>
  );
}
