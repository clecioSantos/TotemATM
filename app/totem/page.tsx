"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/src/services/firebase";
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, orderBy, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { useConfirm } from "@/app/components/ConfirmProvider";
import CompleteProfileModal from "@/app/components/CompleteProfileModal";
import ProfileDropdown from "@/app/components/ProfileDropdown";
import { Search, MapPin, User, ShoppingBag, Store, X, LogOut, ChevronRight, Plus, Trash2, Home, Bell, ChevronLeft, ChevronRight as ChevronRightIcon, Tag, Loader2, Heart, Shield } from "lucide-react";
import { logger } from "@/src/lib/logger";
import NotificationsPanel from "./components/NotificationsPanel";
import { useNotifications } from "./hooks/useNotifications";
import { usePromotionsForListing } from "./hooks/usePromotionsForListing";

const categories = [
  { name: "Todas", icon: "★", key: "all" },
  { name: "Lanches", icon: "🍔", key: "Lanches" },
  { name: "Pizzas", icon: "🍕", key: "Pizzas" },
  { name: "Pratos", icon: "🍽️", key: "Pratos" },
  { name: "Marmitas", icon: "🥡", key: "Marmitas" },
  { name: "Porções", icon: "🍟", key: "Porções" },
  { name: "Bebidas", icon: "🥤", key: "Bebidas" },
  { name: "Sobremesas", icon: "🍰", key: "Sobremesas" },
  { name: "Açaí", icon: "🫐", key: "Açaí" },
  { name: "Sushi", icon: "🍣", key: "Sushi" },
  { name: "Padaria", icon: "🥐", key: "Padaria e Confeitaria e mercado" },
];

