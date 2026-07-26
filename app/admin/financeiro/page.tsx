"use client";

import { useEffect, useState, useCallback } from "react";
import { firestore, auth } from "@/src/services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Wallet, Plug, PlugZap, Loader, ExternalLink, RefreshCw, TrendingUp, DollarSign, Percent, CreditCard, Banknote, Receipt, ChevronDown, ChevronUp, Calendar } from "lucide-react";
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

  const handleConnect = () => {
    if (!companyId) return;
    window.location.href = `/api/mercadopago/oauth/connect?companyId=${companyId}&userId=${companyId}&direct=1`;
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

  const [extractPeriod, setExtractPeriod] = useState("day");
  const [extractData, setExtractData] = useState<any>(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractExpanded, setExtractExpanded] = useState<Record<string, boolean>>({});

  const loadExtract = useCallback(async () => {
    if (!companyId) return;
    setExtractLoading(true);
    try {
      const res = await fetch(`/api/financeiro/extract?companyId=${companyId}&period=${extractPeriod}`);
      const data = await res.json();
      if (data.success) setExtractData(data);
    } catch { } finally { setExtractLoading(false); }
  }, [companyId, extractPeriod]);

  useEffect(() => {
    if (companyId) loadExtract();
  }, [companyId, loadExtract]);

  const account = company?.mercadopago_account;
  const displayName =
    [account?.mpFirstName, account?.mpLastName].filter(Boolean).join(" ").trim()
    || account?.mpNickname
    || account?.mpEmail
    || "";

  if (loading) {
    return (
      <div className="condiments-page-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  const isConnected = company?.mercadopago_connected === true;

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Gerencie a integração com o Mercado Pago</p>
        </div>
      </header>

      <main className="page-content">

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
      {/* Extrato Financeiro */}
      {companyId && (
        <div className="extrato-card">
          <div className="extrato-header">
            <h2><Receipt size={20} /> Extrato Financeiro</h2>
            <div className="extrato-filters">
              {[
                { key: "day", label: "Dia" },
                { key: "week", label: "Semana" },
                { key: "month", label: "Mês" },
                { key: "year", label: "Ano" },
                { key: "all", label: "Total" },
              ].map((opt) => (
                <button key={opt.key}
                  className={`extrato-filter-btn ${extractPeriod === opt.key ? "active" : ""}`}
                  onClick={() => setExtractPeriod(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
              <button className="extrato-refresh" onClick={loadExtract} disabled={extractLoading}>
                <RefreshCw size={14} className={extractLoading ? "spin" : ""} />
              </button>
            </div>
          </div>

          {extractLoading ? (
            <div className="extrato-loading"><Loader size={24} className="spin" /></div>
          ) : extractData ? (
            <>
              <div className="extrato-summary">
                <div className="summary-item">
                  <span className="summary-label"><TrendingUp size={14} /> Recebido</span>
                  <span className="summary-value">R$ {extractData.summary.totalReceived.toFixed(2)}</span>
                </div>
                  <div className="summary-item">
                    <span className="summary-label"><CreditCard size={14} />Comissão + Taxas ({extractData.summary.commissionPercent}%)</span>
                    <span className="summary-value negative">R$ {(extractData.summary.totalBoraCommission + extractData.summary.totalMethodFees).toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                  <span className="summary-label"><DollarSign size={14} /> Conveniência</span>
                  <span className="summary-value negative">R$ {extractData.summary.totalConvenienceFees.toFixed(2)}</span>
                </div>
                <div className="summary-item total">
                  <span className="summary-label"><Banknote size={14} /> Líquido p/ Loja</span>
                  <span className="summary-value positive">R$ {extractData.summary.totalStoreNet.toFixed(2)}</span>
                </div>
              </div>

              <div className="extrato-table">
                <div className="extrato-table-header">
                  <span>Data</span>
                  <span>Cliente</span>
                  <span>Pagamento</span>
                  <span>Total</span>
                  <span>Comissão</span>
                  <span>Líquido</span>
                  <span />
                </div>
                {extractData.orders.length === 0 ? (
                  <div className="extrato-empty">Nenhum pedido no período.</div>
                ) : extractData.orders.map((order: any) => {
                  const expanded = extractExpanded[order.id];
                  return (
                    <div key={order.id} className={`extrato-row ${expanded ? "expanded" : ""}`}>
                      <div className="extrato-row-main" onClick={() => setExtractExpanded(p => ({ ...p, [order.id]: !expanded }))}>
                        <span className="extrato-date">{new Date(order.paidAt || order.createdAt).toLocaleDateString("pt-BR")}</span>
                        <span className="extrato-customer">{order.customerName}</span>
                        <span className={`extrato-method ${order.paymentMethod === "PIX" ? "pix" : "card"}`}>
                          {order.paymentMethod === "PIX" ? "💠 PIX" : "💳 Cartão"}
                        </span>
                        <span className="extrato-total">R$ {order.total.toFixed(2)}</span>
                        <span className="extrato-commission">R$ {order.boraShare.toFixed(2)}</span>
                        <span className="extrato-net">R$ {order.storeNet.toFixed(2)}</span>
                        <span className="extrato-expand">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                      </div>
                      {expanded && (
                        <div className="extrato-details">
                          <div className="detail-item"><span>Pedido</span><span>#{order.id.slice(-6).toUpperCase()}</span></div>
                          <div className="detail-item"><span>Valor Bruto</span><span>R$ {order.total.toFixed(2)}</span></div>
                          <div className="detail-item"><span>Comissão + Taxas</span><span className="negative">-R$ {(order.methodFee + order.commissionBase + (order.couponDiscount || 0)).toFixed(2)}</span></div>
                          {order.couponDiscount > 0 && (
                            <div className="detail-item"><span>Desconto Cupom (Owner)</span><span className="positive">+R$ {order.couponDiscount.toFixed(2)}</span></div>
                          )}
                          <div className="detail-item"><span>Taxa de Conveniência</span><span className="negative">-R$ {order.convenienceFee.toFixed(2)}</span></div>
                          <div className="detail-item total"><span>Líquido</span><span className="positive">R$ {order.storeNet.toFixed(2)}</span></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      )}

      </main>

      <HelpModal helpId={helpModal || ""} open={!!helpModal} onClose={() => setHelpModal(null)} />
    </div>
  );
}
