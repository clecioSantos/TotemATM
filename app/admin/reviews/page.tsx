"use client";

import { useState, useMemo } from "react";
import { OrderReview } from "@totem/shared/types";
import { useAdminReviews } from "./hooks/useReviews";
import { PermissionGate } from "@/src/components/PermissionGate";
import "./page.css";

const STAR_LABELS = ["", "1 estrela", "2 estrelas", "3 estrelas", "4 estrelas", "5 estrelas"];

export default function AdminReviewsPage() {
  const { reviews, loading, replyToReview } = useAdminReviews();
  const [filter, setFilter] = useState<string>("all");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const filteredReviews = useMemo(() => {
    if (filter === "all") return reviews;
    if (filter === "no_reply") return reviews.filter(r => !r.adminReply);
    const rating = parseInt(filter);
    if (rating >= 1 && rating <= 5) return reviews.filter(r => r.rating === rating);
    return reviews;
  }, [reviews, filter]);

  const metrics = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { average: 0, distribution: [0, 0, 0, 0, 0, 0], noReply: 0, last30Avg: 0 };

    const distribution = [0, 0, 0, 0, 0, 0];
    let sum = 0;
    let last30Sum = 0;
    let last30Count = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    reviews.forEach(r => {
      const rating = Math.round(r.rating);
      if (rating >= 1 && rating <= 5) distribution[rating]++;
      sum += r.rating;

      const createdAt = r.createdAt instanceof Date ? r.createdAt : new Date();
      if (createdAt >= thirtyDaysAgo) {
        last30Sum += r.rating;
        last30Count++;
      }
    });

    return {
      average: total > 0 ? sum / total : 0,
      distribution,
      noReply: reviews.filter(r => !r.adminReply).length,
      last30Avg: last30Count > 0 ? last30Sum / last30Count : 0,
    };
  }, [reviews]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await replyToReview(reviewId, replyText.trim());
      setReplyingId(null);
      setReplyText("");
    } catch { }
  };

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);
    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} className={`star ${s <= rounded ? 'filled' : ''}`}>★</span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="condiments-page-container">
        <header className="page-header">
          <div className="header-text">
            <h1 className="page-title">Avaliações</h1>
            <p className="page-subtitle">Gerencie as avaliações dos seus clientes</p>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Avaliações</h1>
          <p className="page-subtitle">Gerencie as avaliações dos seus clientes</p>
        </div>
      </header>

      <div className="reviews-metrics">
        <div className="metric-card metric-highlight">
          <div className="metric-value">{metrics.average.toFixed(1)} ⭐</div>
          <div className="metric-label">Avaliação Média</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{reviews.length}</div>
          <div className="metric-label">Total de Avaliações</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.noReply}</div>
          <div className="metric-label">Sem Resposta</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.last30Avg.toFixed(1)} ⭐</div>
          <div className="metric-label">Média (30 dias)</div>
        </div>
      </div>

      <div className="rating-distribution">
        <h4>Distribuição das Avaliações</h4>
        {[5, 4, 3, 2, 1].map(star => {
          const count = metrics.distribution[star] || 0;
          const maxCount = Math.max(...metrics.distribution, 1);
          const pct = (count / maxCount) * 100;
          return (
            <div key={star} className="rating-row">
              <span className="rating-label">{'★'.repeat(star)}</span>
              <div className="rating-bar">
                <div
                  className="rating-bar-fill"
                  style={{ width: `${pct}%`, background: star >= 4 ? '#10b981' : star >= 3 ? '#f59e0b' : '#ef4444' }}
                />
              </div>
              <span className="rating-count">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="reviews-filters">
        {[
          { key: "all", label: "Todas" },
          { key: "no_reply", label: "Sem resposta" },
          { key: "5", label: "5 estrelas" },
          { key: "4", label: "4 estrelas" },
          { key: "3", label: "3 estrelas" },
          { key: "2", label: "2 estrelas" },
          { key: "1", label: "1 estrela" },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="review-empty">
          <div style={{ fontSize: 48, marginBottom: 8 }}>📝</div>
          <p>Nenhuma avaliação encontrada com este filtro.</p>
        </div>
      ) : (
        filteredReviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-card-header">
              <div className="review-customer-info">
                <h4>{review.customerName || 'Cliente'}</h4>
                <div className="review-meta">
                  Pedido {review.orderNumber || `#${review.orderId.slice(-6).toUpperCase()}`}
                  {' • '}
                  {new Date(
                    review.createdAt instanceof Date ? review.createdAt : review.createdAt.seconds * 1000
                  ).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {renderStars(review.rating)}
            </div>

            {review.comment && (
              <div className="review-comment">{review.comment}</div>
            )}

            {review.orderItems && review.orderItems.length > 0 && (
              <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Itens do pedido:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {review.orderItems.map((item, i) => (
                    <span key={i} style={{
                      background: '#f1f5f9',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                    }}>
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <PermissionGate permission="manageReviews">
            <div className="review-reply">
              {review.adminReply ? (
                <div>
                  <h5>Sua resposta:</h5>
                  <div className="existing-reply">{review.adminReply}</div>
                  <button
                    className="btn-action btn-edit"
                    onClick={() => { setReplyingId(review.id); setReplyText(review.adminReply); }}
                    style={{ fontSize: 12 }}
                  >
                    Editar resposta
                  </button>
                </div>
              ) : replyingId === review.id ? null : (
                <button
                  className="btn-action btn-edit"
                  onClick={() => { setReplyingId(review.id); setReplyText(""); }}
                  style={{ fontSize: 12 }}
                >
                  Responder avaliação
                </button>
              )}

              {replyingId === review.id && (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    placeholder="Escreva sua resposta..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                  />
                  <div className="reply-actions">
                    <button
                      className="btn-action"
                      onClick={() => { setReplyingId(null); setReplyText(""); }}
                      style={{ color: '#666' }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleReply(review.id)}
                      disabled={!replyText.trim()}
                      style={{ fontWeight: 700 }}
                    >
                      Enviar resposta
                    </button>
                  </div>
                </div>
              )}
            </div>
            </PermissionGate>
          </div>
        ))
      )}
    </div>
  );
}
