"use client";

import { PromotionEvent } from "@totem/shared/types";
import { Calendar, Lock } from "lucide-react";
import "./styles.css";

interface Props {
  events: PromotionEvent[];
  onEdit: (e: PromotionEvent) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "badge badge-draft" },
  scheduled: { label: "Agendado", className: "badge badge-scheduled" },
  active: { label: "Ativo", className: "badge badge-active" },
  finished: { label: "Encerrado", className: "badge badge-inactive" },
};

const fmtDate = (ts: any) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleDateString("pt-BR");
};

export default function EventsTable({ events, onEdit, onDelete }: Props) {
  return (
    <div className="events-table-wrapper">
      <table className="ev-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Início</th>
            <th>Término</th>
            <th>Ordem</th>
            <th>Permanente</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => {
            const statusInfo = statusLabels[ev.status] || statusLabels.draft;
            return (
              <tr key={ev.id}>
                <td>
                  <div className="ev-name-cell">
                    {ev.bannerUrl ? (
                      <img src={ev.bannerUrl} alt="" className="ev-thumb" />
                    ) : (
                      <div className="ev-thumb-placeholder"><Calendar size={18} /></div>
                    )}
                    <strong>{ev.name}</strong>
                  </div>
                </td>
                <td><code className="ev-slug">{ev.slug}</code></td>
                <td><span className={statusInfo.className}>{statusInfo.label}</span></td>
                <td>{fmtDate(ev.startAt)}</td>
                <td>{fmtDate(ev.endAt)}</td>
                <td>{ev.displayOrder}</td>
                <td>
                  {ev.permanent ? (
                    <Lock size={14} style={{ color: "#64748b" }} />
                  ) : "—"}
                </td>
                <td className="actions-cell">
                  <button className="btn-action btn-edit" onClick={() => onEdit(ev)}>Editar</button>
                  {!ev.permanent && (
                    <button className="btn-action btn-delete" onClick={() => onDelete(ev.id)}>Excluir</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
