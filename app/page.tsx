"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/src/services/firebase";
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { Search, MapPin, User, ShoppingBag, Store, X, LogOut, ChevronRight, Plus, Trash2, Home } from "lucide-react";
import { useAuth } from "@totem/shared/types/AuthProvider";

export default function HomePage() {
  const [stores, setStores] = useState<any[]>([]);
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Estados de Endereços
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressCity, setAddressCity] = useState("");
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [cities, setCities] = useState<any[]>([]);

  const categories = [
    { name: "Lanches", icon: "🍔" },
    { name: "Pizza", icon: "🍕" },
    { name: "Japonês", icon: "🍣" },
    { name: "Doces", icon: "🍰" },
    { name: "Mercado", icon: "🛒" },
  ];

  const [storeCitySettings, setStoreCitySettings] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "storeCitySettings"), (snap) => {
        setStoreCitySettings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filteredStores = stores.filter(store => {
      const matchesName = store.name.toLowerCase().includes(search.toLowerCase());
      
      let matchesCity = true;
      if (cityFilter) {
          // Verifica se a loja possui configuração para essa cidade
          const hasSettings = storeCitySettings.some(s => s.companyId === store.id && s.cityId === cityFilter && s.enabled);
          matchesCity = hasSettings;
      }
      
      return matchesName && matchesCity;
  });


  useEffect(() => {
    const q = query(collection(firestore, "companies"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubCities = onSnapshot(collection(firestore, "cities"), (snap) => {
        const citiesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCities(citiesData);
        setAvailableCities(citiesData);
    });
    return () => unsubCities();
  }, []);

  // Sincronizar endereços do usuário
  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestore, "addresses"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAddresses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Carregar bairros dinamicamente
  useEffect(() => {
    if (!addressCity) {
      setAvailableNeighborhoods([]);
      return;
    }
    const q = query(collection(firestore, "neighborhoods"), where("cityId", "==", addressCity), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAvailableNeighborhoods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [addressCity]);

  useEffect(() => {
    if (!user || !isOrdersOpen) return;
    const q = query(collection(firestore, "orders"), where("customerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, isOrdersOpen]);

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Deseja realmente excluir este endereço?")) return;
    try {
      await deleteDoc(doc(firestore, "addresses", addressId));
      if (isEditing === addressId) resetAddressForm();
    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
    }
  };

  const resetAddressForm = () => {
    setIsEditing(null);
    setAddressStreet("");
    setAddressNumber("");
    setAddressNeighborhood("");
    setAddressComplement("");
    setAddressCity("");
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addressStreet || !addressNumber || !addressNeighborhood || !addressCity) return;
    setSavingAddress(true);
    const neighborhoodObj = availableNeighborhoods.find(n => n.id === addressNeighborhood);
    const neighborhoodName = neighborhoodObj?.name || addressNeighborhood;
    try {
        if (isEditing) {
            await updateDoc(doc(firestore, "addresses", isEditing), {
                street: addressStreet,
                number: addressNumber,
                cityId: addressCity,
                neighborhood: neighborhoodName,
                neighborhoodId: neighborhoodObj?.id || "",
                complement: addressComplement,
            });
            setIsEditing(null);
            alert("Endereço atualizado!");
        } else {
            await addDoc(collection(firestore, "addresses"), {
                userId: user.uid,
                street: addressStreet,
                number: addressNumber,
                cityId: addressCity,
                neighborhood: neighborhoodName,
                neighborhoodId: neighborhoodObj?.id || "",
                complement: addressComplement,
                enabled: true,
                createdAt: serverTimestamp(),
            });
            alert("Endereço adicionado!");
        }
        resetAddressForm();
    } finally { setSavingAddress(false); }
  };



  if (loading) {
    return (
      <main className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img src="/Logo.png" alt="Logo" className="h-24 w-auto mb-6 animate-pulse" />
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

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
          <div className="flex flex-col gap-2 mt-1">
            <div className="bg-[#F0F0F0] h-10 rounded-[12px] flex items-center px-4 text-brand-muted text-sm">
                <Search className="h-4 w-4 mr-3" />
                <input className="bg-transparent w-full outline-none" placeholder="Buscar lojas..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="bg-[#F0F0F0] h-10 rounded-[12px] px-4 text-brand-muted text-sm" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                <option value="">Todas as cidades</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
        {(isProfileOpen || isOrdersOpen || isAddressesOpen) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => {setIsProfileOpen(false); setIsOrdersOpen(false); setIsAddressesOpen(false);}}>
          <div className="bg-brand-surface w-full max-w-[430px] rounded-t-[24px] p-6 shadow-2xl animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">
                {isProfileOpen ? "Meu Perfil" : isAddressesOpen ? "Meus Endereços" : "Meus Pedidos"}
              </h3>
              <button onClick={() => {setIsProfileOpen(false); setIsOrdersOpen(false); setIsAddressesOpen(false);}}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[70vh] p-1">
              {isProfileOpen ? (
                <div className="space-y-4">
                  <p className="text-sm">Olá, {user?.name || "Usuário"}</p>
                  <button 
                    onClick={() => {setIsProfileOpen(false); setIsAddressesOpen(true);}}
                    className="w-full flex items-center gap-3 p-3 bg-brand-light rounded-lg font-bold text-sm"
                  >
                    <MapPin size={18} /> Meus Endereços
                  </button>
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <Link href="/admin" className="block p-3 bg-brand-primary text-white text-center rounded-lg font-bold">Acessar Painel Admin</Link>
                  )}
                  <button onClick={() => signOut()} className="flex items-center gap-2 text-red-500 font-bold w-full"><LogOut size={18} /> Sair</button>
                </div>
              ) : isAddressesOpen ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto">
                    {addresses.map(addr => (
                      <div key={addr.id} className="p-3 bg-brand-light rounded-lg flex justify-between items-center border border-brand-border">
                        <div>
                          <p className="font-bold text-xs">{addr.street}, {addr.number}</p>
                          <p className="text-[10px] text-brand-muted">{addr.neighborhood}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { 
                            setIsEditing(addr.id); 
                            setAddressStreet(addr.street); 
                            setAddressNumber(addr.number); 
                          setAddressCity(addr.cityId || "");
                          setAddressNeighborhood(addr.neighborhoodId || addr.neighborhood); 
                            setAddressComplement(addr.complement || ""); 
                          }} className="p-1 hover:bg-brand-surface rounded-lg"><ChevronRight className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="p-1 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddAddress} className="space-y-2 pt-4 border-t border-brand-border mt-2">
                    <div className="grid grid-cols-4 gap-2">
                      <input required className="col-span-3 p-2 bg-brand-light rounded-lg border border-brand-border text-xs" placeholder="Rua" value={addressStreet} onChange={e => setAddressStreet(e.target.value)} />
                      <input required className="col-span-1 p-2 bg-brand-light rounded-lg border border-brand-border text-xs" placeholder="Nº" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} />
                    </div>
                    <select required className="w-full p-2 bg-brand-light rounded-lg border border-brand-border text-xs" value={addressCity} onChange={e => setAddressCity(e.target.value)}>
                        <option value="">Selecione a cidade</option>
                        {availableCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select required className="w-full p-2 bg-brand-light rounded-lg border border-brand-border text-xs" value={addressNeighborhood} onChange={e => setAddressNeighborhood(e.target.value)} disabled={!addressCity}>
                        <option value="">Selecione o bairro</option>
                        {availableNeighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                    <input className="w-full p-2 bg-brand-light rounded-lg border border-brand-border text-xs" placeholder="Complemento" value={addressComplement} onChange={e => setAddressComplement(e.target.value)} />
                    <button type="submit" className="w-full p-3 bg-brand-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs" disabled={savingAddress}>
                        {savingAddress ? "Salvando..." : isEditing ? <><Plus className="h-4 w-4"/> Salvar Alterações</> : <><Plus className="h-4 w-4"/> Adicionar Endereço</>}
                    </button>
                    {isEditing && <button type="button" onClick={resetAddressForm} className="w-full p-1 text-xs text-brand-muted underline text-center">Cancelar edição</button>}
                  </form>
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
          {filteredStores.map((store) => (
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
