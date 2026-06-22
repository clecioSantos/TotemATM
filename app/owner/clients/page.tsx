"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { UserProfile } from "@totem/shared/types/auth";
import { Search, ChevronRight, Users, Phone, Mail, ShoppingBag, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";

export default function OwnerClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "users"), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClients(
        all
          .filter((c: any) => c.role === "client")
          .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""))
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const s = search.toLowerCase();
    return clients.filter((c) =>
      c.name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.phone?.includes(s)
    );
  }, [clients, search]);

  const profilePercent = (c: any) => {
    let p = 0;
    if (c.name) p += 20;
    if (c.email) p += 20;
    if (c.phone) p += 20;
    if (c.cpf) p += 20;
    if (c.birthDate) p += 20;
    return p;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Inter',sans-serif]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Users size={24} className="text-[#FF6B00]" />
          <h1 className="text-2xl font-black">Clientes</h1>
          <span className="text-sm text-[#999] font-medium">{clients.length} registros</span>
        </div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-white rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00] transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#FF6B00]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#999]">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">{search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((c) => (
              <Link key={c.id} href={`/owner/clients/${c.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-[#EAEAEA] hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B00] font-bold text-lg shrink-0">
                  {(c.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#1F1F1F] truncate">{c.name || "Sem nome"}</span>
                    {c.isBlocked && <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">BLOQUEADO</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[#666] flex-wrap">
                    {c.email && <span className="flex items-center gap-1"><Mail size={12} />{c.email}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone size={12} />{c.phone}</span>}
                    {c.totalOrders > 0 && <span className="flex items-center gap-1"><ShoppingBag size={12} />{c.totalOrders} pedidos</span>}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-[120px]">
                      <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${profilePercent(c)}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-[#999]">{profilePercent(c)}%</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#ccc] shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