export default function StoreListingPage() {
  const { user, signOut, refreshProfile } = useAuth();
  const { showAlert, showConfirm } = useConfirm();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [cities, setCities] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
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
  const [editingProfile, setEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfilePhone, setEditProfilePhone] = useState("");
  const [editProfileCpf, setEditProfileCpf] = useState("");
  const [editProfileBirthDate, setEditProfileBirthDate] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [completeProfileDismissed, setCompleteProfileDismissed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, any>>({});
  const { unreadCount } = useNotifications(user?.uid);
  const { events, promotions, getStoresForEvent, loading: promosLoading } = usePromotionsForListing();
  const [dayPromoProducts, setDayPromoProducts] = useState<any[]>([]);
  const [dayPromoLoading, setDayPromoLoading] = useState(true);
  const [carouselScrolls, setCarouselScrolls] = useState<Record<string, number>>({});

  useEffect(() => {
    const q = query(collection(firestore, "products"), where("hasDayPromotion", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setDayPromoProducts(all.filter((p: any) => p.active !== false));
      setDayPromoLoading(false);
    }, (err) => { logger.error("TOTEM_PAGE", "Erro ao carregar promoções diárias", err); setDayPromoLoading(false); });
    return () => unsub();
  }, []);

  const isSandbox = process.env.NEXT_PUBLIC_MERCADOPAGO_ENVIRONMENT?.toLowerCase() === "sandbox"
    || process.env.NEXT_PUBLIC_MERCADOPAGO_ENVIRONMENT?.toLowerCase() === "test";

  const activeCategories = categories.filter((cat) => 
    cat.key === "all" || stores.some((store) => store.areasAtuacao?.includes(cat.key))
  );

  const filteredStores = stores.filter((store) => {
    const matchesName = store.name.toLowerCase().includes(search.toLowerCase());
    let matchesCity = true;
    if (cityFilter) {
      const selectedCity = cities.find((c) => c.id === cityFilter);
      matchesCity = selectedCity ? store.cidade === selectedCity.name : false;
    }
    let matchesCategory = true;
    if (categoryFilter !== "all") {
      matchesCategory = store.areasAtuacao?.includes(categoryFilter);
    }
    const matchesEnabled = isSandbox ? true : store.enabled !== false && store.enabled !== "false";
    return matchesName && matchesCity && matchesCategory && matchesEnabled;
  });

  useEffect(() => {
    const q = query(collection(firestore, "companies"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStores(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubCities = onSnapshot(collection(firestore, "cities"), (snap) => {
      const citiesData = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name));
      setCities(citiesData);
      setAvailableCities(citiesData);
    });
    return () => unsubCities();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestore, "addresses"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        setAddresses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        logger.error("TOTEM_PAGE", "Erro ao processar endereços", error);
      }
    }, (error) => {
      logger.error("TOTEM_PAGE", "Erro no listener de endereços", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!addressCity) {
      setAvailableNeighborhoods([]);
      return;
    }
    const q = query(collection(firestore, "neighborhoods"), where("cityId", "==", addressCity), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        setAvailableNeighborhoods(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        logger.error("TOTEM_PAGE", "Erro ao processar bairros", error);
      }
    }, (error) => {
      logger.error("TOTEM_PAGE", "Erro no listener de bairros", error);
    });
    return () => unsubscribe();
  }, [addressCity]);

  useEffect(() => {
    if (!user || !isOrdersOpen) return;
    const q = query(collection(firestore, "orders"), where("customerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        setUserOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        logger.error("TOTEM_PAGE", "Erro ao processar pedidos", error);
      }
    }, (error) => {
      logger.error("TOTEM_PAGE", "Erro no listener de pedidos", error);
    });
    return () => unsubscribe();
  }, [user, isOrdersOpen]);

  const handleDeleteAddress = async (addressId: string) => {
    if (!await showConfirm("Deseja realmente excluir este endereço?")) return;
    try {
      await deleteDoc(doc(firestore, "addresses", addressId));
      if (isEditing === addressId) resetAddressForm();
    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
    }
  };

  const formatPhone = (phone: string) => {
    const d = phone.replace(/\D/g, '');
    if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`;
    if (d.length === 12) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,8)}-${d.slice(8)}`;
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return phone;
  };

  const resetAddressForm = () => {
    setIsEditing(null);
    setAddressStreet("");
    setAddressNumber("");
    setAddressNeighborhood("");
    setAddressComplement("");
    setAddressCity("");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        name: editProfileName.trim(),
        phone: editProfilePhone.trim() || "",
        cpf: editProfileCpf.replace(/\D/g, "") || "",
        birthDate: editProfileBirthDate || "",
      });
      setEditingProfile(false);
      refreshProfile();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!user || (user as any)?.cpf || completeProfileDismissed) return;
    const finishedCount = userOrders.filter((o) => o.status === "finished").length;
    if (finishedCount >= 5) setShowCompleteProfile(true);
  }, [user, userOrders, completeProfileDismissed]);

  useEffect(() => {
    if (!profileDropdownOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".profile-dropdown-container")) setProfileDropdownOpen(false);
    };
    setTimeout(() => document.addEventListener("click", close), 0);
    return () => document.removeEventListener("click", close);
  }, [profileDropdownOpen]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(firestore, "users", user.uid)).then((snap) => {
      if (snap.exists()) setFavorites(snap.data().favorites || {});
    }).catch(() => {});
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addressStreet || !addressNumber || !addressNeighborhood || !addressCity) return;
    setSavingAddress(true);
    const neighborhoodObj = availableNeighborhoods.find((n) => n.id === addressNeighborhood);
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
        await showAlert("Endereço atualizado!");
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
        await showAlert("Endereço adicionado!");
      }
      resetAddressForm();
    } catch (error) {
      logger.error("TOTEM_PAGE", "Erro ao salvar endereço", error);
      await showAlert("Erro ao salvar endereço. Tente novamente.");
    } finally {
      setSavingAddress(false);
    }
  };

  const getStatusLabel = (o: any) => {
    const isPickup = o.deliveryMode === "pickup";
    const labels: Record<string, string> = {
      pending: "Pendente",
      paid: "Pago",
      awating_customization: "Aguardando Alinhamento",
      preparing: "Preparando",
      ready: "Pronto",
      delivering: isPickup ? "Aguardando Retirada" : "Em entrega",
      finished: isPickup ? "Retirado" : "Finalizado",
      cancelled: "Cancelado",
    };
    return labels[o.status] || o.status;
  };

  const finishedOrders = userOrders
    .filter((o) => o.status === "finished" || o.status === "cancelled")
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const activeOrders = userOrders
    .filter((o) => o.status !== "finished" && o.status !== "cancelled")
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const OrderItem = ({ o }: { o: any }) => {
    const store = stores.find((s) => s.id === o.companyId);
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg mb-2 overflow-hidden">
        <div
          className="p-3 flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
        >
          <div>
            <div className="font-bold text-sm">{store?.name || o.companyName || "Loja"}</div>
            <div className="text-xs text-brand-muted">
              {o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : "Data indisponível"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-sm text-brand-primary">R$ {o.total?.toFixed(2)}</div>
            <div className="text-[10px] uppercase font-bold text-brand-muted">{getStatusLabel(o)}</div>
          </div>
        </div>
      {expandedOrderId === o.id && (
        <div className="p-3 bg-brand-light text-xs space-y-2 border-t border-brand-border">
          <p><strong>Status:</strong> {getStatusLabel(o)}</p>
            <p><strong>Pedido:</strong> {`#${o.id.slice(-6).toUpperCase()}`}</p>
            <p><strong>Endereço:</strong> {o.address?.street}, {o.address?.number} {o.address?.complement ? `- ${o.address.complement}` : ""}</p>
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/Logo.png" alt="" className="h-16 w-auto animate-pulse" />
          <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-['Inter',sans-serif] pb-20">
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .animate-slide-up { animation: slideUp 0.35s ease-out both }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
      <header className="sticky top-0 bg-white z-10 border-b border-[#EAEAEA]">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <img src="/Logo.png" alt="Bora De Delivery" className="h-[42px] w-auto" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setIsNotificationsOpen(true); setIsProfileOpen(false); setIsOrdersOpen(false); setIsAddressesOpen(false); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#666] hover:bg-gray-100 transition-colors relative"
              title="Notificações"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 shadow-md">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setIsFavoritesOpen(true); setIsNotificationsOpen(false); setIsOrdersOpen(false); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#666] hover:bg-gray-100 transition-colors"
              title="Favoritos"
            >
              <Heart className="h-5 w-5" />
            </button>
            <button
              onClick={() => { setIsOrdersOpen(true); setIsNotificationsOpen(false); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#666] hover:bg-gray-100 transition-colors"
              title="Pedidos"
            >
              <ShoppingBag className="h-5 w-5" />
            </button>
            <div className="relative profile-dropdown-container">
              <button
                onClick={() => { setShowCompleteProfile(false); setCompleteProfileDismissed(true); setProfileDropdownOpen(!profileDropdownOpen); setIsNotificationsOpen(false); }}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#666] hover:bg-gray-200 transition-colors"
                title="Perfil"
              >
                <User className="h-5 w-5" />
              </button>
              <ProfileDropdown
                open={profileDropdownOpen}
                onClose={() => setProfileDropdownOpen(false)}
                user={user}
                onEditProfile={() => { setEditProfileName(user?.name || ""); setEditProfilePhone((user as any)?.phone || ""); setEditProfileCpf((user as any)?.cpf || ""); setEditProfileBirthDate((user as any)?.birthDate || ""); setEditingProfile(true); setProfileDropdownOpen(false); }}
                onAddresses={() => { setProfileDropdownOpen(false); setIsAddressesOpen(true); }}
                onSignOut={() => { setProfileDropdownOpen(false); signOut(); }}
              />
            </div>
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center gap-2">
          <select
            className="h-11 bg-[#F0F0F0] rounded-[12px] px-3 text-sm font-semibold text-[#1F1F1F] outline-none cursor-pointer min-w-[120px] appearance-none"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              paddingRight: "32px",
            }}
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999] pointer-events-none" />
            <input
              className="w-full h-11 bg-[#F0F0F0] rounded-[12px] pl-9 pr-4 text-sm text-[#1F1F1F] outline-none placeholder:text-[#999]"
              placeholder="Buscar lojas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <NotificationsPanel
        userId={user?.uid}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Profile & Orders Modals */}
      {(isOrdersOpen || isAddressesOpen || editingProfile) && (
        <div
          className={`fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm ${editingProfile || isAddressesOpen ? 'items-start sm:items-center' : 'items-end sm:items-center'}`}
          onClick={() => { setIsOrdersOpen(false); setIsAddressesOpen(false); setEditingProfile(false); }}
        >
          <div
            className={`bg-white w-full shadow-2xl animate-slide-up ${editingProfile || isAddressesOpen ? 'min-h-screen sm:min-h-0 sm:max-w-lg sm:rounded-2xl sm:mx-auto sm:my-8 p-6' : 'max-w-[430px] rounded-t-[24px] p-6'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {editingProfile ? (
              <>
                <div className="sticky top-0 bg-white border-b border-[#EAEAEA] px-5 py-4 flex items-center justify-between z-10">
                  <button onClick={() => setEditingProfile(false)} className="flex items-center gap-1 text-sm font-bold text-[#666] hover:text-[#1F1F1F]">
                    <X size={18} /> Cancelar
                  </button>
                  <h3 className="font-bold text-base">Editar Perfil</h3>
                  <button onClick={handleSaveProfile} disabled={savingProfile}
                    className="text-sm font-bold text-[#FF6B00] hover:text-[#E65C00] disabled:opacity-50">
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
                  </button>
                </div>
                <div className="px-5 py-6 space-y-5">
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B00] font-bold text-3xl">
                      {(user?.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-bold">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Nome</label>
                    <input type="text" value={editProfileName} onChange={e => setEditProfileName(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Telefone</label>
                    <input type="tel" value={editProfilePhone} onChange={e => setEditProfilePhone(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]" placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">CPF <span className="text-[#999] font-normal normal-case">(opcional)</span></label>
                    <input type="text" inputMode="numeric" value={editProfileCpf} onChange={e => setEditProfileCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Data de Nascimento <span className="text-[#999] font-normal normal-case">(opcional)</span></label>
                    <input type="date" value={editProfileBirthDate} onChange={e => setEditProfileBirthDate(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]" />
                  </div>
                </div>
              </>
            ) : (
              <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">
                {isProfileOpen ? "Meu Perfil" : isAddressesOpen ? "Meus Endereços" : "Meus Pedidos"}
              </h3>
              <button onClick={() => { setIsProfileOpen(false); setIsOrdersOpen(false); setIsAddressesOpen(false); setEditingProfile(false); }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[70vh] p-1">
              {isProfileOpen ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">Olá, {user?.name || "Usuário"}</p>
                    <button onClick={() => { setEditProfileName(user?.name || ""); setEditProfilePhone((user as any)?.phone || ""); setEditProfileCpf((user as any)?.cpf || ""); setEditProfileBirthDate((user as any)?.birthDate || ""); setEditingProfile(true); }} className="text-[10px] font-bold text-[#FF6B00] uppercase">Editar</button>
                  </div>
                  {(user as any)?.phone && <p className="text-xs text-gray-500 -mt-2">{formatPhone((user as any)?.phone)}</p>}
                  <button
                    onClick={() => { setIsProfileOpen(false); setIsAddressesOpen(true); }}
                    className="w-full flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-lg font-bold text-sm"
                  >
                    <MapPin size={18} /> Meus Endereços
                  </button>
                  {(user as any)?.role === "admin" || (user as any)?.role === "owner" ? (
                    <Link href="/admin" className="block p-3 bg-[#FF6B00] text-white text-center rounded-lg font-bold">
                      Acessar Painel Admin
                    </Link>
                  ) : null}
                  {(user as any)?.role === "owner" ? (
                    <Link href="/owner" className="block p-3 bg-[#222] text-white text-center rounded-lg font-bold">
                      Acessar Painel Owner
                    </Link>
                  ) : null}
                  <button onClick={() => signOut()} className="flex items-center gap-2 text-red-500 font-bold w-full">
                    <LogOut size={18} /> Sair
                  </button>
                  <Link href="/privacy" className="flex items-center gap-2 text-gray-500 font-bold w-full text-sm">
                    <Shield size={18} /> Minha Privacidade
                  </Link>
                </div>
              ) : isAddressesOpen ? (
                <div className="space-y-5">
                  <div className="border-b border-[#EAEAEA] pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold">Meus Endereços</h3>
                        <p className="text-sm text-gray-500">Gerencie seus endereços no mesmo padrão da edição de perfil.</p>
                      </div>
                      {isEditing && (
                        <span className="text-xs font-semibold uppercase text-[#FF6B00]">Modo edição</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[34vh] overflow-y-auto">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-4 bg-[#FAFAFA] rounded-2xl flex justify-between items-center border border-[#EAEAEA]">
                        <div>
                          <p className="font-bold text-sm">{addr.street}, {addr.number}</p>
                          <p className="text-sm text-[#666]">{addr.neighborhood}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditing(addr.id);
                              setAddressStreet(addr.street);
                              setAddressNumber(addr.number);
                              setAddressCity(addr.cityId || "");
                              setAddressNeighborhood(addr.neighborhoodId || addr.neighborhood);
                              setAddressComplement(addr.complement || "");
                            }}
                            className="p-2 rounded-lg bg-white border border-[#EAEAEA] hover:bg-gray-50"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 rounded-lg bg-white border border-[#EAEAEA] text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddAddress} className="space-y-4 pt-4 border-t border-[#EAEAEA] mt-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Rua</label>
                        <input
                          required
                          className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]"
                          placeholder="Rua"
                          value={addressStreet}
                          onChange={(e) => setAddressStreet(e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nº</label>
                        <input
                          required
                          className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]"
                          placeholder="Nº"
                          value={addressNumber}
                          onChange={(e) => setAddressNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Cidade</label>
                        <select
                          required
                          className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]"
                          value={addressCity}
                          onChange={(e) => setAddressCity(e.target.value)}
                        >
                          <option value="">Selecione a cidade</option>
                          {availableCities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Bairro</label>
                      <select
                        required
                        className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]"
                        value={addressNeighborhood}
                        onChange={(e) => setAddressNeighborhood(e.target.value)}
                        disabled={!addressCity}
                      >
                        <option value="">Selecione o bairro</option>
                        {availableNeighborhoods.map((n) => (
                          <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Complemento</label>
                    <input
                      className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]"
                      placeholder="Complemento"
                      value={addressComplement}
                      onChange={(e) => setAddressComplement(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      className="w-full h-12 bg-[#FF6B00] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
                      disabled={savingAddress}
                    >
                      {savingAddress ? "Salvando..." : isEditing ? <><Plus className="h-4 w-4" /> Salvar Alterações</> : <><Plus className="h-4 w-4" /> Adicionar Endereço</>}
                    </button>
                    {isEditing && (
                      <button type="button" onClick={resetAddressForm} className="w-full h-12 bg-[#F3F4F6] text-[#333] font-bold rounded-xl text-sm">
                        Cancelar edição
                      </button>
                    )}
                  </div>
                </form>
              </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-sm mb-2 text-[#666]">Em andamento</h4>
                    {activeOrders.length === 0 ? (
                      <p className="text-xs text-[#666] italic">Nenhum pedido ativo.</p>
                    ) : (
                      activeOrders.map((o) => <OrderItem key={o.id} o={o} />)
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-2 text-[#666]">Finalizados</h4>
                    {finishedOrders.length === 0 ? (
                      <p className="text-xs text-[#666] italic">Nenhum pedido finalizado.</p>
                    ) : (
                      finishedOrders.map((o) => <OrderItem key={o.id} o={o} />)
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Event Blocks */}
        <div className="lg:flex lg:flex-wrap">
        {!promosLoading && events.map((ev) => {
          const storeIds = getStoresForEvent(ev.id);
          const eventStores = stores.filter((s) => {
            const inEvent = storeIds.includes(s.id);
            const matchesEnabled = isSandbox ? true : s.enabled !== false && s.enabled !== "false";
            return inEvent && matchesEnabled;
          });
          if (eventStores.length === 0) return null;

          const containerRefId = `event-container-${ev.id}`;

          return (
            <div key={ev.id} className="mb-6 lg:w-1/2 lg:inline-block lg:align-top lg:px-2 w-full" style={{ padding: "0 2% 2% 2%" }}>
              <div className="w-full rounded-[16px] overflow-hidden shadow-sm bg-white">
                {/* Title */}
                <div className="px-4 pt-4 pb-2">
                  <h2 className="text-xl font-bold text-[#1F1F1F]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{ev.name}</h2>
                  {ev.description && <p className="text-sm text-[#666] mt-0.5">{ev.description}</p>}
                </div>

                {/* Banner image - separate div between title and stores */}
                {ev.bannerUrl && (
                  <div className="px-4 pb-2">
                    <div className="w-full rounded-[12px] overflow-hidden" style={{ aspectRatio: "3/1" }}>
                      <img src={ev.bannerUrl} alt={ev.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {/* Stores area — white background */}
                <div className="p-3">
                  <div
                    className="flex gap-2 overflow-x-auto scrollbar-hide"
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      setCarouselScrolls((prev) => ({ ...prev, [ev.id]: el.scrollLeft }));
                    }}
                    ref={(el) => {
                      if (el && carouselScrolls[ev.id] !== undefined) {
                        el.scrollLeft = carouselScrolls[ev.id];
                      }
                    }}
                  >
                    {eventStores.map((store) => {
                      const closed = store.open === false;
                      return (
                        <Link
                          key={store.id}
                          href={`/totem/${store.id}`}
                          className={`flex-shrink-0 w-[120px] bg-white rounded-[12px] p-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#EAEAEA] transition-transform active:scale-[0.97] ${closed ? "opacity-70" : ""}`}
                        >
                          <div className="w-9 h-9 rounded-[10px] bg-[#eee] flex items-center justify-center overflow-hidden mx-auto mb-1.5">
                          {store.logo ? (
                            <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-[#999]">{store.name.charAt(0)}</span>
                          )}
                        </div>
                        <h4 className="text-[11px] font-bold text-[#1F1F1F] text-center truncate">{store.name}</h4>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-[9px] font-semibold text-[#FFB800]">
                              ⭐ {store.averageRating > 0 ? Number(store.averageRating).toFixed(1) : '--'}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!dayPromoLoading && dayPromoProducts.length > 0 && (() => {
          const today = new Date().getDay();
          const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
          const todayName = weekDays[today];
          const affectedStoreIds = new Set(dayPromoProducts.map((p: any) => p.companyId));
          const affectedStores = stores.filter((s) => affectedStoreIds.has(s.id));
          const matchesEnabled = (s: any) => isSandbox ? true : s.enabled !== false && s.enabled !== "false";
          const visibleStores = affectedStores.filter(matchesEnabled);
          if (visibleStores.length === 0) return null;

          return (
            <div className="mb-6 lg:w-1/2 lg:inline-block lg:align-top lg:px-2 w-full" style={{ padding: "0 2% 2% 2%" }}>
              <div className="w-full rounded-[16px] overflow-hidden shadow-sm bg-white">
                <div className="px-4 pt-4 pb-2">
                  <h2 className="text-xl font-bold text-[#1F1F1F]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>🔥 {todayName}</h2>
                  <p className="text-sm text-[#666] mt-0.5">Descontos especiais hoje!</p>
                </div>
                <div className="px-4 pb-2">
                  <div className="w-full rounded-[12px] overflow-hidden" style={{ aspectRatio: "3/1" }}>
                    <img src="/banner-bora-de-promocao.jpeg" alt="Promoções" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {visibleStores.map((store) => {
                      const closed = store.open === false;
                      return (
                        <Link key={store.id} href={`/totem/${store.id}`}
                          className={`flex-shrink-0 w-[120px] bg-white rounded-[12px] p-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#EAEAEA] transition-transform active:scale-[0.97] ${closed ? "opacity-70" : ""}`}>
                          <div className="w-9 h-9 rounded-[10px] bg-[#eee] flex items-center justify-center overflow-hidden mx-auto mb-1.5">
                            {store.logo ? <img src={store.logo} alt={store.name} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-[#999]">{store.name.charAt(0)}</span>}
                          </div>
                          <h4 className="text-[11px] font-bold text-[#1F1F1F] text-center truncate">{store.name}</h4>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <span className="text-[9px] font-semibold text-[#FFB800]">⭐ {store.averageRating > 0 ? Number(store.averageRating).toFixed(1) : '--'}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {activeCategories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setCategoryFilter(cat.key)}
              className="flex flex-col items-center gap-2 min-w-[70px]"
            >
              <div
                className={`w-16 h-16 rounded-[16px] flex items-center justify-center text-2xl shadow-sm border ${
                  categoryFilter === cat.key
                    ? "bg-[#FF6B00] text-white border-[#FF6B00]"
                    : "bg-white border-[#EAEAEA]"
                }`}
              >
                {cat.icon}
              </div>
              <span className={`text-xs font-semibold ${categoryFilter === cat.key ? "text-[#FF6B00]" : "text-[#666]"}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        <h3 className="text-xl font-bold mb-4 mt-2">Unidades Disponíveis</h3>

        <div className="flex flex-col gap-4">
          {filteredStores.map((store) => {
            const closed = store.open === false;
            return (
              <Link
                key={store.id}
                href={`/totem/${store.id}`}
                className={`bg-white rounded-[16px] p-4 flex gap-4 items-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#EAEAEA] transition-transform active:scale-[0.98] ${closed ? "opacity-75" : ""}`}
              >
                <div className="relative w-16 h-16 bg-[#eee] rounded-[12px] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {store.logo ? (
                    <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#999]">{store.name.charAt(0)}</span>
                  )}
                  {closed && <div className="absolute inset-0 bg-black/10 rounded-[12px]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-[#1F1F1F] truncate">{store.name}</h4>
                    {closed && (
                      <span className="text-[10px] font-bold text-[#FF4D4F] bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        Fechada
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-[#666] gap-2">
                    {closed ? (
                      <span className="text-red-500 font-semibold">Toque para ver o cardápio</span>
                    ) : (
                      <>
                        <span className="text-[#FFB800] font-bold">
                          {store.averageRating > 0 ? `⭐ ${Number(store.averageRating).toFixed(1)}` : '⭐ --'}
                        </span>
                        <span>• 30-40 min</span>
                      </>
                    )}
                  </div>
                </div>
                <Store className={`h-5 w-5 flex-shrink-0 ${closed ? "text-red-400" : "text-[#FF6B00]"}`} />
              </Link>
            );
          })}
          {filteredStores.length === 0 && (
            <div className="text-center py-12">
              <Store size={40} className="mx-auto text-[#ccc] mb-3" />
              <p className="text-sm text-[#666]">Nenhuma loja encontrada</p>
            </div>
          )}
        </div>
      </div>
      <CompleteProfileModal
        open={showCompleteProfile}
        userId={user?.uid || ""}
        currentCpf={(user as any)?.cpf}
        currentBirthDate={(user as any)?.birthDate}
        onClose={() => { setCompleteProfileDismissed(true); setShowCompleteProfile(false); }}
        onSaved={() => refreshProfile()}
      />

      {/* Favorites Modal */}
      {isFavoritesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center bg-black/40 backdrop-blur-sm"
          onClick={() => setIsFavoritesOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl sm:mx-auto sm:my-8 min-h-screen sm:min-h-0 p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Meus Favoritos</h3>
              <button onClick={() => setIsFavoritesOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {Object.keys(favorites).length === 0 ? (
                <p className="text-sm text-[#666] italic text-center py-8">Nenhum favorito ainda.</p>
              ) : (
                (() => {
                  const grouped: Record<string, any[]> = {};
                  Object.values(favorites).forEach((fav: any) => {
                    const store = fav.companyName || "Outros";
                    if (!grouped[store]) grouped[store] = [];
                    grouped[store].push(fav);
                  });
                  return Object.entries(grouped).map(([storeName, items]) => (
                    <div key={storeName}>
                      <h4 className="font-bold text-sm text-[#666] uppercase tracking-wider mb-3 flex items-center gap-2">
                        {items[0]?.companyLogo ? (
                          <img src={items[0].companyLogo} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <Store size={16} />
                        )}
                        {storeName}
                      </h4>
                      <div className="space-y-3">
                        {items.map((fav: any) => (
                          <Link
                            key={fav.productId}
                            href={`/totem/${fav.companyId}?product=${fav.productId}${fav.size ? `&size=${encodeURIComponent(fav.size)}` : ""}${fav.condiments?.length ? `&cond=${fav.condiments.join(",")}` : ""}${fav.flavors?.length ? `&flav=${fav.flavors.join(",")}` : ""}${fav.quantity > 1 ? `&qty=${fav.quantity}` : ""}${fav.requiredSelections ? `&req=${Object.entries(fav.requiredSelections).map(([k, items]) => `${k}:${(items as string[]).join(",")}`).join("|")}` : ""}`}
                            className="block bg-white rounded-[16px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-200/60 p-3 flex flex-row items-center transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                          >
                            <div className="relative w-[30%] aspect-[4/3] shrink-0 rounded-xl overflow-hidden bg-gray-100">
                              {fav.productImage ? (
                                <img src={fav.productImage} alt={fav.productName} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full text-[#999] text-sm font-bold">{fav.productName?.charAt(0)}</div>
                              )}
                            </div>
                            <div className="flex-1 ml-3 flex flex-col justify-center min-w-0">
                              <h3 className="text-[16px] font-bold text-gray-900 mb-0.5 truncate">{fav.productName}</h3>
                              <span className="text-[16px] font-bold text-brand-primary">R$ {(fav.productPrice || 0).toFixed(2)}</span>
                              {fav.size && <span className="text-[11px] text-gray-500 mt-0.5">{fav.size}</span>}
                              {fav.condiments?.length > 0 && (
                                <span className="text-[10px] text-gray-400 truncate">+ {fav.condiments.length} opcionai{fav.condiments.length > 1 ? "s" : "l"}</span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
