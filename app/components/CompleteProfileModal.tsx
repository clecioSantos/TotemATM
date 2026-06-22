"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { X, Loader2, User, CreditCard, Cake } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentCpf?: string;
  currentBirthDate?: string;
  onSaved: () => void;
}

export default function CompleteProfileModal({ open, userId, currentCpf, currentBirthDate, onClose, onSaved }: Props) {
  const [cpf, setCpf] = useState(currentCpf || "");
  const [birthDate, setBirthDate] = useState(currentBirthDate || "");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "users", userId), {
        cpf: cpf.replace(/\D/g, ""),
        birthDate,
      });
      onSaved();
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Complete seu Perfil</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-400" /></button>
        </div>

        <p className="text-sm text-[#666] mb-6 leading-relaxed">
          Para melhor atender você, gostaríamos de saber um pouco mais. Esses dados são opcionais.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">CPF</label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999]" />
              <input type="text" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full h-11 pl-9 pr-3 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Data de Nascimento</label>
            <div className="relative">
              <Cake size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999]" />
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-11 pl-9 pr-3 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[#EAEAEA] text-sm font-bold text-[#666] hover:bg-gray-50 transition-all">
            Agora não
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 h-11 rounded-xl bg-[#FF6B00] text-white text-sm font-bold hover:bg-[#E65C00] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
