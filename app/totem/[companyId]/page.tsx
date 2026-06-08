"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, orderBy } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useTotem } from "@totem/hooks/useTotem";
import { useAuth } from "@totem/shared/types/AuthProvider";
import OrderingScreen from "../components/OrderingScreen";
import IdentificationScreen from "../components/IdentificationScreen";
import FinishedScreen from "../components/FinishedScreen";
import PaymentScreen from "../components/PaymentScreen";
import NotificationsPanel from "../components/NotificationsPanel";
import { useNotifications } from "../hooks/useNotifications";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import { X, MapPin, LogOut, ChevronRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import "@/page.css";

interface PageProps {
  params: { companyId: string };
}

type TotemStep = 'WELCOME' | 'ORDERING' | 'IDENTIFICATION' | 'PAYMENT' | 'FINISHED';

export default function TotemPage({ params }: PageProps) {
  return (
    <ErrorBoundary context="TotemPage">
      <TotemContent params={params} />
    </ErrorBoundary>
  );
}

function TotemContent({ params }: PageProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { companyId } = params;

  useEffect(() => {
    if (!companyId) {
      router.push('/');
    }
  }, [companyId, router]);

  const [step, setStep] = useState<TotemStep>('ORDERING');

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<any[]>([]);

  const [editStreet, setEditStreet] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editComplement, setEditComplement] = useState("");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState("");
  const [deliveryComplement, setDeliveryComplement] = useState("");

  const [currentOrderId, setCurrentOrderId] = useState("");
  const [pixData, setPixData] = useState({ qrCode: "", copyPaste: "" });
  const [orderTotal, setOrderTotal] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const { unreadCount } = useNotifications(user?.uid);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestore, "orders"), where("customerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setUserOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      logger.error("TotemPage", "Erro ao carregar pedidos", err);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "cities"), (snap) => {
      setAvailableCities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!editCity) { setAvailableNeighborhoods([]); return; }
    const q = query(collection(firestore, "neighborhoods"), where("cityId", "==", editCity), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      setAvailableNeighborhoods(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      logger.error("TotemPage", "Erro ao carregar bairros", err);
    });
    return () => unsub();
  }, [editCity]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestore, "addresses"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setAddresses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      logger.error("TotemPage", "Erro ao carregar endereços", err);
    });
    return () => unsub();
  }, [user]);

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setEditStreet("");
    setEditNumber("");
    setEditNeighborhood("");
    setEditComplement("");
    setEditCity("");
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Deseja realmente excluir este endereço?")) return;
    try {
      await deleteDoc(doc(firestore, "addresses", addressId));
      if (editingAddressId === addressId) resetAddressForm();
    } catch (error) {
      logger.error("TotemPage", "Erro ao deletar endereço", error);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editStreet || !editNumber || !editNeighborhood || !editCity) return;
    setSavingAddress(true);
    const neighborhoodObj = availableNeighborhoods.find((n) => n.id === editNeighborhood);
    const neighborhoodName = neighborhoodObj?.name || editNeighborhood;
    try {
      if (editingAddressId) {
        await updateDoc(doc(firestore, "addresses", editingAddressId), {
          street: editStreet,
          number: editNumber,
          cityId: editCity,
          neighborhood: neighborhoodName,
          neighborhoodId: neighborhoodObj?.id || "",
          complement: editComplement,
        });
        setEditingAddressId(null);
      } else {
        await addDoc(collection(firestore, "addresses"), {
          userId: user.uid,
          street: editStreet,
          number: editNumber,
          cityId: editCity,
          neighborhood: neighborhoodName,
          neighborhoodId: neighborhoodObj?.id || "",
          complement: editComplement,
          enabled: true,
          createdAt: serverTimestamp(),
        });
      }
      resetAddressForm();
    } finally {
      setSavingAddress(false);
    }
  };

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
    .filter((o) => o.status === "finished" || o.status === "cancelled")
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const activeOrders = userOrders
    .filter((o) => o.status !== "finished" && o.status !== "cancelled")
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const OrderItem = ({ o }: { o: any }) => (
    <div className="bg-brand-surface border border-brand-border rounded-lg mb-2 overflow-hidden">
      <div
        className="p-3 flex justify-between items-center cursor-pointer"
        onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
      >
        <div>
          <div className="font-bold text-sm">{o.companyName || "Loja"}</div>
          <div className="text-xs text-brand-muted">
            {o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : ""}
          </div>
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
          <p><strong>Endereço:</strong> {o.address?.street}, {o.address?.number}</p>
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

  const {
    products,
    categories,
    condiments,
    flavors,
    companyName,
    companyBanner,
    companyOpen,
    averageRating,
    reviewCount,
    tempoPreparoMin,
    tempoPreparoMax,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemObservation,
    clearCart,
    finishOrder,
    loading,
    logout,
    promotions,
    getProductPromotion,
    getPromotionalPrice,
  } = useTotem(companyId);

  const cartTotal = cart.reduce((acc, item) => {
    const basePrice = item.tamanhoSelecionado ? item.tamanhoSelecionado.preco : item.price;
    const condimentsPrice = item.condiments?.reduce((sum, cond) => sum + cond.price, 0) || 0;
    const flavorsPrice = item.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0;
    return acc + (basePrice + flavorsPrice + condimentsPrice) * item.quantity;
  }, 0);

  const handleFinish = async (deliveryFee: number) => {
    if (companyOpen === false) {
      setToast({ message: "Loja fechada. Não é possível realizar pedidos no momento.", type: "error" });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const total = cartTotal + deliveryFee;
      setOrderTotal(total);

      const orderData: any = {
        address: {
          street: deliveryStreet,
          number: deliveryNumber,
          neighborhood: deliveryNeighborhood,
          complement: deliveryComplement,
        },
        deliveryFee,
        paymentMethod: 'PIX',
        paymentStatus: 'WAITING_PAYMENT',
      };

      const result = await finishOrder(orderData);

      if (result.error) {
        setToast({ message: result.error, type: "error" });
        setIsProcessingPayment(false);
        return;
      }

      const orderId = result.orderId;
      if (!orderId) {
        logger.error("TotemPage", "ID do pedido não foi retornado pelo finishOrder");
        setIsProcessingPayment(false);
        return;
      }

      const res = await fetch("/api/payments/pix", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          amount: total,
          customerName: "Cliente Totem",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        logger.error("TotemPage", "Erro na API de PIX", undefined, {
          status: res.status,
          errorData,
        });
        setToast({ message: "Erro ao gerar pagamento. Tente novamente.", type: "error" });
        setIsProcessingPayment(false);
        return;
      }

      const data = await res.json();

      if (data.sandbox) {
        logger.info("TotemPage", `Sandbox ativo — pedido ${orderId} pago automaticamente`);
        handlePaymentConfirmed();
        return;
      }

      setPixData({ qrCode: data.qrCode || data.pixQrCode, copyPaste: data.pixCode || data.pixCopyPaste });

      try {
        await updateDoc(doc(firestore, "orders", orderId), {
          paymentProvider: data.provider || "pagbank",
          paymentExternalId: data.paymentId,
          paymentStatus: "WAITING_PAYMENT",
          paymentPayload: {
            provider: data.provider,
            paymentId: data.paymentId,
            status: data.status,
          },
        });
      } catch (updateError) {
        logger.error("TotemPage", "Erro ao salvar dados de pagamento no pedido", updateError);
      }

      setCurrentOrderId(orderId);
      setStep('PAYMENT');
    } catch (error) {
      logger.error("TotemPage", "Erro ao finalizar pedido", error);
      setToast({ message: "Erro ao processar pedido. Tente novamente.", type: "error" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentConfirmed = () => {
    try {
      setStep('FINISHED');
      clearCart();
      setDeliveryStreet("");
      setDeliveryNumber("");
      setDeliveryCity("");
      setDeliveryNeighborhood("");
      setDeliveryComplement("");
      setTimeout(() => {
        router.push('/totem');
      }, 3000);
    } catch (error) {
      logger.error("TotemPage", "Erro ao confirmar pagamento", error);
    }
  };

  const closeAllModals = () => {
    setIsProfileOpen(false);
    setIsOrdersOpen(false);
    setIsAddressesOpen(false);
    setIsNotificationsOpen(false);
  };

  const orderingScreenProps = {
    companyId,
    companyName,
    companyBanner,
    companyOpen,
    averageRating,
    reviewCount,
    tempoPreparoMin,
    tempoPreparoMax,
    products,
    categories,
    condiments,
    flavors,
    cart,
    actions: {
      addToCart,
      removeFromCart,
      updateQuantity,
      updateItemObservation,
      clearCart,
    },
    onFinish: () => setStep('IDENTIFICATION'),
    onCancel: () => router.push('/totem'),
    unreadCount,
    onOpenNotifications: () => { closeAllModals(); setIsNotificationsOpen(true); },
    onOpenOrders: () => { closeAllModals(); setIsOrdersOpen(true); },
    onOpenProfile: () => { closeAllModals(); setIsProfileOpen(true); },
    promotions,
    getProductPromotion,
    getPromotionalPrice,
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">Carregando cardápio...</div>
      </div>
    );
  }

  const currentScreen = (() => {
    switch (step) {
      case 'ORDERING':
        return <OrderingScreen {...orderingScreenProps} />;
      case 'IDENTIFICATION':
        return (
          <IdentificationScreen
            addressStreet={deliveryStreet}
            setAddressStreet={setDeliveryStreet}
            addressCity={deliveryCity}
            setAddressCity={setDeliveryCity}
            addressNumber={deliveryNumber}
            setAddressNumber={setDeliveryNumber}
            addressNeighborhood={deliveryNeighborhood}
            setAddressNeighborhood={setDeliveryNeighborhood}
            addressComplement={deliveryComplement}
            setAddressComplement={setDeliveryComplement}
            onConfirm={handleFinish}
            onBack={() => setStep('ORDERING')}
          />
        );
      case 'PAYMENT':
        return (
          <PaymentScreen
            orderId={currentOrderId}
            pixData={pixData}
            total={orderTotal}
            onPaymentConfirmed={handlePaymentConfirmed}
          />
        );
      case 'FINISHED':
        return <FinishedScreen />;
      default:
        return <OrderingScreen {...orderingScreenProps} />;
    }
  })();

  return (
    <>
      {currentScreen}

      <NotificationsPanel
        userId={user?.uid}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {(isProfileOpen || isOrdersOpen || isAddressesOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setIsProfileOpen(false); setIsOrdersOpen(false); setIsAddressesOpen(false); }}
        >
          <div
            className="bg-white w-full max-w-[430px] rounded-t-[24px] p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">
                {isProfileOpen ? "Meu Perfil" : isAddressesOpen ? "Meus Endereços" : "Meus Pedidos"}
              </h3>
              <button onClick={() => { setIsProfileOpen(false); setIsOrdersOpen(false); setIsAddressesOpen(false); }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[70vh] p-1">
              {isProfileOpen ? (
                <div className="space-y-4">
                  <p className="text-sm">Olá, {user?.name || "Usuário"}</p>
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
                </div>
              ) : isAddressesOpen ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-3 bg-[#FAFAFA] rounded-lg flex justify-between items-center border border-[#EAEAEA]">
                        <div>
                          <p className="font-bold text-xs">{addr.street}, {addr.number}</p>
                          <p className="text-[10px] text-[#666]">{addr.neighborhood}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingAddressId(addr.id);
                              setEditStreet(addr.street);
                              setEditNumber(addr.number);
                              setEditCity(addr.cityId || "");
                              setEditNeighborhood(addr.neighborhoodId || addr.neighborhood);
                              setEditComplement(addr.complement || "");
                            }}
                            className="p-1 hover:bg-white rounded-lg"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="p-1 hover:bg-red-50 text-red-600 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddAddress} className="space-y-2 pt-4 border-t border-[#EAEAEA] mt-2">
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        required
                        className="col-span-3 p-2 bg-[#FAFAFA] rounded-lg border border-[#EAEAEA] text-xs"
                        placeholder="Rua"
                        value={editStreet}
                        onChange={(e) => setEditStreet(e.target.value)}
                      />
                      <input
                        required
                        className="col-span-1 p-2 bg-[#FAFAFA] rounded-lg border border-[#EAEAEA] text-xs"
                        placeholder="Nº"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                      />
                    </div>
                    <select
                      required
                      className="w-full p-2 bg-[#FAFAFA] rounded-lg border border-[#EAEAEA] text-xs"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    >
                      <option value="">Selecione a cidade</option>
                      {availableCities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <select
                      required
                      className="w-full p-2 bg-[#FAFAFA] rounded-lg border border-[#EAEAEA] text-xs"
                      value={editNeighborhood}
                      onChange={(e) => setEditNeighborhood(e.target.value)}
                      disabled={!editCity}
                    >
                      <option value="">Selecione o bairro</option>
                      {availableNeighborhoods.map((n) => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                    <input
                      className="w-full p-2 bg-[#FAFAFA] rounded-lg border border-[#EAEAEA] text-xs"
                      placeholder="Complemento"
                      value={editComplement}
                      onChange={(e) => setEditComplement(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="w-full p-3 bg-[#FF6B00] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs"
                      disabled={savingAddress}
                    >
                      {savingAddress ? "Salvando..." : editingAddressId ? <><Plus className="h-4 w-4" /> Salvar Alterações</> : <><Plus className="h-4 w-4" /> Adicionar Endereço</>}
                    </button>
                    {editingAddressId && (
                      <button type="button" onClick={resetAddressForm} className="w-full p-1 text-xs text-[#666] underline text-center">
                        Cancelar edição
                      </button>
                    )}
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
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed bottom-24 left-4 right-4 z-[60] max-w-[430px] mx-auto animate-slide-up"
          style={{
            background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: toast.type === "error" ? "#991b1b" : "#166534",
            border: `1px solid ${toast.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <div className="flex items-center gap-2">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ marginLeft: "auto", opacity: 0.6, background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
