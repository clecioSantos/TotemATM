"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, limit, Timestamp, where, doc, getDocs, updateDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useAuth } from "@totem/shared/types/AuthProvider";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  TrendingUp, TrendingDown, Clock, ShoppingBag, DollarSign, Users,
  UtensilsCrossed, Package, AlertTriangle, Store, CheckCircle2, XCircle,
  Truck, Landmark, CreditCard, Wallet, RefreshCw, Loader2, Power
} from "lucide-react";
import "./page.css";

// ─── Helpers ───────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const fmtNumber = (v: number) =>
  new Intl.NumberFormat("pt-BR").format(v || 0);

const fmtPercent = (v: number) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const startOfDay = (d = new Date()) => {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
};

const endOfDay = (d = new Date()) => {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
};

const startOfWeek = (d = new Date()) => {
  const s = new Date(d);
  const day = s.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  s.setDate(s.getDate() + diff);
  s.setHours(0, 0, 0, 0);
  return s;
};

const endOfWeek = (d = new Date()) => {
  const e = new Date(startOfWeek(d));
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
};

const toDate = (ts: any): Date => {
  if (!ts) return new Date(0);
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
};

const isToday = (ts: any) => {
  const d = toDate(ts);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
};

const isStoreOpen = (horario: any, manualOverride?: boolean | null): boolean => {
  if (manualOverride === false) return false;
  if (manualOverride === true) return true;
  if (!horario) return false;
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const hoje = dias[new Date().getDay()];
  const hj = horario[hoje];
  if (!hj || !hj.open || !hj.close) return false;
  const now = new Date();
  const curr = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = hj.open.split(":").map(Number);
  const [ch, cm] = hj.close.split(":").map(Number);
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  if (close <= open) return curr >= open || curr < close;
  return curr >= open && curr < close;
};

