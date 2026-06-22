"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, orderBy } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { ArrowLeft, Phone, Mail, ShoppingBag, DollarSign, Calendar, MapPin, Shield, Lock, Unlock, Loader2, MessageSquare } from "lucide-react";
import { useConfirm } from "@/app/components/ConfirmProvider";
import { logger } from "@/src/lib/logger";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showConfirm } = useConfirm();
  const [client, setClient] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(firestore, "users", id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setClient({ id, ...d });
        setNotes(d.internalNotes || "");
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(firestore, "orders"), where("customerId", "==", id), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id]);

  const toggleBlock = async () => {
    if (!client) return;
    const msg = client.isBlocked ? "Desbloquear este cliente?" : "Bloquear este cliente?";
    if (!await showConfirm(msg)) return;
    await updateDoc(doc(firestore, "users", id), { isBlocked: !client.isBlocked });
    setClient((p: any) => ({ ...p, isBlocked: !p.isBlocked }));
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateDoc(doc(firestore, "users", id), { internalNotes: notes });
    } catch (err) {
      logger.error("CLIENT_DETAIL", "Erro ao salvar observações", err);
    }
    setSavingNotes(false);
  };

  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
  const avgTicket = orders.length > 0 ? totalSpent / orders.length : 0;
  const lastOrder = orders.length > 0 ? orders[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <p className="text-[#999]">Cliente não encontrado</p>
      </div>
    );
  }

  const infoCards = [
    { label: "Total de Pedidos", value: orders.length, icon: ShoppingBag, color: "#2563eb", bg: "#eff6ff" },
    { label: "Total Gasto", value: `R$ ${totalSpent.toFixed(2)}`, icon: DollarSign, color: "#16a34a", bg: "#f0fdf4" },
    { label: "Ticket Médio", value: `R$ ${avgTicket.toFixed(2)}`, icon: DollarSign, color: "#d97706", bg: "#fffbeb" },
    { label: "Último Pedido", value: lastOrder ? new Date(lastOrder.createdAt?.seconds * 1000 || lastOrder.createdAt).toLocaleDateString("pt-BR") : "-", icon: Calendar, color: "#9333ea", bg: "#faf5ff" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Inter',sans-serif]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#666] hover:text-[#1F1F1F] mb-6 transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="flex items-start gap-4 mb-8 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B00] font-bold text-2xl shrink-0">
            {(client.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black">{client.name || "Sem nome"}</h1>
              {client.isBlocked && <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full">BLOQUEADO</span>}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-[#666] flex-wrap">
              {client.email && <span className="flex items-center gap-1"><Mail size={14} />{client.email}</span>}
              {client.phone && <span className="flex items-center gap-1"><Phone size={14} />{client.phone}</span>}
              <span className="flex items-center gap-1"><Calendar size={14} />Cadastro: {client.createdAt?.seconds ? new Date(client.createdAt.seconds * 1000).toLocaleDateString("pt-BR") : "-"}</span>
            </div>
          </div>
          <button onClick={toggleBlock} className={`flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all ${client.isBlocked ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {client.isBlocked ? <Unlock size={16} /> : <Lock size={16} />}
            {client.isBlocked ? "Desbloquear" : "Bloquear"}
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {infoCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-4 border border-[#EAEAEA]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                  <card.icon size={16} style={{ color: card.color }} />
                </div>
                <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">{card.label}</span>
              </div>
              <span className="text-lg font-black" style={{ color: card.color }}>{card.value}</span>
            </div>
          ))}
        </div>

        {/* Dados cadastrais */}
        <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 mb-6">
          <h2 className="font-bold text-sm mb-4">Dados Cadastrais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "CPF", value: client.cpf || "—" },
              { label: "Data de Nascimento", value: client.birthDate || "—" },
              { label: "Provider", value: client.provider || "email" },
              { label: "Perfil Completo", value: (() => { let p = 0; if (client.name) p += 20; if (client.email) p += 20; if (client.phone) p += 20; if (client.cpf) p += 20; if (client.birthDate) p += 20; return p + "%"; })() },
            ].map((f) => (
              <div key={f.label}>
                <span className="text-[10px] font-bold text-[#999] uppercase">{f.label}</span>
                <p className="text-sm font-medium text-[#1F1F1F] mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Observações internas */}
        <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2"><MessageSquare size={16} /> Observações Internas</h2>
            <button onClick={saveNotes} disabled={savingNotes} className="text-xs font-bold text-[#FF6B00] hover:underline">
              {savingNotes ? "Salvando..." : "Salvar"}
            </button>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full p-3 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00] resize-none"
            placeholder="Observações internas sobre o cliente..." />
        </div>

        {/* Endereços */}
        <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 mb-6">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><MapPin size={16} /> Endereços Salvos</h2>
          <AddressesList userId={id} />
        </div>

        {/* Pedidos */}
        <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><ShoppingBag size={16} /> Histórico de Pedidos ({orders.length})</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-[#999] italic">Nenhum pedido realizado.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl text-sm">
                  <div>
                    <span className="font-bold text-[#1F1F1F]">#{o.id.slice(-6).toUpperCase()}</span>
                    <span className="text-[#666] ml-2">{new Date(o.createdAt?.seconds * 1000 || o.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle(o.status)}`}>{o.status}</span>
                    <span className="font-bold">R$ {(o.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressesList({ userId }: { userId: string }) {
  const [addresses, setAddresses] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(firestore, "addresses"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => setAddresses(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [userId]);

  if (addresses.length === 0) return <p className="text-sm text-[#999] italic">Nenhum endereço salvo.</p>;
  return (
    <div className="flex flex-col gap-2">
      {addresses.map((a) => (
        <div key={a.id} className="flex items-center gap-2 p-3 bg-[#FAFAFA] rounded-xl text-sm">
          <MapPin size={14} className="text-[#FF6B00] shrink-0" />
          <span>{a.street}, {a.number}{a.neighborhood ? ` - ${a.neighborhood}` : ""}</span>
          {a.enabled === false && <span className="text-[10px] text-red-500 font-bold ml-auto">INATIVO</span>}
        </div>
      ))}
    </div>
  );
}

function statusStyle(s: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700",
    paid: "bg-blue-50 text-blue-700",
    preparing: "bg-orange-50 text-orange-700",
    ready: "bg-green-50 text-green-700",
    delivering: "bg-purple-50 text-purple-700",
    finished: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-50 text-red-700",
  };
  return map[s] || "bg-gray-100 text-gray-500";
}
