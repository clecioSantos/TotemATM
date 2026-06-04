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
      className="relative flex h-screen w-screen cursor-pointer flex-col bg-brand-light text-brand-dark transition-all duration-300 select-none overflow-hidden"
      onClick={onStart}
    >
      {/* Header - Simulado para o Totem, opcionalmente visível ou não */}
      <header className="px-6 py-6 border-b border-brand-border bg-brand-surface">
        <h2 className="text-xl font-bold">Bem-vindo ao NexOrder</h2>
      </header>

      {/* Main Content: Carousel Banner Style */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Banner Veloce */}
          <div className="w-full h-40 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-brand-primary p-6 text-white flex flex-col justify-center mb-6 shadow-sm">
            <small className="font-bold opacity-80">VELOCE PRIME</small>
            <h2 className="text-2xl font-bold">Frete Grátis</h2>
            <p>em pedidos acima de R$ 50</p>
          </div>

          {/* Grid de Categorias */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {['🍔 Lanches', '🍕 Pizza', '🍣 Japonês', '🍰 Doces', '🛒 Mercado'].map((cat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="w-16 h-16 bg-brand-surface rounded-md flex items-center justify-center text-2xl shadow-sm border border-brand-border">
                  {cat.split(' ')[0]}
                </div>
                <span className="text-xs font-semibold text-brand-muted">{cat.split(' ')[1]}</span>
              </div>
            ))}
          </div>

          {/* Seção de destaque */}
          <div className="mt-8 p-12 bg-brand-surface rounded-lg shadow-sm border border-brand-border flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-black mb-4">NexOrder</h1>
            <p className="text-brand-muted mb-8">Toque na tela para iniciar seu pedido.</p>
            
            <button className="h-12 rounded-md bg-brand-primary text-white font-semibold px-12 transition-all hover:bg-brand-primaryHover">
              Iniciar Pedido
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
