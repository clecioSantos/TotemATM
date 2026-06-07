"use client";

import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import { collection, addDoc, getDoc, doc, query, where, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useReviewByOrderId } from "../hooks/useReviews";

interface Props {
  userId?: string;
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({ userId, orderId, isOpen, onClose, onReviewSubmitted }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { review, loading } = useReviewByOrderId(orderId || undefined, refreshKey);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (review) {
        setRating(Math.round(review.rating));
        setComment(review.comment || "");
        setSubmitted(true);
      } else {
        setRating(0);
        setComment("");
        setSubmitted(false);
        setError("");
      }
    }
  }, [isOpen, review]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Selecione uma nota");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const orderRef = doc(firestore, "orders", orderId!);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) throw new Error("Pedido não encontrado");
      const orderData = orderSnap.data();

      if (orderData.customerId !== userId) throw new Error("Você não pode avaliar este pedido");
      if (orderData.status !== "finished") throw new Error("Apenas pedidos entregues podem ser avaliados");

      const existing = query(
        collection(firestore, "order_reviews"),
        where("orderId", "==", orderId)
      );
      const existingSnap = await getDocs(existing);
      if (!existingSnap.empty) throw new Error("Você já avaliou este pedido");

      const now = Timestamp.now();
      await addDoc(collection(firestore, "order_reviews"), {
        orderId: orderId!,
        customerId: userId,
        companyId: orderData.companyId || "",
        rating,
        comment: comment || "",
        adminReply: "",
        adminReplyAt: null,
        createdAt: now,
        updatedAt: now,
      });

      await updateCompanyRating(orderData.companyId || "");
      setSubmitted(true);
      setRefreshKey(k => k + 1);
      onReviewSubmitted?.();
    } catch (e: any) {
      setError(e.message || "Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  const updateCompanyRating = async (companyId: string) => {
    try {
      const companyRef = doc(firestore, "companies", companyId);
      const companySnap = await getDoc(companyRef);
      if (!companySnap.exists()) return;
      const companyData = companySnap.data();
      const currentAvg = companyData.averageRating || 0;
      const currentCount = companyData.reviewCount || 0;
      const newCount = currentCount + 1;
      const newAvg = ((currentAvg * currentCount) + rating) / newCount;
      await updateDoc(companyRef, {
        averageRating: Math.round(newAvg * 10) / 10,
        reviewCount: newCount,
      });
    } catch (e) {
      console.error("Erro ao atualizar média da loja", e);
    }
  };

  const renderStars = (current: number, interactive: boolean) => {
    return [1, 2, 3, 4, 5].map(s => (
      <button
        key={s}
        type="button"
        disabled={!interactive || submitting}
        onClick={() => interactive && setRating(s)}
        onMouseEnter={() => interactive && setHoverRating(s)}
        onMouseLeave={() => interactive && setHoverRating(0)}
        className="transition-transform hover:scale-110 disabled:cursor-default"
        style={{ color: s <= (hoverRating || rating) ? '#f59e0b' : '#e4e4e7' }}
      >
        <Star
          className="h-8 w-8"
          fill={s <= (hoverRating || rating) ? '#f59e0b' : 'none'}
          stroke={s <= (hoverRating || rating) ? '#f59e0b' : '#e4e4e7'}
        />
      </button>
    ));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[430px] rounded-t-[24px] p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">
            {submitted ? "Sua avaliação" : "Como foi sua experiência?"}
          </h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-sm text-[#666]">Carregando...</div>
        ) : submitted && review ? (
          <div className="space-y-4">
            <div className="flex justify-center gap-1">
              {renderStars(Math.round(review.rating), false)}
            </div>
            {review.comment && (
              <div>
                <p className="text-xs font-bold text-[#666] mb-1">Comentário:</p>
                <p className="text-sm bg-[#FAFAFA] p-3 rounded-lg">{review.comment}</p>
              </div>
            )}
            {review.adminReply ? (
              <div>
                <p className="text-xs font-bold text-green-600 mb-1">Resposta da loja:</p>
                <p className="text-sm bg-green-50 p-3 rounded-lg border border-green-100">{review.adminReply}</p>
              </div>
            ) : (
              <p className="text-xs text-[#666] italic">Loja ainda não respondeu.</p>
            )}
          </div>
        ) : submitted ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-bold text-lg">Obrigado pela sua avaliação.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-[#666] mb-3 text-center">Toque nas estrelas para avaliar</p>
              <div className="flex justify-center gap-2">
                {renderStars(rating, true)}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#666] block mb-2">
                Comentário (opcional)
              </label>
              <textarea
                className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm resize-none outline-none focus:border-[#FF6B00]"
                rows={3}
                placeholder="Conte um pouco sobre sua experiência..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                maxLength={500}
              />
              <p className="text-[10px] text-[#999] text-right mt-1">{comment.length}/500</p>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="w-full py-3 bg-[#FF6B00] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {submitting ? "Enviando..." : "Enviar avaliação"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
