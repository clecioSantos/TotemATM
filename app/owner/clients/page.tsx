"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { UserProfile } from "@totem/shared/types/auth";
import { Search, ChevronRight, Users, Phone, Mail, ShoppingBag, DollarSign, Loader2, Shield, User, Star, Briefcase } from "lucide-react";
import Link from "next/link";

const roles = [
  { key: "all", label: "Todos", icon: Users },
  { key: "client", label: "Clientes", icon: User },
  { key: "admin", label: "Admin", icon: Shield },
  { key: "owner", label: "Owner", icon: Star },
  { key: "collaborator", label: "Colaborador", icon: Briefcase },
];

const roleColors: Record<string, string> = {
  client: "bg-blue-50 text-blue-700",
  admin: "bg-purple-50 text-purple-700",
  owner: "bg-orange-50 text-orange-700",
  collaborator: "bg-gray-100 text-gray-700",
};

export default function OwnerClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "users"), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClients(all.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = clients;
    if (roleFilter !== "all") list = list.filter((c: any) => c.role === roleFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c) =>
        c.name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.phone?.includes(s)
      );
    }
    return list;
  }, [clients, search, roleFilter]);

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
          <h1 className="text-2xl font-black">Usuários</h1>
          <span className="text-sm text-[#999] font-medium">{clients.length} registros</span>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {roles.map((r) => (
            <button key={r.key} onClick={() => setRoleFilter(r.key)}
              className={`flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                roleFilter === r.key ? "bg-[#FF6B00] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <r.icon size={14} />
              {r.label}
            </button>
          ))}
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
                    {c.role && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[c.role] || "bg-gray-100 text-gray-700"}`}>{c.role}</span>}
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
