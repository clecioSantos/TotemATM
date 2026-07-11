"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, updateDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, orderBy, getDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useTotem } from "@totem/hooks/useTotem";
import { useAuth } from "@totem/shared/types/AuthProvider";
import OrderingScreen from "../components/OrderingScreen";
import IdentificationScreen from "../components/IdentificationScreen";
import OrderSummaryScreen from "../components/OrderSummaryScreen";
import FinishedScreen from "../components/FinishedScreen";
import PaymentScreen from "../components/PaymentScreen";
import NotificationsPanel from "../components/NotificationsPanel";
import { useNotifications } from "../hooks/useNotifications";
import { useConfirm } from "@/app/components/ConfirmProvider";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import { X, MapPin, LogOut, ChevronRight, Plus, Trash2, Mail, Send, MessageSquare, Loader2, Store } from "lucide-react";
import Link from "next/link";
import "@/page.css";

interface PageProps {
  params: { companyId: string };
}

type TotemStep = 'WELCOME' | 'ORDERING' | 'IDENTIFICATION' | 'REVIEW' | 'PAYMENT' | 'FINISHED';
export default function TotemPage() {
  const [isMounted, setIsMounted] = useState(false);
  const params = useParams();

  const [urlParams, setUrlParams] = useState<URLSearchParams>(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = new URLSearchParams(window.location.search);
      if (current.toString() !== urlParams.toString()) {
        setUrlParams(current);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [urlParams]);

  if (!isMounted) return null;

  const companyId = params.companyId as string;
  if (!companyId) return null;

  const initialProduct = urlParams?.get("product") || undefined;
  const initialSize = urlParams?.get("size") || undefined;
  const initialCondiments = urlParams?.get("cond")?.split(",");
  const initialFlavors = urlParams?.get("flav")?.split(",");
  const initialQuantity = urlParams?.get("qty") ? parseInt(urlParams.get("qty")!) : undefined;
  const initialRequiredSelections = (() => {
    const r = urlParams?.get("req");
    if (!r) return undefined;
    const result: Record<string, string[]> = {};
    r.split("|").forEach(part => {
      const [key, items] = part.split(":");
      if (key && items) result[key] = items.split(",");
    });
    return Object.keys(result).length > 0 ? result : undefined;
  })();
  return (
    <ErrorBoundary context="TotemPage">
      <TotemContent params={{ companyId }} initialProductId={initialProduct} initialSize={initialSize} initialCondiments={initialCondiments} initialFlavors={initialFlavors} initialQuantity={initialQuantity} initialRequiredSelections={initialRequiredSelections} />
    </ErrorBoundary>
  );
}

function TotemContent({ params, initialProductId, initialSize, initialCondiments, initialFlavors, initialQuantity, initialRequiredSelections }: PageProps & { initialProductId?: string; initialSize?: string; initialCondiments?: string[]; initialFlavors?: string[]; initialQuantity?: number; initialRequiredSelections?: Record<string, string[]> }) {
  const router = useRouter();
  const { user, signOut, refreshProfile } = useAuth();
  const { showConfirm } = useConfirm();
  const { companyId } = params;

  useEffect(() => {
    if (!companyId) {
      router.push('/');
    }
  }, [companyId, router]);

  useEffect(() => {
    if (!user) return;
    try {
      const pendingStep = localStorage.getItem("totem_pending_step");
      if (pendingStep === "IDENTIFICATION") {
        localStorage.removeItem("totem_pending_step");
        setStep("IDENTIFICATION");
      }
    } catch {}
  }, [user]);

  const [step, setStep] = useState<TotemStep>('ORDERING');

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sendingContact, setSendingContact] = useState(false);
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
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "info" } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [reviewDeliveryFee, setReviewDeliveryFee] = useState(0);
  const [reviewDeliveryMode, setReviewDeliveryMode] = useState<string>("delivery");
  const [convenienceFee, setConvenienceFee] = useState(0);
  const [favorites, setFavorites] = useState<Record<string, any>>({});
  const [orderContactPhone, setOrderContactPhone] = useState("");

  const userPhone = (user as any)?.phone || "";

  useEffect(() => {
    setOrderContactPhone(userPhone);
  }, [userPhone]);

  useEffect(() => {
    getDoc(doc(firestore, "settings", "global")).then((snap) => {
      if (snap.exists()) setConvenienceFee(snap.data().convenienceFee || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(firestore, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFavorites(data.favorites || {});
      }
    }).catch(() => {});
  }, [user]);

  const { unreadCount } = useNotifications(user?.uid);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestore, "orders"), where("customerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUserOrders(allOrders.filter((o: any) => o.paymentStatus !== "WAITING_PAYMENT" && o.paymentStatus !== "PENDING"));
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
    if (!await showConfirm("Deseja realmente excluir este endereço?")) return;
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
    } catch (error) {
      logger.error("TOTEM_PAGE", "Erro ao salvar endereço", error);
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

  const OrderItem = ({ o }: { o: any }) => (
    <div className="bg-brand-surface border border-brand-border rounded-lg mb-2 overflow-hidden">
      <div
        className="p-3 flex justify-between items-center cursor-pointer"
        onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
      >
        <div className="flex items-center gap-2">
          {companyLogo ? (
            <img src={companyLogo} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <Store size={14} className="text-orange-500" />
            </div>
          )}
          <div>
            <Link
              href={`/totem/${companyId}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-sm text-brand-dark hover:text-brand-primary transition-colors"
            >
              {companyName || o.companyName || "Loja"}
            </Link>
            <div className="text-xs text-brand-muted">
              {o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : ""}
            </div>
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
          <p><strong>Pedido:</strong> #{o.id.slice(-6).toUpperCase()}</p>
          {o.isScheduled && (
            <p><strong>Agendado:</strong> {o.scheduledDate} - {o.scheduledTime}</p>
          )}
          {o.requiresCustomerContact && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 my-2">
              <p className="text-xs font-bold text-purple-800">⚠ Este pedido requer alinhamento com a loja</p>
              <p className="text-[10px] text-purple-700 mt-1">A loja entrará em contato para alinhar os detalhes da personalização.</p>
            </div>
          )}
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
    companyLogo,
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

  const handleToggleFavorite = useCallback(async (productId: string, config: any) => {
    if (!user) return;
    const isFav = !!favorites[productId];
    const updated = { ...favorites };
    if (isFav) {
      delete updated[productId];
    } else {
      const prod = products.find(p => p.id === productId);
      if (!prod) return;
      updated[productId] = {
        productId,
        companyId,
        ...config,
        productName: prod.name,
        productImage: prod.imageUrl || "",
        productPrice: prod.price,
        companyName,
        companyLogo: companyLogo || "",
        addedAt: new Date().toISOString(),
      };
    }
    setFavorites(updated);
    try {
      await updateDoc(doc(firestore, "users", user.uid), { favorites: updated });
    } catch {}
  }, [user, favorites, companyId, products]);

  const cartTotal = cart.reduce((acc, item) => {
    const basePrice = item.tamanhoSelecionado ? item.tamanhoSelecionado.preco : item.price;
    const condimentsPrice = item.condiments?.reduce((sum, cond) => sum + cond.price, 0) || 0;
    const flavorsPrice = item.saboresSelecionados?.reduce((sum, f) => sum + f.preco, 0) || 0;
    const requiredItemsPrice = item.selectedRequiredItems?.reduce((s, rg) => s + rg.items.reduce((ss, i) => ss + (Number(i.additionalPrice) || 0), 0), 0) || 0;
    return acc + (basePrice + flavorsPrice + condimentsPrice + requiredItemsPrice) * item.quantity;
  }, 0);

  const hasRequiredScheduling = cart.some((item) => {
    const cat = categories.find((c) => c.id === item.categoryId);
    return cat?.schedulingMode === "required";
  });

  const hasOptionalScheduling = cart.some((item) => {
    const cat = categories.find((c) => c.id === item.categoryId);
    return cat?.schedulingMode === "optional";
  });

  const requiresContact = cart.some((item) => {
    const cat = categories.find((c) => c.id === item.categoryId);
    return cat?.requiresCustomerContact && cat.schedulingMode !== "none";
  });

  const contactCategories = cart
    .map((item) => categories.find((c) => c.id === item.categoryId))
    .filter((cat) => cat?.requiresCustomerContact && cat.schedulingMode !== "none");

  const contactInstructions = [...new Set(contactCategories.map((c) => c?.customerInstructions).filter(Boolean))] as string[];

  const prepHours = Math.max(
    ...cart.map((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      return (cat?.minimumPreparationMinutes || 0) / 60;
    }),
    0
  );

  const earliestDate = new Date();
  earliestDate.setHours(earliestDate.getHours() + prepHours);

  const isSchedulingNeeded = hasRequiredScheduling || (hasOptionalScheduling && (scheduledDate && scheduledTime));

  const handleFinish = async (deliveryFee: number, deliveryMode?: string) => {
    if (companyOpen === false) {
      setToast({ message: "Loja fechada. Não é possível realizar pedidos no momento.", type: "error" });
      return;
    }

    if (hasRequiredScheduling && (!scheduledDate || !scheduledTime)) {
      setToast({ message: "Este pedido exige agendamento. Selecione data e horário.", type: "error" });
      return;
    }

    if (requiresContact && !orderContactPhone.trim()) {
      setToast({ message: "Informe seu telefone para contato.", type: "error" });
      return;
    }

    if (scheduledDate && scheduledTime) {
      const selected = new Date(`${scheduledDate}T${scheduledTime}`);
      if (selected < earliestDate) {
        setToast({
          message: `Horário muito próximo. O agendamento precisa de pelo menos ${prepHours}h de antecedência.`,
          type: "error",
        });
        return;
      }
    }

    setReviewDeliveryFee(deliveryFee);
    setReviewDeliveryMode(deliveryMode || "delivery");
    setStep('REVIEW');
  };

  const handleProceedToPayment = async () => {
    setIsProcessingPayment(true);

    try {
      if (requiresContact && !userPhone && orderContactPhone.trim()) {
        await updateDoc(doc(firestore, "users", user!.uid), {
          phone: orderContactPhone.trim(),
        }).catch(() => {});
      }

      const baseTotal = cartTotal + reviewDeliveryFee + convenienceFee;
      setOriginalTotal(baseTotal);
      let total = baseTotal;
      if (appliedCoupon) {
        total = Math.max(0, total - appliedCoupon.discountValue);
      }
      setOrderTotal(total);

      const isPickup = reviewDeliveryMode === "pickup";

      const orderData: any = {
        address: isPickup ? null : {
          street: deliveryStreet,
          number: deliveryNumber,
          neighborhood: deliveryNeighborhood,
          complement: deliveryComplement,
        },
        deliveryFee: isPickup ? 0 : reviewDeliveryFee,
        deliveryMode: reviewDeliveryMode || "delivery",
        paymentStatus: 'WAITING_PAYMENT',
      };

      if (isSchedulingNeeded) {
        orderData.isScheduled = true;
        orderData.scheduledDate = scheduledDate;
        orderData.scheduledTime = scheduledTime;
      }

      if (requiresContact) {
        orderData.requiresCustomerContact = true;
        if (orderContactPhone.trim()) {
          orderData.customerPhone = orderContactPhone.trim();
        }
      }

      if (appliedCoupon) {
        orderData.couponId = appliedCoupon.id;
        orderData.couponCode = appliedCoupon.code;
        orderData.discountValue = appliedCoupon.discountValue;
      }

      if (convenienceFee > 0) {
        orderData.convenienceFee = convenienceFee;
      }

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

      setCurrentOrderId(orderId);
      setOrderTotal(total);
      setStep('PAYMENT');
    } catch (error) {
      logger.error("TotemPage", "Erro ao finalizar pedido", error);
      setToast({ message: "Erro ao processar pedido. Tente novamente.", type: "error" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentConfirmed = useCallback(() => {
    try {
      if (currentOrderId) {
        updateDoc(doc(firestore, "orders", currentOrderId), {
          paymentStatus: "PAID",
          status: "paid",
          paidAt: serverTimestamp(),
        }).catch(err => logger.error("TotemPage", "Erro ao marcar pedido como pago", err));
      }
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
  }, [currentOrderId, clearCart, router]);

  const orderingScreenProps = {
    companyId,
    companyName,
    companyBanner,
    companyLogo,
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
    onFinish: () => {
      if (!user) {
        try { localStorage.setItem("totem_pending_step", "IDENTIFICATION"); } catch {}
        router.push(`/login?redirect=/totem/${companyId}`);
        return;
      }
      setStep('IDENTIFICATION');
    },
    onCancel: () => router.push('/totem'),
    unreadCount,
    onOpenNotifications: () => setIsNotificationsOpen(true),
    onOpenOrders: () => setIsOrdersOpen(true),
    promotions,
    getProductPromotion,
    getPromotionalPrice,
    initialProductId,
    initialSize,
    initialCondiments,
    initialFlavors,
    initialQuantity,
    initialRequiredSelections,
    isFavorite: (id: string) => !!favorites[id],
    onToggleFavorite: handleToggleFavorite,
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
        return <OrderingScreen key={initialProductId || "ordering"} {...orderingScreenProps} />;
      case 'REVIEW':
        return (
          <OrderSummaryScreen
            companyId={companyId}
            companyName={companyName}
            cart={cart}
            cartTotal={cartTotal}
            deliveryFee={reviewDeliveryFee}
            deliveryMode={reviewDeliveryMode}
            deliveryStreet={deliveryStreet}
            deliveryNumber={deliveryNumber}
            deliveryNeighborhood={deliveryNeighborhood}
            deliveryComplement={deliveryComplement}
            convenienceFee={convenienceFee}
            onCouponChange={(c) => setAppliedCoupon(c)}
            onConfirm={handleProceedToPayment}
            onBack={() => setStep('IDENTIFICATION')}
          />
        );
      case 'IDENTIFICATION':
        return (
          <div>
            {(hasRequiredScheduling || hasOptionalScheduling) && cart.length > 0 && (
              <div className="w-full max-w-md mx-auto px-4 pt-4 pb-2">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  {hasRequiredScheduling && (
                    <p className="text-sm font-bold text-amber-800 mb-3">
                      ⚠ Este pedido exige agendamento. Escolha a data e horário desejados.
                    </p>
                  )}
                  {hasOptionalScheduling && !hasRequiredScheduling && (
                    <p className="text-sm font-bold text-amber-800 mb-3">
                      Alguns itens podem ser agendados. Selecione data e horário se desejar agendar.
                    </p>
                  )}
                  {prepHours > 0 && (
                    <p className="text-xs text-amber-700 mb-3">
                      ⏱ Antecedência mínima necessária: <strong>{prepHours}h</strong>
                    </p>
                  )}
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-amber-700 uppercase block mb-1">Data</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm font-medium"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-amber-700 uppercase block mb-1">Horário</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm font-medium"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                  {requiresContact && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3">
                      <p className="text-sm font-bold text-purple-800 mb-2">
                        ⚠ Este pedido requer alinhamento com a loja
                      </p>
                      <p className="text-xs text-purple-700 mb-2">
                        Após a confirmação, a loja entrará em contato para alinhar os detalhes da personalização.
                      </p>
                      {contactInstructions.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">
                            Informações necessárias
                          </p>
                          {contactInstructions.map((text, i) => (
                            <p key={i} className="text-xs text-purple-800 whitespace-pre-wrap">{text}</p>
                          ))}
                        </div>
                      )}
                      <div className="mt-3">
                        <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">
                          Telefone para contato
                        </label>
                        <input
                          type="tel"
                          value={orderContactPhone}
                          onChange={(e) => setOrderContactPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full px-3 py-2.5 rounded-lg border border-purple-300 bg-white text-sm font-medium outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              companyId={companyId}
              schedulingRequired={hasRequiredScheduling}
              schedulingConfigured={!!(scheduledDate && scheduledTime)}
              requiresContact={requiresContact}
              phoneFilled={!!orderContactPhone.trim()}
            />
          </div>
        );
      case 'PAYMENT':
        return (
            <PaymentScreen
              orderId={currentOrderId}
              total={orderTotal}
              originalTotal={originalTotal}
              companyId={companyId}
              customerName={user?.name}
              customerEmail={user?.email}
              appliedCoupon={appliedCoupon}
              onPaymentConfirmed={handlePaymentConfirmed}
              onCancel={() => setStep('ORDERING')}
            />
        );
      case 'FINISHED':
        return <FinishedScreen />;
      default:
        return <OrderingScreen key={initialProductId || "ordering"} {...orderingScreenProps} />;
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

      {(isOrdersOpen || isAddressesOpen) && (
        <div
          className={`fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm ${isAddressesOpen ? 'items-start sm:items-center' : 'items-end justify-center'}`}
          onClick={() => { setIsOrdersOpen(false); setIsAddressesOpen(false); }}
        >
          <div
            className={`bg-white w-full shadow-2xl animate-slide-up ${isAddressesOpen ? 'min-h-screen sm:min-h-0 sm:max-w-lg sm:rounded-2xl sm:mx-auto sm:my-8 p-6' : 'max-w-[430px] rounded-t-[24px] p-6'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">
                {isAddressesOpen ? "Meus Endereços" : "Meus Pedidos"}
              </h3>
              <button onClick={() => { setIsOrdersOpen(false); setIsAddressesOpen(false); }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[70vh] p-1">
              {isAddressesOpen ? (
                <div className="space-y-5">
                  <div className="border-b border-[#EAEAEA] pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold">Meus Endereços</h3>
                        <p className="text-sm text-gray-500">Gerencie seus endereços no mesmo padrão da edição de perfil.</p>
                      </div>
                      {editingAddressId && (
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
                              setEditingAddressId(addr.id);
                              setEditStreet(addr.street);
                              setEditNumber(addr.number);
                              setEditCity(addr.cityId || "");
                              setEditNeighborhood(addr.neighborhoodId || addr.neighborhood);
                              setEditComplement(addr.complement || "");
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
                          value={editStreet}
                          onChange={(e) => setEditStreet(e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nº</label>
                        <input
                          required
                          className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]"
                          placeholder="Nº"
                          value={editNumber}
                          onChange={(e) => setEditNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Cidade</label>
                        <select
                          required
                          className="w-full h-12 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
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
                          value={editNeighborhood}
                          onChange={(e) => setEditNeighborhood(e.target.value)}
                          disabled={!editCity}
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
                        value={editComplement}
                        onChange={(e) => setEditComplement(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        type="submit"
                        className="w-full h-12 bg-[#FF6B00] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
                        disabled={savingAddress}
                      >
                        {savingAddress ? "Salvando..." : editingAddressId ? <><Plus className="h-4 w-4" /> Salvar Alterações</> : <><Plus className="h-4 w-4" /> Adicionar Endereço</>}
                      </button>
                      {editingAddressId && (
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
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setIsContactOpen(false); setContactSubject(""); setContactMessage(""); setContactPhone(""); }}>
          <div className="bg-white w-full max-w-[430px] rounded-t-[24px] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Fale Conosco</h3>
              <button onClick={() => { setIsContactOpen(false); setContactSubject(""); setContactMessage(""); setContactPhone(""); }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-1">Assunto</label>
                <select
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-light text-sm font-medium outline-none focus:border-brand-primary transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="question">Pergunta</option>
                  <option value="add-company">Quero adicionar minha empresa no Bora</option>
                  <option value="complaint">Reclamação</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-1">Telefone para contato</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-light text-sm font-medium outline-none focus:border-brand-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest block mb-1">Mensagem</label>
                <textarea
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-light text-sm font-medium outline-none focus:border-brand-primary transition-colors resize-none"
                />
              </div>

              <button
                onClick={async () => {
                  if (!contactSubject || !contactMessage.trim()) return;
                  setSendingContact(true);
                  try {
                    await addDoc(collection(firestore, "contacts"), {
                      subject: contactSubject,
                      message: contactMessage.trim(),
                      phone: contactPhone.trim() || null,
                      userId: user?.uid || null,
                      userEmail: user?.email || null,
                      userName: user?.name || null,
                      companyId: companyId || null,
                      createdAt: serverTimestamp(),
                    });
                    setToast({ message: "Mensagem enviada com sucesso! Entraremos em contato em breve.", type: "info" });
                  } catch {
                    setToast({ message: "Erro ao enviar mensagem. Tente novamente.", type: "error" });
                  } finally {
                    setSendingContact(false);
                    setIsContactOpen(false);
                    setContactSubject("");
                    setContactMessage("");
                    setContactPhone("");
                  }
                }}
                disabled={!contactSubject || !contactMessage.trim() || sendingContact}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-primary text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {sendingContact ? (
                  <><Loader2 size={18} className="animate-spin" /> Enviando...</>
                ) : (
                  <><Send size={18} /> Enviar Mensagem</>
                )}
              </button>
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
