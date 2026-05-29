"use client";
import { useState, useEffect } from "react";
import { LogOut, User, Building2, X, Check, LayoutDashboard, ClipboardList, Clock, CheckCircle2, ShoppingBag, MapPin, Plus, Trash2, Home } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { firestore, auth } from "@/src/services/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, orderBy, onSnapshot, deleteDoc, writeBatch, getDocs } from "firebase/firestore";

interface WelcomeScreenProps {
  onStart: () => void;
  onLogout: () => Promise<void>;
}

export default function WelcomeScreen({ onStart, onLogout }: WelcomeScreenProps) {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.companyId as string;
  
  const { user, refreshProfile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [registering, setRegistering] = useState(false);

  // Estados do Gerenciamento de Endereços
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  // Estados do Acompanhamento de Pedidos
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingFilter, setTrackingFilter] = useState<"preparing" | "ready">("preparing");
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!isTrackingOpen || !user || !companyId) return;

    setLoadingOrders(true);
    const ordersRef = collection(firestore, "orders");
    const q = query(
      ordersRef,
      where("customerId", "==", user.uid),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoadingOrders(false);
    }, (error) => {
      console.error("Erro ao escutar pedidos:", error);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [isTrackingOpen, user, companyId]);

  useEffect(() => {
    if (!isAddressesOpen || !user) return;

    setLoadingAddresses(true);
    const addressesRef = collection(firestore, "addresses");
    const q = query(
      addressesRef,
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const addressesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar em memória: primeiro os habilitados, depois os mais recentes
      addressesData.sort((a: any, b: any) => {
        if (a.enabled && !b.enabled) return -1;
        if (!a.enabled && b.enabled) return 1;

        const dateA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : Date.now() / 1000);
        const dateB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : Date.now() / 1000);
        return dateB - dateA;
      });
      setAddresses(addressesData);
      setLoadingAddresses(false);
    }, (error) => {
      console.error("Erro ao escutar endereços:", error);
      setLoadingAddresses(false);
    });

    return () => unsubscribe();
  }, [isAddressesOpen, user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addressStreet || !addressNumber || !addressNeighborhood) return;
    setSavingAddress(true);

    try {
      // 1. Desabilitar qualquer outro endereço ativo desse usuário
      const addressesRef = collection(firestore, "addresses");
      const qEnabled = query(addressesRef, where("userId", "==", user.uid), where("enabled", "==", true));
      const snapshot = await getDocs(qEnabled);
      const batch = writeBatch(firestore);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { enabled: false });
      });
      await batch.commit();

      // 2. Criar o novo endereço marcado como habilitado
      await addDoc(collection(firestore, "addresses"), {
        userId: user.uid,
        street: addressStreet,
        number: addressNumber,
        neighborhood: addressNeighborhood,
        complement: addressComplement,
        enabled: true,
        createdAt: serverTimestamp(),
      });

      setAddressStreet("");
      setAddressNumber("");
      setAddressNeighborhood("");
      setAddressComplement("");
      alert("Endereço adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar endereço:", error);
      alert("Falha ao salvar endereço. Tente novamente.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;
    try {
      await deleteDoc(doc(firestore, "addresses", addressId));
    } catch (error) {
      console.error("Erro ao excluir endereço:", error);
      alert("Falha ao excluir endereço.");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "preparing":
        return "Em Preparo";
      case "ready":
        return "Pronto";
      case "delivered":
        return "Entregue";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyName) return;
    setRegistering(true);

    try {
      // 1. Criar a empresa no Firestore
      const companyRef = await addDoc(collection(firestore, "companies"), {
        name: companyName,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Atualizar o usuário para Admin e vincular à empresa
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, {
        role: "admin",
        companyId: companyRef.id,
      });

      // 3. Atualizar a sessão (cookies) para refletir o novo cargo (Admin)
      // Isso garante que o middleware reconheça as novas permissões imediatamente
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken(true); // Força refresh para carregar novos claims
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
      }

      await refreshProfile();
      setIsModalOpen(false);
      setIsMenuOpen(false);
      alert("Empresa cadastrada com sucesso! Redirecionando para o seu painel...");
      router.push("/admin");
    } catch (error) {
      console.error("Erro ao cadastrar empresa:", error);
      alert("Falha ao registrar empresa. Tente novamente.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div 
      className="relative flex h-screen w-screen cursor-pointer flex-col items-center justify-between bg-brand-light p-12 text-brand-dark transition-all duration-300 select-none overflow-hidden"
      onClick={onStart}
    >
      {/* Background soft image overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop')" }}
      />
      
      {/* Menu de Perfil */}
      <div className="absolute top-6 right-6 z-30" onClick={(e) => e.stopPropagation()}>
        <button 
          className="flex items-center gap-2 rounded-full bg-white/80 p-3 text-brand-dark backdrop-blur-md transition-all hover:bg-brand-accent shadow-md border border-stone-200"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <User className="h-6 w-6" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-3 w-72 origin-top-right rounded-2xl bg-white shadow-2xl border border-stone-100 p-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-stone-50">
              <p className="text-sm font-bold truncate">{user?.name || "Usuário"}</p>
              <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
              {user?.role === 'admin' && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Administrador</span>
              )}
            </div>
            
            {user?.role !== "admin" && (
              <button 
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-stone-600 transition-colors hover:bg-stone-50"
                onClick={() => setIsModalOpen(true)}
              >
                <Building2 className="h-4 w-4 text-brand-accent" />
                <span>Traga sua empresa para o NexOrder</span>
              </button>
            )}

            {user?.role === "admin" && (
              <button
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-stone-600 transition-colors hover:bg-stone-50"
                onClick={() => router.push("/admin")}
              >
                <LayoutDashboard className="h-4 w-4 text-brand-accent" />
                <span>Painel Administrativo</span>
              </button>
            )}

            {user && (
              <button 
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-stone-600 transition-colors hover:bg-stone-50"
                onClick={() => {
                  setIsTrackingOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <ClipboardList className="h-4 w-4 text-brand-accent" />
                <span>Acompanhar Pedidos</span>
              </button>
            )}

            {user && (
              <button 
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-stone-600 transition-colors hover:bg-stone-50"
                onClick={() => {
                  setIsAddressesOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <MapPin className="h-4 w-4 text-brand-accent" />
                <span>Gerenciar Endereços</span>
              </button>
            )}

            <button 
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-brand-dark">Sua Empresa</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterCompany} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Nome da Empresa</label>
                <input 
                  type="text" 
                  className="w-full p-4 rounded-2xl border-2 border-stone-100 focus:border-brand-accent outline-none transition-all"
                  placeholder="Ex: Minha Lanchonete"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-accent text-brand-dark py-4 rounded-2xl font-black shadow-xl shadow-yellow-500/20 hover:bg-brand-accentHover transition-all active:scale-95 disabled:opacity-50"
                disabled={registering}
              >
                {registering ? "CADASTRANDO..." : "VINCULAR MINHA EMPRESA"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Acompanhar Pedidos */}
      {isTrackingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-brand-accent" />
                <h2 className="text-2xl font-black text-brand-dark">Acompanhar Meus Pedidos</h2>
              </div>
              <button 
                onClick={() => setIsTrackingOpen(false)} 
                className="p-2 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Abas de Filtro */}
            <div className="flex gap-2 p-1 bg-stone-100 rounded-xl mb-6">
              <button
                className={`flex-1 py-3 text-center text-sm font-bold rounded-lg transition-all ${
                  trackingFilter === "preparing"
                    ? "bg-white text-brand-dark shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                onClick={() => setTrackingFilter("preparing")}
              >
                Em Preparo
              </button>
              <button
                className={`flex-1 py-3 text-center text-sm font-bold rounded-lg transition-all ${
                  trackingFilter === "ready"
                    ? "bg-white text-brand-dark shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                onClick={() => setTrackingFilter("ready")}
              >
                Prontos
              </button>
            </div>

            {/* Lista de Pedidos */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-[300px]">
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
                  <p className="mt-4 text-sm font-medium text-stone-500">Buscando seus pedidos...</p>
                </div>
              ) : (
                (() => {
                  const filteredOrders = orders.filter((order) => {
                    if (trackingFilter === "ready") {
                      return order.status === "ready";
                    } else {
                      return order.status !== "ready";
                    }
                  });

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ShoppingBag className="h-12 w-12 text-stone-300 mb-3" />
                        <p className="text-stone-500 font-medium">Nenhum pedido encontrado nesta seção.</p>
                      </div>
                    );
                  }

                  return filteredOrders.map((order) => {
                    const isReady = order.status === "ready";
                    const isPreparing = order.status === "preparing";
                    const isPending = order.status === "pending";
                    const isCancelled = order.status === "cancelled";

                    return (
                      <div 
                        key={order.id}
                        className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                          isReady 
                            ? "border-green-100 bg-green-50/30" 
                            : isCancelled 
                            ? "border-red-100 bg-red-50/20"
                            : "border-stone-100 bg-stone-50/10 hover:border-brand-accent/30"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xs font-bold text-stone-400">PEDIDO</span>
                            <h3 className="text-lg font-black text-brand-dark">
                              #{order.orderNumber || order.id.slice(-4).toUpperCase()}
                            </h3>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase ${
                              isReady 
                                ? "bg-green-100 text-green-700" 
                                : isPreparing
                                ? "bg-blue-100 text-blue-700 animate-pulse"
                                : isPending
                                ? "bg-yellow-100 text-yellow-700"
                                : isCancelled
                                ? "bg-red-100 text-red-700"
                                : "bg-stone-200 text-stone-700"
                            }`}>
                              {isPreparing && <Clock className="h-3 w-3" />}
                              {isReady && <CheckCircle2 className="h-3 w-3" />}
                              {getStatusLabel(order.status)}
                            </span>
                            <span className="text-[10px] text-stone-400 mt-1">
                              {order.createdAt?.seconds 
                                ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                                : "Agora"}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-stone-100 pt-3 mt-3">
                          <div className="space-y-1.5">
                            {order.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm text-stone-600 font-medium">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-bold">
                                  {((item.price || 0) * (item.quantity || 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center border-t border-dashed border-stone-200 pt-3 mt-3">
                            <span className="text-xs font-bold text-stone-400">TOTAL</span>
                            <span className="text-base font-black text-brand-dark">
                              {(order.total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciar Endereços */}
      {isAddressesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-brand-accent" />
                <h2 className="text-2xl font-black text-brand-dark">Meus Endereços</h2>
              </div>
              <button 
                onClick={() => setIsAddressesOpen(false)} 
                className="p-2 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Novo Endereço Form */}
            <form onSubmit={handleAddAddress} className="space-y-4 mb-6 p-5 rounded-2xl bg-stone-50 border border-stone-100">
              <span className="text-[10px] font-black tracking-widest text-brand-muted uppercase">Cadastrar Novo Endereço</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <input 
                    type="text" 
                    placeholder="Rua / Logradouro" 
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:border-brand-accent px-4 py-3 rounded-xl text-sm font-semibold text-brand-dark focus:outline-none transition-all duration-200"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    placeholder="Nº" 
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    className="col-span-1 bg-white border border-stone-200 focus:border-brand-accent px-3 py-3 rounded-xl text-sm font-semibold text-brand-dark focus:outline-none transition-all duration-200"
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Bairro" 
                    value={addressNeighborhood}
                    onChange={(e) => setAddressNeighborhood(e.target.value)}
                    className="col-span-2 bg-white border border-stone-200 focus:border-brand-accent px-3 py-3 rounded-xl text-sm font-semibold text-brand-dark focus:outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Complemento (Apto, bloco...)" 
                  value={addressComplement}
                  onChange={(e) => setAddressComplement(e.target.value)}
                  className="flex-1 bg-white border border-stone-200 px-4 py-3 rounded-xl text-sm font-semibold text-brand-dark focus:outline-none transition-all duration-200"
                />
                <button 
                  type="submit"
                  disabled={savingAddress}
                  className="bg-brand-accent text-brand-dark px-6 rounded-xl font-black text-sm flex items-center gap-1.5 hover:bg-brand-accentHover transition-all disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>SALVAR</span>
                </button>
              </div>
            </form>

            {/* Lista de Endereços */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[200px]">
              {loadingAddresses ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
                  <p className="mt-4 text-sm font-medium text-stone-500">Buscando endereços...</p>
                </div>
              ) : (
                (() => {
                  if (addresses.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MapPin className="h-12 w-12 text-stone-300 mb-3" />
                        <p className="text-stone-500 font-medium">Nenhum endereço salvo.</p>
                      </div>
                    );
                  }

                  return addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      className="p-4 rounded-xl border border-stone-100 bg-stone-50/30 flex justify-between items-center hover:border-brand-accent/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 bg-brand-light p-2 rounded-lg text-brand-accent flex-shrink-0">
                          <Home className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-brand-dark text-sm flex items-center gap-2">
                            {addr.street}, {addr.number}
                            {addr.enabled && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded-full uppercase tracking-wider">
                                Ativo
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-stone-400 font-semibold">
                            {addr.neighborhood} {addr.complement && `• ${addr.complement}`}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                        title="Excluir endereço"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Section: Logo */}
      <div className="relative z-10 flex flex-col items-center mt-12">
        <span className="text-xs font-bold tracking-widest text-brand-muted uppercase">Bem-vindo ao</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2 flex items-center gap-1 text-brand-dark">
          NexOrder
          <span className="h-2 w-2 rounded-full bg-brand-accent"></span>
        </h1>
      </div>

      {/* Middle Section: Premium visual element */}
      <div className="relative z-10 flex max-w-sm flex-col items-center text-center px-6">
        <div className="relative h-64 w-64 md:h-72 md:w-72 overflow-hidden rounded-full border-[6px] border-white shadow-xl shadow-stone-200">
          <img 
            src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop" 
            alt="Delicioso hambúrguer"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
        <p className="mt-8 text-lg font-medium text-stone-700">
          Sabor irresistível preparado em poucos toques.
        </p>
      </div>

      {/* Bottom Section: Tap to Start button */}
      <div className="relative z-10 mb-12 animate-bounce">
        <div className="flex items-center justify-center rounded-full bg-brand-accent px-10 py-5 shadow-lg shadow-yellow-500/10 hover:bg-brand-accentHover transition-colors duration-200">
          <span className="text-lg font-black tracking-wider text-brand-dark uppercase">
            Toque para iniciar
          </span>
        </div>
      </div>
    </div>
  );
}

