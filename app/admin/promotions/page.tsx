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
import { Tag, TrendingUp, CheckCircle2, XCircle, Percent } from "lucide-react";
import "./page.css";

function PromotionsContent() {
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
    if (!confirm("Deseja excluir esta promoção?")) return;
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
                alert("Este produto já possui uma promoção ativa.");
              } else {
                logger.error("PromotionsPage.save", err);
                alert("Erro ao salvar promoção.");
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
