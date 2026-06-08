"use client";

import { useState, useMemo, useEffect } from "react";
import { useEvents } from "./hooks/useEvents";
import EventsTable from "./components/EventsTable";
import EventForm from "./components/EventForm";
import Modal from "@/app/admin/components/Modal";
import { PromotionEvent } from "@totem/shared/types";
import { ensurePermanentEvent } from "@/src/services/promotions.service";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import { Calendar, CalendarCheck, CalendarX, Clock } from "lucide-react";
import "./page.css";

function EventsContent() {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();

  useEffect(() => {
    ensurePermanentEvent().catch(() => {});
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PromotionEvent | null>(null);

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [events]);

  const stats = useMemo(() => {
    const total = events.length;
    const active = events.filter((e) => e.status === "active").length;
    const scheduled = events.filter((e) => e.status === "scheduled").length;
    const finished = events.filter((e) => e.status === "finished").length;
    return { total, active, scheduled, finished };
  }, [events]);

  const handleEdit = (event: PromotionEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingEvent(null);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const ev = events.find((e) => e.id === id);
    if (ev?.permanent) {
      alert("O evento Promoções é permanente e não pode ser excluído.");
      return;
    }
    if (!confirm("Deseja excluir este evento?")) return;
    try {
      await deleteEvent(id);
    } catch (err) {
      logger.error("EventsPage.delete", err);
    }
  };

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Eventos Promocionais</h1>
          <p className="page-subtitle">Gerencie os eventos promocionais da plataforma</p>
        </div>
        <button className="primary-button" onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}>
          <span>➕</span> Novo Evento
        </button>
      </header>

      <div className="events-stats-grid">
        {[
          { label: "Total", value: stats.total, icon: Calendar, bg: "#f1f5f9", color: "#64748b" },
          { label: "Ativos", value: stats.active, icon: CalendarCheck, bg: "#dcfce7", color: "#166534" },
          { label: "Agendados", value: stats.scheduled, icon: Clock, bg: "#fef3c7", color: "#92400e" },
          { label: "Encerrados", value: stats.finished, icon: CalendarX, bg: "#fee2e2", color: "#991b1b" },
        ].map((card) => (
          <div key={card.label} className="events-stat-card">
            <div className="events-stat-top">
              <span className="events-stat-label">{card.label}</span>
              <div className="events-stat-icon" style={{ background: card.bg, color: card.color }}>
                <card.icon size={18} />
              </div>
            </div>
            <div className="events-stat-value">{card.value}</div>
          </div>
        ))}
      </div>

      <main className="page-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando eventos...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <Calendar size={40} className="mx-auto mb-3" style={{ color: "#ccc" }} />
            <p>Nenhum evento encontrado.</p>
          </div>
        ) : (
          <EventsTable
            events={sorted}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingEvent ? "Editar Evento" : "Novo Evento"}
      >
        <EventForm
          initialData={editingEvent}
          onSubmit={async (data) => {
            try {
              if (editingEvent) {
                await updateEvent(editingEvent.id, data);
              } else {
                await createEvent(data);
              }
              handleClose();
            } catch (err) {
              logger.error("EventsPage.save", err);
              alert("Erro ao salvar evento.");
            }
          }}
        />
      </Modal>
    </div>
  );
}

export default function EventsPage() {
  return <ErrorBoundary context="EventsPage"><EventsContent /></ErrorBoundary>;
}
