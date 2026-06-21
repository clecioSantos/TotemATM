"use client";

import { useState, useMemo, useEffect } from "react";
import { usePromotions } from "./hooks/usePromotions";
import { usePromotionEvents } from "./hooks/usePromotionEvents";
import { useProducts } from "@/app/admin/products/hooks/useProducts";
import PromotionsTable from "./components/PromotionsTable";
import PromotionForm from "./components/PromotionForm";
import Modal from "@/app/admin/components/Modal";
import { Promotion } from "@totem/shared/types";
import { ensurePermanentEvent } from "@/src/services/promotions.service";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import { Tag, TrendingUp, CheckCircle2, XCircle, Percent, Sparkles } from "lucide-react";
import { useConfirm } from "@/app/components/ConfirmProvider";
import "./page.css";

function PromotionsContent() {
  const { showAlert, showConfirm } = useConfirm();
  const { promotions, loading, createPromotion, updatePromotion, deletePromotion } = usePromotions();
  const { events } = usePromotionEvents();

  useEffect(() => {
    ensurePermanentEvent().catch(() => {});
  }, []);
  const { products, loading: productsLoading } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statuses = [
    { id: "all", label: "Todas" },
    { id: "active", label: "Ativas" },
    { id: "scheduled", label: "Agendadas" },
    { id: "finished", label: "Encerradas" },
  ];

  const filtered = useMemo(() => {
    if (statusFilter === "all") return promotions;
    return promotions.filter((p) => p.status === statusFilter);
  }, [promotions, statusFilter]);

  const stats = useMemo(() => {
    const active = promotions.filter((p) => p.status === "active").length;
    const finished = promotions.filter((p) => p.status === "finished").length;
    const uniqueProducts = new Set(promotions.filter((p) => p.status === "active").map((p) => p.productId)).size;
    const totalSold = promotions.filter((p) => p.status === "active").reduce((s, p) => s + (p.soldUnits || 0), 0);
    return { active, finished, uniqueProducts, totalSold };
  }, [promotions]);

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingPromotion(null);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm("Deseja excluir esta promoção?")) return;
    try {
      await deletePromotion(id);
    } catch (err) {
      logger.error("PromotionsPage.delete", err);
    }
  };

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Promoções</h1>
          <p className="page-subtitle">Gerencie as promoções da sua loja</p>
        </div>
        <button className="primary-button" onClick={() => { setEditingPromotion(null); setIsModalOpen(true); }}>
          <span>➕</span> Nova Promoção
        </button>
      </header>

      <div className="promo-stats-grid">
        {[
          { label: "Promoções Ativas", value: stats.active, icon: Tag, bg: "#dcfce7", color: "#166534" },
          { label: "Promoções Encerradas", value: stats.finished, icon: XCircle, bg: "#f1f5f9", color: "#64748b" },
          { label: "Produtos em Promoção", value: stats.uniqueProducts, icon: TrendingUp, bg: "#eff6ff", color: "#2563eb" },
          { label: "Unidades Vendidas", value: stats.totalSold, icon: CheckCircle2, bg: "#fffbeb", color: "#d97706" },
        ].map((card) => (
          <div key={card.label} className="promo-stat-card">
            <div className="promo-stat-top">
              <span className="promo-stat-label">{card.label}</span>
              <div className="promo-stat-icon" style={{ background: card.bg, color: card.color }}>
                <card.icon size={18} />
              </div>
            </div>
            <div className="promo-stat-value">{card.value}</div>
          </div>
        ))}
      </div>

      {!productsLoading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={18} className="text-orange-500" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Promoções por Dia da Semana</h2>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>configuradas nos produtos</span>
          </div>
          {(() => {
            const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
            const productsWithDayPromos = products.filter((p: any) => p.dayPromotions?.length > 0);
            if (productsWithDayPromos.length === 0) {
              return <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Nenhum produto com promoção por dia configurada.</p>;
            }
            const grouped: Record<number, any[]> = {};
            productsWithDayPromos.forEach((p: any) => {
              p.dayPromotions.forEach((dp: any) => {
                if (!grouped[dp.dayOfWeek]) grouped[dp.dayOfWeek] = [];
                grouped[dp.dayOfWeek].push({ product: p, discountPercent: dp.discountPercent });
              });
            });
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([day, items]) => (
                  <div key={day} style={{ background: '#fef7ed', borderRadius: 10, border: '1px solid #fed7aa', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', background: '#fff7ed', borderBottom: '1px solid #fed7aa', fontSize: 12, fontWeight: 700, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>📅</span> {weekDays[Number(day)]}
                    </div>
                    <div style={{ padding: '8px 12px' }}>
                      {items.map((item: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < items.length - 1 ? '1px solid #fed7aa' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {item.product.imageUrl ? <img src={item.product.imageUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} /> : <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f1f5f9' }} />}
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{item.product.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>{item.discountPercent}% OFF</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      <div className="filters-container" style={{ marginBottom: 16 }}>
        {statuses.map((s) => (
          <button
            key={s.id}
            className={`filter-btn ${statusFilter === s.id ? "active" : ""}`}
            onClick={() => setStatusFilter(s.id)}
          >
            {s.label}
            <span className="filter-count">
              {s.id === "all" ? promotions.length : promotions.filter((p) => p.status === s.id).length}
            </span>
          </button>
        ))}
      </div>

      <main className="page-content">
        {loading || productsLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando promoções...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Tag size={40} className="mx-auto mb-3" style={{ color: "#ccc" }} />
            <p>Nenhuma promoção encontrada.</p>
          </div>
        ) : (
          <PromotionsTable
            promotions={filtered}
            products={products}
            events={events}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingPromotion ? "Editar Promoção" : "Nova Promoção"}
      >
        <PromotionForm
          products={products}
          events={events}
          initialData={editingPromotion}
          onSubmit={async (data) => {
            try {
              if (editingPromotion) {
                await updatePromotion(editingPromotion.id, data);
              } else {
                await createPromotion(data);
              }
              handleClose();
            } catch (err: any) {
              if (err?.message === "PRODUCT_ALREADY_IN_PROMOTION") {
                await showAlert("Este produto já possui uma promoção ativa.");
              } else {
                logger.error("PromotionsPage.save", err);
                await showAlert("Erro ao salvar promoção.");
              }
            }
          }}
        />
      </Modal>
    </div>
  );
}

export default function PromotionsPage() {
  return <ErrorBoundary context="PromotionsPage"><PromotionsContent /></ErrorBoundary>;
}
