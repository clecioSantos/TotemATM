"use client";

import { useEffect, useRef } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "alert" | "confirm" | "success";
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancelar",
  variant = "alert",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCancel) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white w-[90vw] max-w-sm rounded-2xl shadow-2xl border border-gray-200 animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-2">
            {variant === "confirm" && <AlertTriangle size={20} className="text-amber-500" />}
            {variant === "success" && <CheckCircle size={20} className="text-green-500" />}
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Message */}
        <div className="px-5 py-3">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        {/* Actions */}
        <div className={`flex gap-2 px-5 pb-5 ${variant === "alert" ? "justify-center" : ""}`}>
          {variant === "confirm" && (
            <button
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-white font-bold text-sm transition-all shadow-sm ${
              variant === "confirm"
                ? "bg-orange-500 hover:bg-orange-600"
                : variant === "success"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
