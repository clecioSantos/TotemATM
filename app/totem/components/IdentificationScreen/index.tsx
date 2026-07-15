"use client";
import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, MapPin, Home, PlusCircle, Check, ShieldAlert } from "lucide-react";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { firestore } from "@/src/services/firebase";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, doc, writeBatch, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation";

interface CouponApplied {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discountValue: number;
  finalTotal: number;
}

interface IdentificationScreenProps {
  addressStreet: string;
  setAddressStreet: (val: string) => void;
  addressCity: string;
  setAddressCity: (val: string) => void;
  addressNumber: string;
  setAddressNumber: (val: string) => void;
  addressNeighborhood: string;
  setAddressNeighborhood: (val: string) => void;
  addressComplement: string;
  setAddressComplement: (val: string) => void;
  onConfirm: (deliveryFee: number, deliveryMode?: string) => void;
  onBack: () => void;
  companyId: string;
  schedulingRequired?: boolean;
  schedulingConfigured?: boolean;
  requiresContact?: boolean;
  phoneFilled?: boolean;
  cartTotal?: number;
  deliveryDiscountEnabled?: boolean;
  deliveryDiscountMinOrder?: number;
  deliveryDiscountValue?: number;
}

function getCartCompanyId(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("totem-cart");
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data.items) && data.items.length > 0) return data.companyId || null;
  } catch {}
  return null;
}

