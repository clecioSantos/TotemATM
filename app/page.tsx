"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/src/services/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Link from "next/link";
import { Search, MapPin, User, ShoppingBag, Store, X, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@totem/shared/types/AuthProvider";

const categories = [
  { name: "Lanches", icon: "🍔" },
  { name: "Pizza", icon: "🍕" },
  { name: "Japonês", icon: "🍣" },
  { name: "Doces", icon: "🍰" },
  { name: "Bebidas", icon: "🥤" },
];

export default function HomePage() {
  const [stores, setStores] = useState<any[]>([]);
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const [userOrders, setUserOrders] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(firestore, "companies"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isOrdersOpen) return;
    const q = query(collection(firestore, "orders"), where("customerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, isOrdersOpen]);

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    preparing: "Preparando",
    ready: "Pronto",
    delivering: "Em entrega",
    finished: "Finalizado",
    cancelled: "Cancelado",
  };

  const finishedOrders = userOrders
    .filter(o => o.status === 'finished' || o.status === 'cancelled')
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const activeOrders = userOrders
    .filter(o => o.status !== 'finished' && o.status !== 'cancelled')
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const OrderItem = ({ o }: { o: any }) => {
    const store = stores.find(s => s.id === o.companyId);
    
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg mb-2 overflow-hidden">
        <div 
          className="p-3 flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
        >
          <div>
            <div className="font-bold text-sm">{store?.name || o.companyName || "Loja"}</div>
            <div className="text-xs text-brand-muted">{o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'Data indisponível'}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-sm text-brand-primary">R$ {o.total?.toFixed(2)}</div>
            <div className="text-[10px] uppercase font-bold text-brand-muted">{statusLabels[o.status] || o.status}</div>
          </div>
        </div>
        {expandedOrderId === o.id && (
          <div className="p-3 bg-brand-light text-xs space-y-2 border-t border-brand-border">
            <p><strong>Status:</strong> {statusLabels[o.status] || o.status}</p>
            <p><strong>Pedido:</strong> #{o.id.slice(-6).toUpperCase()}</p>
            <p><strong>Endereço:</strong> {o.address?.street}, {o.address?.number} {o.address?.complement ? `- ${o.address.complement}` : ''}</p>
            <p><strong>Bairro:</strong> {o.address?.neighborhood}</p>
            <div className="pt-2 border-t border-brand-border">
              <p className="font-bold mb-1">Itens:</p>
              {o.items?.map((item: any, idx: number) => (
                <p key={idx}>{item.quantity}x {item.name}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-brand-light pb-20">
      <header className="sticky top-0 bg-brand-surface z-10 p-2 border-b border-brand-border flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center text-sm font-semibold">
            <img src="/logo.png" alt="Bora De Delivery" className="h-[50px] w-auto" />
          </div>
          <div className="bg-[#F0F0F0] h-10 rounded-[12px] flex items-center px-4 text-brand-muted text-sm mt-1">
            <Search className="h-4 w-4 mr-3" />
            Buscar lojas ou produtos
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button 
            onClick={() => setIsOrdersOpen(true)}
            className="p-2 bg-brand-surface rounded-[12px] border border-brand-border text-brand-dark"
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="p-2 bg-brand-surface rounded-[12px] border border-brand-border text-brand-dark"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Modais de Perfil e Pedidos (Simplificados) */}
      {(isProfileOpen || isOrdersOpen) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => {setIsProfileOpen(false); setIsOrdersOpen(false);}}>
          <div className="bg-brand-surface w-full max-w-[430px] rounded-t-[24px] p-6 shadow-2xl animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{isProfileOpen ? "Meu Perfil" : "Meus Pedidos"}</h3>
              <button onClick={() => {setIsProfileOpen(false); setIsOrdersOpen(false);}}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[70vh] p-1">
              {isProfileOpen ? (
                <div className="space-y-4">
                  <p className="text-sm">Olá, {user?.name || "Usuário"}</p>
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <Link href="/admin" className="block p-3 bg-brand-primary text-white text-center rounded-lg font-bold">Acessar Painel Admin</Link>
                  )}
                  <button onClick={() => signOut()} className="flex items-center gap-2 text-red-500 font-bold w-full"><LogOut size={18} /> Sair</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-sm mb-2 text-brand-muted">Em andamento</h4>
                    {activeOrders.length === 0 ? <p className="text-xs text-brand-muted italic">Nenhum pedido ativo.</p> : activeOrders.map(o => <OrderItem key={o.id} o={o} />)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-2 text-brand-muted">Finalizados</h4>
                    {finishedOrders.length === 0 ? <p className="text-xs text-brand-muted italic">Nenhum pedido finalizado.</p> : finishedOrders.map(o => <OrderItem key={o.id} o={o} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Banner de Promoção */}
        <div className="w-full h-32 rounded-[16px] bg-gradient-to-r from-brand-primary to-brand-primaryHover p-6 text-white flex flex-col justify-center mb-6 shadow-sm">
          <h2 className="text-xl font-bold">Ofertas da Semana</h2>
          <p className="text-sm opacity-90">Confira nossas promoções exclusivas!</p>
        </div>

        {/* Categorias */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {categories.map((cat, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className="w-16 h-16 bg-brand-surface rounded-[16px] flex items-center justify-center text-2xl shadow-sm border border-brand-border">
                {cat.icon}
              </div>
              <span className="text-xs font-semibold text-brand-muted">{cat.name}</span>
            </div>
          ))}
        </div>

        <h3 className="text-xl font-bold mb-4 mt-2">Unidades Disponíveis</h3>
        
        <div className="flex flex-col gap-4">
          {stores.map((store) => (
            <Link 
              key={store.id} 
              href={`/totem/${store.id}`}
              className="bg-brand-surface rounded-[16px] p-4 flex gap-4 items-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brand-border transition-transform active:scale-[0.98]"
            >
              <div className="w-16 h-16 bg-[#eee] rounded-[12px] flex items-center justify-center text-2xl font-bold">
                {store.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-brand-dark mb-1">{store.name}</h4>
                <div className="flex items-center text-xs text-brand-muted gap-2">
                  <span className="text-brand-alert font-bold">⭐ 4.8</span> 
                  <span>• 30-40 min</span>
                </div>
              </div>
              <Store className="h-5 w-5 text-brand-primary" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