const timeSince = (ts: any): string => {
  const diff = Date.now() - toDate(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h${mins % 60}min`;
};

const countPaid = (orders: any[]) =>
  orders.filter(o => o.status !== "pending" && o.status !== "cancelled" && o.status !== "canceled").length;

const revenueFrom = (orders: any[]) =>
  orders
    .filter(o => o.status !== "pending" && o.status !== "cancelled" && o.status !== "canceled")
    .reduce((s, o) => s + (o.total || 0), 0);

// ─── Section Components ────────────────────────────────────────────────────

function AlertBanner({ alerts }: { alerts: { icon: any; text: string; type: string }[] }) {
  if (!alerts.length) return null;
  return (
    <div className="alert-banner">
      {alerts.map((a, i) => (
        <div key={i} className={`alert-item alert-${a.type}`}>
          <a.icon size={16} />
          <span>{a.text}</span>
        </div>
      ))}
    </div>
  );
}

function StoreHeader({ company, ordersToday, onToggleOpen }: { company: any; ordersToday: any[]; onToggleOpen?: () => void }) {
  const open = isStoreOpen(company?.horario, company?.open);
  const paid = ordersToday.filter(o => o.status === "paid" || o.status === "preparing" || o.status === "ready" || o.status === "delivering" || o.status === "finished").length;
  const pending = ordersToday.filter(o => o.status === "pending").length;

  return (
    <header className="dashboard-header">
      <div className="store-badge">
        {company?.logo ? (
          <img src={company.logo} alt={company.name} className="store-logo" />
        ) : (
          <div className="store-logo-placeholder"><Store size={24} /></div>
        )}
        <div>
          <h1 className="store-name">{company?.name || "Carregando..."}</h1>
          <div className="store-meta">
            <span className={`status-dot ${open ? "open" : "closed"}`} />
            <span className="status-text">{open ? "Aberta" : "Fechada"}</span>
            <span className="meta-sep">·</span>
            <span className="meta-orders">{paid} em andamento</span>
            {pending > 0 && (
              <><span className="meta-sep">·</span><span className="meta-pending">{pending} novo(s)</span></>
            )}
          </div>
        </div>
      </div>
      <button onClick={onToggleOpen} className={`toggle-store-btn ${open ? "close" : "open"}`}>
        <Power size={18} />
        <span>{open ? "Fechar Loja" : "Abrir Loja"}</span>
      </button>
    </header>
  );
}

function KpiCard({ title, value, subtitle, trend, icon: Icon, trendUp = true }: any) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon"><Icon size={18} /></div>
      </div>
      <div className="kpi-value">{value}</div>
      {subtitle && (
        <div className="kpi-footer">
          {trend !== undefined && (
            <span className={`kpi-trend ${trend >= 0 ? "up" : "down"}`}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {fmtPercent(trend)}
            </span>
          )}
          <span className="kpi-subtitle">{subtitle}</span>
        </div>
      )}
    </div>
  );
}

function StatusPanel({ orders }: { orders: any[] }) {
  const groups = [
    { key: "pending", label: "Novos", color: "var(--warning)" },
    { key: "preparing", label: "Em Preparo", color: "var(--info)" },
    { key: "ready", label: "Prontos", color: "var(--success)" },
    { key: "delivering", label: "Em Entrega", color: "var(--primary)" },
    { key: "finished", label: "Finalizados", color: "var(--text-muted)" },
  ];

  const counts = groups.reduce((acc, g) => {
    acc[g.key] = orders.filter(o => o.status === g.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="status-panel">
      <h3 className="section-title-sm">Pedidos em Tempo Real</h3>
      <div className="status-grid">
        {groups.map(g => (
          <div key={g.key} className="status-item" style={{ borderLeftColor: g.color }}>
            <span className="status-count">{counts[g.key]}</span>
            <span className="status-label">{g.label}</span>
            <div className="status-bar" style={{ width: `${Math.min((counts[g.key] / Math.max(1, Math.max(...Object.values(counts)))) * 100, 100)}%`, background: g.color }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesChart({ orders }: { orders: any[] }) {
  const hourly = useMemo(() => {
    const bins: Record<number, { orders: number; revenue: number }> = {};
    for (let i = 0; i < 24; i++) bins[i] = { orders: 0, revenue: 0 };
    orders
      .filter(o => o.status !== "cancelled" && o.status !== "canceled")
      .forEach(o => {
        const h = toDate(o.createdAt).getHours();
        bins[h].orders++;
        bins[h].revenue += o.total || 0;
      });
    return Array.from({ length: 24 }, (_, i) => ({
      hora: `${String(i).padStart(2, "0")}h`,
      pedidos: bins[i].orders,
      faturamento: Math.round(bins[i].revenue * 100) / 100,
    }));
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="section-title-sm">Vendas do Dia</h3>
        <div className="chart-empty">Nenhum pedido hoje</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h3 className="section-title-sm">Vendas do Dia</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={hourly}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffbc0d" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ffbc0d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="hora" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={2} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <RechartsTooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            formatter={(v: any, n: string) => [n === "faturamento" ? fmtCurrency(v) : v, n === "faturamento" ? "Faturamento" : "Pedidos"]}
          />
          <Area type="monotone" dataKey="faturamento" stroke="#ffbc0d" fill="url(#revGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopProducts({ orders }: { orders: any[] }) {
  const byQty = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    orders
      .filter(o => o.status !== "cancelled" && o.status !== "canceled")
      .forEach(o => (o.items || []).forEach((it: any) => {
        const key = it.productId || it.name;
        const existing = map.get(key);
        const itemTotal = (it.price || 0) * (it.quantity || 0);
        if (existing) {
          existing.qty += it.quantity || 0;
          existing.revenue += itemTotal;
        } else {
          map.set(key, { name: it.name || "Item", qty: it.quantity || 0, revenue: itemTotal });
        }
      }));
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [orders]);

  const byRevenue = useMemo(() =>
    [...byQty].sort((a, b) => b.revenue - a.revenue),
    [byQty]
  );

  if (!byQty.length) return null;

  return (
    <div className="products-panel">
      <div className="product-list-card">
        <h3 className="section-title-sm">Produtos Mais Vendidos</h3>
        <div className="product-list">
          {byQty.map((p, i) => (
            <div key={i} className="product-row">
              <span className="product-rank">#{i + 1}</span>
              <span className="product-name">{p.name}</span>
              <span className="product-qty">{fmtNumber(p.qty)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="product-list-card">
        <h3 className="section-title-sm">Maior Faturamento</h3>
        <div className="product-list">
          {byRevenue.map((p, i) => (
            <div key={i} className="product-row">
              <span className="product-rank">#{i + 1}</span>
              <span className="product-name">{p.name}</span>
              <span className="product-revenue">{fmtCurrency(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClientMetrics({ orders, allUserIds }: { orders: any[]; allUserIds: Set<string> }) {
  const { newClients, returning, rate } = useMemo(() => {
    const todayUids = new Set(orders.filter(o => o.customerId).map(o => o.customerId));
    const returningUids = new Set([...todayUids].filter(uid => !allUserIds.has(uid)));
    const newUids = new Set([...todayUids].filter(uid => allUserIds.has(uid)));
    const tc = todayUids.size;
    const nc = newUids.size;
    const rc = returningUids.size;
    return {
      newClients: nc,
      returning: rc,
      rate: tc > 0 ? (rc / tc) * 100 : 0,
    };
  }, [orders, allUserIds]);

  if (!newClients && !returning) return null;

  return (
    <div className="client-metrics">
      <h3 className="section-title-sm">Clientes</h3>
      <div className="client-grid">
        <div className="client-stat">
          <span className="client-stat-value">{fmtNumber(newClients)}</span>
          <span className="client-stat-label">Novos</span>
        </div>
        <div className="client-stat">
          <span className="client-stat-value">{fmtNumber(returning)}</span>
          <span className="client-stat-label">Recorrentes</span>
        </div>
        <div className="client-stat">
          <span className="client-stat-value">{rate.toFixed(0)}%</span>
          <span className="client-stat-label">Taxa de Retorno</span>
        </div>
      </div>
    </div>
  );
}

function DeliveryMetrics({ orders }: { orders: any[] }) {
  const deliveries = useMemo(() => {
    const d = orders.filter(o => (o.deliveryFee || 0) > 0 && o.status !== "cancelled" && o.status !== "canceled");
    if (!d.length) return null;
    const neighborhoods = d.map(o => o.address?.neighborhood).filter(Boolean);
    const nbCount = new Map<string, number>();
    neighborhoods.forEach(n => nbCount.set(n, (nbCount.get(n) || 0) + 1));
    const topNb = [...nbCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const totalFee = d.reduce((s, o) => s + (o.deliveryFee || 0), 0);
    const avgFee = totalFee / d.length;
    return { count: d.length, avgFee, topNb: topNb?.[0] || "—", topNbCount: topNb?.[1] || 0 };
  }, [orders]);

  if (!deliveries) return null;

  return (
    <div className="delivery-metrics">
      <h3 className="section-title-sm"><Truck size={16} /> Entregas</h3>
      <div className="client-grid">
        <div className="client-stat">
          <span className="client-stat-value">{fmtNumber(deliveries.count)}</span>
          <span className="client-stat-label">Entregas</span>
        </div>
        <div className="client-stat">
          <span className="client-stat-value">{fmtCurrency(deliveries.avgFee)}</span>
          <span className="client-stat-label">Taxa Média</span>
        </div>
        <div className="client-stat">
          <span className="client-stat-value">{deliveries.topNb}</span>
          <span className="client-stat-label">Bairro + Atendido</span>
        </div>
      </div>
    </div>
  );
}

function FinancialSummary({ orders }: { orders: any[] }) {
  const summary = useMemo(() => {
    const paid = orders.filter(o => o.status !== "pending" && o.status !== "cancelled" && o.status !== "canceled");
    const total = paid.reduce((s, o) => s + (o.total || 0), 0);
    const methods = new Map<string, number>();
    paid.forEach(o => {
      const m = o.paymentMethod || "outros";
      methods.set(m, (methods.get(m) || 0) + (o.total || 0));
    });

    const labelMap: Record<string, string> = {
      PIX: "PIX",
      pix: "PIX",
      credit_card: "Cartão Crédito",
      debit_card: "Cartão Débito",
      money: "Dinheiro",
      cash: "Dinheiro",
      outros: "Outros",
    };

    const defaultMethods = [{ key: "PIX", label: "PIX" }, { key: "credit_card", label: "Cartão" }, { key: "money", label: "Dinheiro" }, { key: "debit_card", label: "Cartão Débito" }, { key: "outros", label: "Outros" }];

    return { total, methods, defaultMethods, labelMap };
  }, [orders]);

  if (!summary.total) return null;

  const detected = summary.defaultMethods
    .filter(m => summary.methods.has(m.key) || summary.methods.has(m.key.toLowerCase()))
    .map(m => ({
      label: m.label,
      value: summary.methods.get(m.key) || summary.methods.get(m.key.toLowerCase()) || 0,
      pct: ((summary.methods.get(m.key) || summary.methods.get(m.key.toLowerCase()) || 0) / summary.total) * 100,
    }))
    .filter(m => m.value > 0);

  if (!detected.length) {
    detected.push({
      label: "PIX",
      value: summary.total,
      pct: 100,
    });
  }

  return (
    <div className="financial-summary">
      <h3 className="section-title-sm"><Landmark size={16} /> Financeiro</h3>
      <div className="financial-total">{fmtCurrency(summary.total)}</div>
      <div className="financial-breakdown">
        {detected.map(m => (
          <div key={m.label} className="financial-row">
            <div className="financial-row-header">
              <span className="financial-label">{m.label}</span>
              <span className="financial-value">{fmtCurrency(m.value)}</span>
            </div>
            <div className="financial-bar-track">
              <div className="financial-bar-fill" style={{ width: `${m.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyPerformance({ thisWeek, lastWeek }: { thisWeek: any[]; lastWeek: any[] }) {
  const metrics = useMemo(() => {
    const twRev = revenueFrom(thisWeek);
    const lwRev = revenueFrom(lastWeek);
    const twCount = countPaid(thisWeek);
    const lwCount = countPaid(lastWeek);
    const twAvg = twCount > 0 ? twRev / twCount : 0;
    const lwAvg = lwCount > 0 ? lwRev / lwCount : 0;
    return {
      revenue: { current: twRev, previous: lwRev, change: lwRev > 0 ? ((twRev - lwRev) / lwRev) * 100 : twRev > 0 ? 100 : 0 },
      orders: { current: twCount, previous: lwCount, change: lwCount > 0 ? ((twCount - lwCount) / lwCount) * 100 : twCount > 0 ? 100 : 0 },
      avgTicket: { current: twAvg, previous: lwAvg, change: lwAvg > 0 ? ((twAvg - lwAvg) / lwAvg) * 100 : twAvg > 0 ? 100 : 0 },
    };
  }, [thisWeek, lastWeek]);

  return (
    <div className="weekly-perf">
      <h3 className="section-title-sm">Desempenho Semanal</h3>
      <div className="weekly-grid">
        {[
          { label: "Faturamento", icon: DollarSign, ...metrics.revenue, fmt: fmtCurrency },
          { label: "Pedidos", icon: ShoppingBag, ...metrics.orders, fmt: fmtNumber },
          { label: "Ticket Médio", icon: TrendingUp, ...metrics.avgTicket, fmt: fmtCurrency },
        ].map(m => (
          <div key={m.label} className="weekly-card">
            <div className="weekly-header">
              <span className="weekly-label">{m.label}</span>
              <m.icon size={16} className="weekly-icon" />
            </div>
            <div className="weekly-current">{m.fmt(m.current)}</div>
            <div className="weekly-compare">
              <span className={`weekly-change ${m.change >= 0 ? "up" : "down"}`}>
                {m.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {fmtPercent(m.change)}
              </span>
              <span className="weekly-vs">vs semana anterior</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();

  const [company, setCompany] = useState<any>(null);
  const [todayOrders, setTodayOrders] = useState<any[]>([]);
  const [yesterdayOrders, setYesterdayOrders] = useState<any[]>([]);
  const [thisWeekOrders, setThisWeekOrders] = useState<any[]>([]);
  const [lastWeekOrders, setLastWeekOrders] = useState<any[]>([]);
  const [prevCustomerIds, setPrevCustomerIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Company info (real-time)
  useEffect(() => {
    if (!user?.companyId) return;
    const unsub = onSnapshot(doc(firestore, "companies", user.companyId), snap => {
      if (snap.exists()) setCompany({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [user?.companyId]);

  // Products
  useEffect(() => {
    if (!user?.companyId) return;
    getDocs(query(collection(firestore, "products"), where("companyId", "==", user.companyId))).then(snap => {
      setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user?.companyId]);

  // Today's orders (real-time)
  useEffect(() => {
    if (!user?.companyId) return;
    const q = query(
      collection(firestore, "orders"),
      where("companyId", "==", user.companyId),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay())),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setTodayOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error("Dashboard orders error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.companyId]);

  // Yesterday (static)
  useEffect(() => {
    if (!user?.companyId) return;
    const yStart = startOfDay(new Date(Date.now() - 86400000));
    const yEnd = endOfDay(new Date(Date.now() - 86400000));
    getDocs(query(
      collection(firestore, "orders"),
      where("companyId", "==", user.companyId),
      where("createdAt", ">=", Timestamp.fromDate(yStart)),
      where("createdAt", "<=", Timestamp.fromDate(yEnd)),
      orderBy("createdAt", "desc")
    )).then(snap => {
      setYesterdayOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user?.companyId]);

  // This week (static)
  useEffect(() => {
    if (!user?.companyId) return;
    getDocs(query(
      collection(firestore, "orders"),
      where("companyId", "==", user.companyId),
      where("createdAt", ">=", Timestamp.fromDate(startOfWeek())),
      orderBy("createdAt", "desc")
    )).then(snap => {
      setThisWeekOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user?.companyId]);

  // Last week (static)
  useEffect(() => {
    if (!user?.companyId) return;
    const lwStart = new Date(startOfWeek());
    lwStart.setDate(lwStart.getDate() - 7);
    const lwEnd = new Date(lwStart);
    lwEnd.setDate(lwEnd.getDate() + 6);
    lwEnd.setHours(23, 59, 59, 999);
    getDocs(query(
      collection(firestore, "orders"),
      where("companyId", "==", user.companyId),
      where("createdAt", ">=", Timestamp.fromDate(lwStart)),
      where("createdAt", "<=", Timestamp.fromDate(lwEnd)),
      orderBy("createdAt", "desc")
    )).then(snap => {
      setLastWeekOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user?.companyId]);

  // Previous customers (before today - for new vs returning)
  useEffect(() => {
    if (!user?.companyId) return;
    const beforeToday = startOfDay();
    beforeToday.setDate(beforeToday.getDate() - 60);
    getDocs(query(
      collection(firestore, "orders"),
      where("companyId", "==", user.companyId),
      where("createdAt", "<", Timestamp.fromDate(startOfDay())),
      orderBy("createdAt", "desc")
    )).then(snap => {
      setPrevCustomerIds(new Set(snap.docs.map(d => d.data().customerId).filter(Boolean)));
    });
  }, [user?.companyId]);

  // ── KPIs ──
  const paidToday = useMemo(() => todayOrders.filter(o => {
    const s = o.status;
    return s !== "pending" && s !== "cancelled" && s !== "canceled";
  }), [todayOrders]);

  const revenueToday = useMemo(() => paidToday.reduce((s, o) => s + (o.total || 0), 0), [paidToday]);
  const countToday = paidToday.length;
  const avgTicket = countToday > 0 ? revenueToday / countToday : 0;
  const uniqueClients = useMemo(() => new Set(paidToday.map(o => o.customerId).filter(Boolean)).size, [paidToday]);
  const totalItemsSold = useMemo(() =>
    paidToday.reduce((s, o) => s + (o.items || []).reduce((si: number, it: any) => si + (it.quantity || 0), 0), 0),
    [paidToday]
  );

  const yesterdayRevenue = useMemo(() =>
    yesterdayOrders.filter(o => o.status !== "pending" && o.status !== "cancelled" && o.status !== "canceled")
      .reduce((s, o) => s + (o.total || 0), 0),
    [yesterdayOrders]
  );
  const yesterdayCount = useMemo(() =>
    yesterdayOrders.filter(o => o.status !== "pending" && o.status !== "cancelled" && o.status !== "canceled").length,
    [yesterdayOrders]
  );

  const revTrend = yesterdayRevenue > 0 ? ((revenueToday - yesterdayRevenue) / yesterdayRevenue) * 100 : revenueToday > 0 ? 100 : 0;
  const countTrend = yesterdayCount > 0 ? ((countToday - yesterdayCount) / yesterdayCount) * 100 : countToday > 0 ? 100 : 0;

  // ── Avg Prep Time ──
  const avgPrepTime = useMemo(() => {
    const times = paidToday
      .filter(o => o.createdAt && o.paidAt && o.status !== "cancelled" && o.status !== "canceled")
      .map(o => (toDate(o.paidAt).getTime() - toDate(o.createdAt).getTime()) / 60000)
      .filter(t => t > 0 && t < 180);
    if (!times.length) return null;
    return Math.round(times.reduce((s, t) => s + t, 0) / times.length);
  }, [paidToday]);

  // ── Alerts ──
  const alerts = useMemo(() => {
    const list: { icon: any; text: string; type: string }[] = [];

    // Pending orders older than 30 minutes
    const oldPending = todayOrders.filter(o => o.status === "pending" && o.createdAt && (Date.now() - toDate(o.createdAt).getTime()) > 1800000);
    if (oldPending.length > 0) {
      list.push({ icon: Clock, text: `${oldPending.length} pedido(s) aguardando pagamento há mais de 30min`, type: "warning" });
    }

    // Preparing orders older than 30 min
    const maxPrep = Math.max(company?.tempoPreparoMax || 30, 30);
    const slowPrep = todayOrders.filter(o => o.status === "preparing" && o.paidAt && (Date.now() - toDate(o.paidAt).getTime()) > maxPrep * 60000);
    if (slowPrep.length > 0) {
      list.push({ icon: Clock, text: `${slowPrep.length} pedido(s) em preparo acima do tempo máximo (${maxPrep}min)`, type: "danger" });
    }

    // Cancellation rate
    const cancelled = todayOrders.filter(o => o.status === "cancelled" || o.status === "canceled").length;
    const total = todayOrders.length;
    if (total > 0 && cancelled / total > 0.2) {
      list.push({ icon: XCircle, text: `Taxa de cancelamento alta: ${Math.round((cancelled / total) * 100)}% (${cancelled}/${total})`, type: "danger" });
    }

    // Store closing soon
    if (company?.horario) {
      const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
      const hoje = dias[new Date().getDay()];
      const hj = company.horario[hoje];
      if (hj?.close) {
        const now = new Date();
        const [ch, cm] = hj.close.split(":").map(Number);
        const closeMins = ch * 60 + cm;
        const currMins = now.getHours() * 60 + now.getMinutes();
        const diff = closeMins - currMins;
        if (diff > 0 && diff <= 60) {
          list.push({ icon: Clock, text: `Loja fecha em ${diff} minutos (${hj.close})`, type: "warning" });
        }
      }
    }

    // All products - check inactive ones
    const inactiveProducts = allProducts.filter(p => p.active === false).length;
    if (inactiveProducts > 0) {
      list.push({ icon: Package, text: `${inactiveProducts} produto(s) inativo(s) no cardápio`, type: "info" });
    }

    // Revenue drop vs yesterday
    if (yesterdayRevenue > 0 && revenueToday < yesterdayRevenue * 0.5) {
      list.push({ icon: TrendingDown, text: `Queda de faturamento >50% em relação a ontem`, type: "danger" });
    }

    // Order count drop
    if (yesterdayCount > 0 && countToday < yesterdayCount * 0.5) {
      list.push({ icon: TrendingDown, text: `Queda de pedidos >50% em relação a ontem`, type: "warning" });
    }

    return list;
  }, [todayOrders, company, yesterdayRevenue, yesterdayCount, allProducts]);

  const handleToggleOpen = async () => {
    if (!company?.id) return;
    await updateDoc(doc(firestore, "companies", company.id), {
      open: company.open === false ? true : false,
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={32} className="spin" />
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      <AlertBanner alerts={alerts} />
      <StoreHeader company={company} ordersToday={todayOrders} onToggleOpen={handleToggleOpen} />

      <div className="kpi-grid">
        <KpiCard
          title="Faturamento Hoje"
          value={fmtCurrency(revenueToday)}
          subtitle="vs ontem"
          trend={revTrend}
          icon={DollarSign}
        />
        <KpiCard
          title="Pedidos Hoje"
          value={fmtNumber(countToday)}
          subtitle="vs ontem"
          trend={countTrend}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Ticket Médio"
          value={fmtCurrency(avgTicket)}
          subtitle={countToday > 0 ? `${fmtNumber(countToday)} pedidos` : "—"}
          icon={TrendingUp}
        />
        <KpiCard
          title="Clientes Atendidos"
          value={fmtNumber(uniqueClients)}
          subtitle={`${fmtNumber(totalItemsSold)} itens vendidos`}
          icon={Users}
        />
        <KpiCard
          title="Tempo Médio"
          value={avgPrepTime !== null ? `${avgPrepTime}min` : "—"}
          subtitle={avgPrepTime === null ? "Sem dados de preparo" : "criação → pagamento"}
          icon={Clock}
        />
        <KpiCard
          title="Produtos Vendidos"
          value={fmtNumber(totalItemsSold)}
          subtitle={`${fmtNumber(paidToday.length)} pedidos`}
          icon={Package}
        />
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-left">
          <StatusPanel orders={todayOrders} />
          <SalesChart orders={todayOrders} />
          <TopProducts orders={todayOrders} />
        </div>
        <div className="dashboard-right">
          <FinancialSummary orders={todayOrders} />
          <ClientMetrics orders={todayOrders} allUserIds={prevCustomerIds} />
          <DeliveryMetrics orders={todayOrders} />
          <WeeklyPerformance thisWeek={thisWeekOrders} lastWeek={lastWeekOrders} />
        </div>
      </div>
    </div>
  );
}