export default function IdentificationScreen({
  addressStreet, setAddressStreet, addressCity, setAddressCity, addressNumber, setAddressNumber, addressNeighborhood, setAddressNeighborhood, addressComplement, setAddressComplement, onConfirm, onBack, companyId: companyIdProp, schedulingRequired, schedulingConfigured, requiresContact, phoneFilled, cartTotal = 0, deliveryDiscountEnabled = false, deliveryDiscountMinOrder = 0, deliveryDiscountValue = 0
}: IdentificationScreenProps) {
  const { user } = useAuth();
  const params = useParams();
  const companyId = companyIdProp || getCartCompanyId() || (params?.companyId as string);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPreselected, setHasPreselected] = useState(false);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<any[]>([]);
  const [citySettings, setCitySettings] = useState<any[]>([]);
  const [deliveryCosts, setDeliveryCosts] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any>(null);
  const [deliveryMode, setDeliveryMode] = useState<"delivery" | "pickup">("delivery");

  // Carregar dados da empresa para saber se pickup está habilitado
  useEffect(() => {
    if (!companyId) return;
    const ref = doc(firestore, "companies", companyId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setCompanyData(snap.data());
    });
    return () => unsub();
  }, [companyId]);

  const pickupEnabled = companyData?.pickupEnabled === true;

  useEffect(() => {
    if (deliveryMode === "pickup") {
      setAddressStreet("");
      setAddressCity("");
      setAddressNumber("");
      setAddressNeighborhood("");
      setAddressComplement("");
    }
  }, [deliveryMode]);

  // Cálculo do Custo de Entrega e Validação de Região
  const currentNbId = availableNeighborhoods.find(n => 
    n.name.trim().toLowerCase() === addressNeighborhood.trim().toLowerCase()
  )?.id;

  const costSetting = deliveryCosts.find(c => c.neighborhoodId === currentNbId);
  const deliveryPrice = deliveryMode === "pickup" ? 0 : Number(costSetting?.deliveryPrice ?? 0);

  // Aplicar desconto no frete na exibição
  const effectiveDeliveryFee = deliveryDiscountEnabled && deliveryMode !== "pickup" && cartTotal >= deliveryDiscountMinOrder
    ? Math.max(0, deliveryPrice - Math.min(deliveryDiscountValue, deliveryPrice))
    : deliveryPrice;

  // O bairro é suportado apenas se a flag enabled for true
  const isNeighborhoodSupported = costSetting?.enabled === true;

  // A cidade deve estar habilitada nas configurações da loja
  const isCityDeliveryEnabled = citySettings.find(s => s.cityId === addressCity)?.enabled === true;
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const addressesRef = collection(firestore, "addresses");
    const q = query(addressesRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const addressesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      // Ordenar em memória: habilitados no topo, seguidos de ordem cronológica reversa
      addressesData.sort((a: any, b: any) => {
        if (a.enabled && !b.enabled) return -1;
        if (!a.enabled && b.enabled) return 1;

        const dateA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : Date.now() / 1000);
        const dateB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : Date.now() / 1000);
        return dateB - dateA;
      });

      setAddresses(addressesData);
      setLoading(false);

      // Pré-selecionar o endereço habilitado ou o primeiro endereço caso não tenha sido feito ainda
      if (!hasPreselected && addressesData.length > 0) {
        const enabledAddress = addressesData.find(addr => addr.enabled === true);
        const targetAddress = enabledAddress || addressesData[0];
        
        setSelectedAddressId(targetAddress.id);
        setAddressStreet(targetAddress.street);
        setAddressNumber(targetAddress.number);
        setAddressCity(targetAddress.cityId);
        setAddressNeighborhood(targetAddress.neighborhood);
        setAddressComplement(targetAddress.complement || "");
        setHasPreselected(true);
      }
    }, (error) => {
      console.error("Erro ao carregar endereços:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, hasPreselected]);

  // Carregar Cidades do sistema
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "cities"), (snapshot) => {
      setAvailableCities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
    }, (error) => {
      console.error("🔥 Erro ao carregar cidades:", error);
    });
    return () => unsubscribe();
  }, []);

  // Carregar Configurações de Entrega das Cidades
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(firestore, "storeCitySettings"), where("companyId", "==", companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCitySettings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("🔥 Erro ao carregar configurações de cidade:", error);
    });
    return () => unsubscribe();
  }, [companyId]);

  // Carregar Custos de Entrega dos Bairros por Empresa
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(firestore, "deliveryCosts"), where("companyId", "==", companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDeliveryCosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("🔥 Erro ao carregar custos de entrega:", error);
    });
    return () => unsubscribe();
  }, [companyId]);

  // Carregar Bairros da Cidade selecionada
  useEffect(() => {
    if (addressCity) {
      const q = query(collection(firestore, "neighborhoods"), where("cityId", "==", addressCity));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAvailableNeighborhoods(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
      }, (error) => {
        console.error("🔥 Erro ao carregar bairros:", error);
      });
      return () => unsubscribe();
    } else {
      setAvailableNeighborhoods([]);
    }
  }, [addressCity]);

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setAddressStreet(addr.street);
    setAddressNumber(addr.number);
    setAddressCity(addr.cityId);
    setAddressNeighborhood(addr.neighborhood);
    setAddressComplement(addr.complement || "");
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId("new");
    setAddressStreet("");
    setAddressNumber("");
    setAddressCity("");
    setAddressNeighborhood("");
    setAddressComplement("");
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmAndSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (user && saveForFuture && selectedAddressId === "new" && addressStreet && addressNumber) {
      try {
        const neighborhoodObj = availableNeighborhoods.find(n => n.name === addressNeighborhood);
        await addDoc(collection(firestore, "addresses"), {
          userId: user.uid,
          street: addressStreet,
          number: addressNumber,
          neighborhood: addressNeighborhood,
          cityId: addressCity,
          complement: addressComplement || "",
          enabled: true,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Erro ao salvar endereço:", err);
      }
    }

    onConfirm(deliveryPrice, deliveryMode);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-brand-light to-gray-100 flex items-center justify-center p-4 lg:p-8 text-brand-dark select-none">
      
      {/* Central Card */}
      <div className="bg-brand-surface w-full max-w-lg rounded-[24px] border border-brand-border p-6 lg:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-dark tracking-tight">
            {deliveryMode === "delivery" ? "Onde entregamos?" : "Retirar na Loja"}
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            {deliveryMode === "delivery" ? "Informe o endereço para receber seu pedido." : "Seu pedido será preparado e aguardará retirada."}
          </p>
        </div>

        {pickupEnabled && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setDeliveryMode("delivery")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                deliveryMode === "delivery"
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-brand-light text-brand-muted border border-brand-border"
              }`}
            >
              Entrega
            </button>
            <button
              onClick={() => setDeliveryMode("pickup")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                deliveryMode === "pickup"
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-brand-light text-brand-muted border border-brand-border"
              }`}
            >
              Retirar na Loja
            </button>
          </div>
        )}

        {/* Endereço da Loja (Retirada) */}
        {deliveryMode === "pickup" && companyData && (
          <div className="mb-6">
            <div className="p-4 rounded-[12px] border border-brand-primary bg-brand-light flex items-center gap-3">
              <MapPin className="h-5 w-5 text-brand-primary shrink-0" />
              <div>
                <p className="font-bold text-brand-dark text-sm">{companyData.name}</p>
                <p className="text-xs text-brand-muted">
                  {companyData.endereco}, {companyData.numero}{companyData.bairro ? ` — ${companyData.bairro}` : ""}
                </p>
                {companyData.cidade && <p className="text-xs text-brand-muted">{companyData.cidade}{companyData.estado ? ` - ${companyData.estado}` : ""}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Endereços e Formulário (apenas para Entrega) */}
        {deliveryMode === "delivery" && (
          <>
            {user && addresses.length > 0 && (
              <div className="mb-6 flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-brand-muted uppercase ml-1 mb-2">Meus endereços</span>
                <div className="flex flex-col border border-brand-border rounded-[12px] overflow-hidden">
                  <button
                    onClick={handleSelectNewAddress}
                    className={`p-4 border-b border-brand-border transition-all text-left flex items-center gap-3 ${
                      selectedAddressId === "new"
                        ? "bg-brand-light"
                        : "bg-brand-surface hover:bg-brand-light"
                    }`}
                  >
                    <PlusCircle className="h-5 w-5 text-brand-primary" />
                    <span className="text-sm font-bold text-brand-dark">Novo endereço</span>
                  </button>

                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`p-4 border-b border-brand-border last:border-0 transition-all text-left ${
                        selectedAddressId === addr.id
                          ? "bg-brand-light"
                          : "bg-brand-surface hover:bg-brand-light"
                      }`}
                    >
                      <p className="text-sm font-bold text-brand-dark">{addr.street}, {addr.number}</p>
                      <p className="text-xs text-brand-muted">{addr.neighborhood}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 mb-8">
              {selectedAddressId === "new" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-brand-muted uppercase">Rua</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Av. Paulista" 
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      className="w-full bg-brand-light border border-brand-border px-4 py-3 rounded-[12px] text-sm font-semibold text-brand-dark focus:border-brand-primary outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-brand-muted uppercase">Cidade</label>
                      <select 
                        value={addressCity} 
                        onChange={(e) => { setAddressCity(e.target.value); setAddressNeighborhood(""); }}
                        className="w-full bg-brand-light border border-brand-border px-4 py-3 rounded-[12px] text-sm font-semibold outline-none"
                      >
                        <option value="">Selecione...</option>
                        {availableCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-brand-muted uppercase">Bairro</label>
                      <select 
                        value={availableNeighborhoods.find(n => n.name === addressNeighborhood)?.id || ""} 
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = availableNeighborhoods.find(n => n.id === id)?.name || "";
                          setAddressNeighborhood(name);
                        }}
                        disabled={!addressCity}
                        className="w-full bg-brand-light border border-brand-border px-4 py-3 rounded-[12px] text-sm font-semibold outline-none"
                      >
                        <option value="">Selecione...</option>
                        {availableNeighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-brand-muted uppercase">Nº</label>
                      <input 
                        type="text" 
                        placeholder="123" 
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        className="w-full bg-brand-light border border-brand-border px-4 py-3 rounded-[12px] text-sm font-semibold outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-brand-muted uppercase">Complemento</label>
                      <input 
                        type="text" 
                        placeholder="Apto, Bloco..." 
                        value={addressComplement}
                        onChange={(e) => setAddressComplement(e.target.value)}
                        className="w-full bg-brand-light border border-brand-border px-4 py-3 rounded-[12px] text-sm font-semibold outline-none"
                      />
                    </div>
                  </div>

                  {user && (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={saveForFuture}
                        onChange={(e) => setSaveForFuture(e.target.checked)}
                        className="w-4 h-4 rounded border-brand-border accent-brand-primary"
                      />
                      <span className="text-xs font-medium text-brand-muted">Salvar endereço para próximos pedidos</span>
                    </label>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-[12px] border border-brand-primary bg-brand-light flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="font-bold text-brand-dark text-sm">{addressStreet}, {addressNumber}</p>
                    <p className="text-xs text-brand-muted">{addressNeighborhood}</p>
                  </div>
                </div>
              )}
            </div>
          </>
          )}

          {/* Taxa */}
          {(deliveryMode === "pickup" || (addressCity && isCityDeliveryEnabled && isNeighborhoodSupported)) && (
            <div className="flex justify-between items-center p-4 bg-brand-light rounded-[12px] border border-brand-border">
              <span className="text-xs font-bold text-brand-muted uppercase">
                {deliveryMode === "pickup" ? "Retirada" : "Taxa de Entrega"}
              </span>
              <span className="text-base font-bold text-brand-primary">
                {effectiveDeliveryFee === 0 ? "GRÁTIS" : `R$ ${effectiveDeliveryFee.toFixed(2)}`}
              </span>
            </div>
          )}

          {/* Mensagem de desconto no frete */}
          {deliveryDiscountEnabled && deliveryMode !== "pickup" && deliveryPrice > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-[12px]">
              {cartTotal >= deliveryDiscountMinOrder ? (
                <p className="text-xs font-bold text-green-700">
                  ✅ Frete com desconto de R$ {(deliveryPrice - effectiveDeliveryFee).toFixed(2)} aplicado!
                </p>
              ) : deliveryDiscountMinOrder > 0 && (
                <p className="text-xs font-bold text-amber-700">
                  🎉 Adicione mais R$ {(deliveryDiscountMinOrder - cartTotal).toFixed(2)} ao carrinho e ganhe desconto no frete!
                </p>
              )}
            </div>
          )}

          {/* Endereço não atendido */}
          {deliveryMode === "delivery" && addressCity && addressNeighborhood && (!isCityDeliveryEnabled || !isNeighborhoodSupported) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-[12px] flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-700">Desculpe, não entregamos neste endereço</p>
                <p className="text-xs text-red-600 mt-1">
                  {!isCityDeliveryEnabled
                    ? "A loja não realiza entregas na cidade selecionada."
                    : "O bairro informado não está na área de entrega da loja."}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Tente selecionar outro endereço ou opte por retirar na loja.
                </p>
              </div>
            </div>
          )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button 
            className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white font-bold py-4 rounded-[12px] transition-all disabled:opacity-50" 
            disabled={isSubmitting || (deliveryMode === "delivery" && (!addressStreet || !addressNumber || !addressNeighborhood || !isCityDeliveryEnabled || !isNeighborhoodSupported)) || (schedulingRequired && !schedulingConfigured) || (requiresContact && !phoneFilled)} 
            onClick={handleConfirmAndSave}
          >
            {isSubmitting ? "ENVIANDO..." : deliveryMode === "pickup" ? "CONFIRMAR RETIRADA" : "CONFIRMAR E ENVIAR"}
          </button>
          
          <button 
            className="text-sm font-bold text-brand-muted hover:text-brand-dark py-2 transition-all" 
            onClick={onBack}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
