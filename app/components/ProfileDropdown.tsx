"use client";

import { useEffect, useRef } from "react";
import { User, MapPin, LogOut, Shield } from "lucide-react";
import Link from "next/link";

interface ProfileDropdownProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onEditProfile: () => void;
  onAddresses: () => void;
  onSignOut: () => void;
}

export default function ProfileDropdown({ open, onClose, user, onEditProfile, onAddresses, onSignOut }: ProfileDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-[#EAEAEA] p-3 w-64 z-50 animate-fade-in"
      onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B00] font-bold text-sm shrink-0">
          {(user?.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{user?.name || "Usuário"}</p>
          <p className="text-[10px] text-[#999] truncate">{user?.email}</p>
        </div>
      </div>
      <button onClick={() => onEditProfile()}
        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2">
        <User size={15} className="text-[#666]" /> Editar Perfil
      </button>
      <button onClick={() => onAddresses()}
        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2">
        <MapPin size={15} className="text-[#666]" /> Meus Endereços
      </button>
      {(user?.role === "admin" || user?.role === "owner") && (
        <a href="/admin" onClick={() => onClose()}
          className="block px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
          Painel Admin
        </a>
      )}
      {user?.role === "owner" && (
        <a href="/owner" onClick={() => onClose()}
          className="block px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
          Painel Owner
        </a>
      )}
      <button onClick={() => onSignOut()}
        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-medium text-red-500 transition-colors mt-1 border-t border-gray-100 pt-3 flex items-center gap-2">
        <LogOut size={15} /> Sair
      </button>
      <Link href="/privacy"
        className="block px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2 text-gray-500">
        <Shield size={15} /> Minha Privacidade
      </Link>
    </div>
  );
}
