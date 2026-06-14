"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import {
  Store, Calendar, Tag, TrendingUp, ShoppingBag,
  Loader2, Store as StoreIcon, Settings, Ticket
} from "lucide-react";

function OwnerDashboardContent() {
  const [stores, setStores] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalCouponsEnabled, setGlobalCouponsEnabled] = useState<boolean | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    getDoc(doc(firestore, "settings", "global")).then((snap) => {
      if (snap.exists()) setGlobalCouponsEnabled(snap.data().couponsEnabled === true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubCompanies = onSnapshot(collection(firestore, "companies"), (snap) => {
      setStores(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => logger.error("OWNER", "Erro ao carregar lojas", err));

    const unsubEvents = onSnapshot(
      query(collection(firestore, "promotionEvents"), orderBy("displayOrder")),
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => logger.error("OWNER", "Erro ao carregar eventos", err)
    );

    const unsubPromotions = onSnapshot(collection(firestore, "promotions"), (snap) => {
      setPromotions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      logger.error("OWNER", "Erro ao carregar promoções", err);
      setLoading(false);
    });

    return () => {
      unsubCompanies();
      unsubEvents();
      unsubPromotions();
    };
  }, []);

  const stats = useMemo(() => {
    const totalStores = stores.length;
    const openStores = stores.filter((s) => s.open !== false).length;
    const totalEvents = events.length;
    const activeEvents = events.filter((e: any) => e.status === "active").length;
    const scheduledEvents = events.filter((e: any) => e.status === "scheduled").length;
    const finishedEvents = events.filter((e: any) => e.status === "finished").length;
    const totalPromotions = promotions.length;
    const activePromotions = promotions.filter((p: any) => p.status === "active").length;
    const finishedPromotions = promotions.filter((p: any) => p.status === "finished").length;
    const storesWithPromotions = new Set(
      promotions.filter((p: any) => p.status === "active").map((p: any) => p.storeId)
    ).size;
    const totalSold = promotions
      .filter((p: any) => p.status === "active")
      .reduce((s: number, p: any) => s + (p.soldUnits || 0), 0);
    return {
      totalStores, openStores,
      totalEvents, activeEvents, scheduledEvents, finishedEvents,
      totalPromotions, activePromotions, finishedPromotions,
      storesWithPromotions, totalSold,
    };
  }, [stores, events, promotions]);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 text-gray-400" style={{ paddingTop: 100 }}>
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm font-medium">Carregando painel global...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
          <StoreIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Global</h1>
          <p className="text-sm text-gray-500">Visão geral da plataforma</p>
        </div>
      </div>

      {/* Lojas */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Store size={18} className="text-blue-600" /> Lojas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total de Lojas", value: stats.totalStores, icon: <Store size={20} />, bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
            { label: "Lojas Abertas", value: stats.openStores, icon: <Store size={20} />, bg: "bg-green-50", text: "text-green-700", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { label: "Lojas com Promoções", value: stats.storesWithPromotions, icon: <Tag size={20} />, bg: "bg-yellow-50", text: "text-yellow-700", iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
          ].map((card) => (
            <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wide ${card.text}`}>{card.label}</span>
                <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                  {card.icon}
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${card.text}`}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Eventos */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-purple-600" /> Eventos Promocionais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.totalEvents, icon: <Calendar size={20} />, bg: "bg-gray-50", text: "text-gray-700", iconBg: "bg-gray-200", iconColor: "text-gray-600" },
            { label: "Ativos", value: stats.activeEvents, icon: <Calendar size={20} />, bg: "bg-green-50", text: "text-green-700", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { label: "Agendados", value: stats.scheduledEvents, icon: <Calendar size={20} />, bg: "bg-yellow-50", text: "text-yellow-700", iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
            { label: "Encerrados", value: stats.finishedEvents, icon: <Calendar size={20} />, bg: "bg-red-50", text: "text-red-700", iconBg: "bg-red-100", iconColor: "text-red-600" },
          ].map((card) => (
            <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wide ${card.text}`}>{card.label}</span>
                <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                  {card.icon}
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${card.text}`}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Promoções */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Tag size={18} className="text-amber-600" /> Promoções
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total de Promoções", value: stats.totalPromotions, icon: <Tag size={20} />, bg: "bg-gray-50", text: "text-gray-700", iconBg: "bg-gray-200", iconColor: "text-gray-600" },
            { label: "Promoções Ativas", value: stats.activePromotions, icon: <TrendingUp size={20} />, bg: "bg-green-50", text: "text-green-700", iconBg: "bg-green-100", iconColor: "text-green-600" },
            { label: "Unidades Vendidas", value: stats.totalSold, icon: <ShoppingBag size={20} />, bg: "bg-amber-50", text: "text-amber-700", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
          ].map((card) => (
            <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wide ${card.text}`}>{card.label}</span>
                <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                  {card.icon}
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${card.text}`}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Configurações Globais */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Settings size={18} className="text-gray-600" /> Configurações Globais
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={globalCouponsEnabled === true}
              onChange={async (e) => {
                const newValue = e.target.checked;
                setGlobalCouponsEnabled(newValue);
                setSavingSettings(true);
                try {
                  await setDoc(doc(firestore, "settings", "global"), { couponsEnabled: newValue }, { merge: true });
                } catch (err) {
                  setGlobalCouponsEnabled(globalCouponsEnabled);
                  logger.error("OWNER", "Erro ao salvar configuração global", err);
                } finally {
                  setSavingSettings(false);
                }
              }}
              disabled={savingSettings}
              className="w-5 h-5 rounded border-gray-300 accent-blue-600 mt-0.5"
            />
            <div>
              <div className="flex items-center gap-2">
                <Ticket size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Cupons de Desconto</span>
                {savingSettings && <Loader2 size={14} className="animate-spin text-gray-400" />}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Quando desabilitado, desativa cupons em todas as lojas da plataforma.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  return <ErrorBoundary context="OwnerDashboard"><OwnerDashboardContent /></ErrorBoundary>;
}
