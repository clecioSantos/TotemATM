"use client";

import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: Date;
  adminReply: string;
}

interface Props {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StoreReviewsModal({ companyId, isOpen, onClose }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !companyId) return;
    let cancelled = false;
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(firestore, "order_reviews"),
          where("companyId", "==", companyId)
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const { getDoc, doc } = await import("firebase/firestore");
        const items = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            let customerName = "";
            try {
              const userSnap = await getDoc(doc(firestore, "users", data.customerId || ""));
              if (userSnap.exists()) customerName = userSnap.data().name || "";
            } catch {}
            return {
              id: d.id,
              rating: Math.round(data.rating) || 0,
              comment: data.comment || "",
              customerName,
              adminReply: data.adminReply || "",
              createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            } as ReviewItem;
          })
        );
        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setReviews(items.slice(0, 10));
      } catch (e) {
        console.error("Erro ao buscar avaliações", e);
      }
      if (!cancelled) setLoading(false);
    };
    fetchReviews();
    return () => { cancelled = true; };
  }, [isOpen, companyId]);

  if (!isOpen) return null;

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        className="h-3.5 w-3.5"
        fill={s <= rating ? "#f59e0b" : "none"}
        stroke={s <= rating ? "#f59e0b" : "#d4d4d8"}
      />
    ));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[430px] rounded-t-[24px] p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Avaliações</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-8 text-sm text-[#666]">Carregando...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">📝</div>
              <p className="text-sm text-[#666]">Nenhuma avaliação ainda.</p>
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="p-3 bg-[#FAFAFA] rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#1F1F1F]">
                    {r.customerName || "Cliente"}
                  </span>
                  <span className="text-[10px] text-[#999]">
                    {r.createdAt.toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mb-1">
                  {renderStars(r.rating)}
                </div>
                {r.comment && (
                  <p className="text-xs text-[#666] mt-1">{r.comment}</p>
                )}
                {r.adminReply && (
                  <div className="mt-2 pt-2 border-t border-[#e4e4e7]">
                    <p className="text-[10px] font-bold text-green-600 mb-0.5">Resposta da loja:</p>
                    <p className="text-xs text-green-700">{r.adminReply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
