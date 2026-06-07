"use client";

import { useState, useEffect } from "react";
import { X, Bell, Star, ChevronRight } from "lucide-react";
import { AppNotification } from "@totem/shared/types";
import { useNotifications } from "../hooks/useNotifications";
import { useReviewByOrderId } from "../hooks/useReviews";
import ReviewModal from "./ReviewModal";

interface Props {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ userId, isOpen, onClose }: Props) {
  const { notifications, loading, unreadCount, markAsRead, markAsResolved, refetch } = useNotifications(userId);
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [localNotifications, setLocalNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  useEffect(() => {
    if (isOpen) {
      setLocalNotifications(notifications);
    }
  }, [notifications, isOpen]);

  if (!isOpen) return null;

  const handleNotificationClick = async (n: AppNotification) => {
    await markAsRead(n.id);
    if (n.type === 'order_review') {
      setReviewingOrderId(n.relatedOrderId);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-[430px] rounded-t-[24px] p-6 shadow-2xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#FF6B00]" />
              <h3 className="font-bold text-lg">Notificações</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-sm text-[#666]">Carregando...</div>
            ) : localNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-10 w-10 mx-auto text-[#ccc] mb-3" />
                <p className="text-sm text-[#666]">Nenhuma notificação</p>
              </div>
            ) : (
              localNotifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left p-4 rounded-xl transition-colors flex items-start gap-3 ${
                    n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-[#FFF8F0] hover:bg-[#FFF0E0]'
                  }`}
                >
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-[#FF6B00]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.isRead ? 'text-[#1F1F1F]' : 'text-[#1F1F1F] font-bold'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[#666] mt-1">{n.message}</p>
                    <p className="text-[10px] text-[#999] mt-1">
                      {new Date(n.createdAt instanceof Date ? n.createdAt : (n.createdAt as any).seconds * 1000).toLocaleString('pt-BR')}
                    </p>
                    {n.isResolved && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        Concluída
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#ccc] flex-shrink-0 mt-1" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <ReviewModal
        userId={userId}
        orderId={reviewingOrderId}
        isOpen={!!reviewingOrderId}
        onClose={() => { setReviewingOrderId(null); }}
        onReviewSubmitted={() => { markReviewAsResolved(); }}
      />
    </>
  );

  async function markReviewAsResolved() {
    if (!reviewingOrderId) return;
    const reviewNotif = localNotifications.find(
      n => n.relatedOrderId === reviewingOrderId && n.type === 'order_review'
    );
    if (reviewNotif) {
      await markAsResolved(reviewNotif.id);
    }
  }
}
