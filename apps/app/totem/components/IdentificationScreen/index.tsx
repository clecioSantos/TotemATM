"use client";
import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, MapPin, Home, PlusCircle, Check, ShieldAlert } from "lucide-react";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { firestore } from "@/src/services/firebase";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, doc, writeBatch, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation";

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
  onConfirm: (deliveryFee: number) => void;
  onBack: () => void;
}

export default function IdentificationScreen({
  addressStreet, setAddressStreet, addressCity, setAddressCity, addressNumber, setAddressNumber, addressNeighborhood, setAddressNeighborhood, addressComplement, setAddressComplement, onConfirm, onBack
}: IdentificationScreenProps) {
  const { user } = useAuth();
  const params = useParams();
  const companyId = params?.companyId as string;

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPreselected, setHasPreselected] = useState(false);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<any[]>([]);
  const [citySettings, setCitySettings] = useState<any[]>([]);
  const [deliveryCosts, setDeliveryCosts] = useState<any[]>([]);

  // Cálculo do Custo de Entrega e Validação de Região
  const currentNbId = availableNeighborhoods.find(n => 
    n.name.trim().toLowerCase() === addressNeighborhood.trim().toLowerCase()
  )?.id;

  const costSetting = deliveryCosts.find(c => c.neighborhoodId === currentNbId);
  const deliveryPrice = Number(costSetting?.deliveryPrice ?? 0);

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
      setAvailableCities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Carregar Configurações de Entrega das Cidades
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(firestore, "storeCitySettings"), where("companyId", "==", companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCitySettings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [companyId]);

  // Carregar Custos de Entrega dos Bairros por Empresa
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(firestore, "deliveryCosts"), where("companyId", "==", companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDeliveryCosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [companyId]);

  // Carregar Bairros da Cidade selecionada
  useEffect(() => {
    if (addressCity) {
      const q = query(collection(firestore, "neighborhoods"), where("cityId", "==", addressCity));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAvailableNeighborhoods(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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

  const handleConfirmAndSave = async () => {
    if (!user) {
      onConfirm(deliveryPrice);
      return;
    }

    try {
      if (selectedAddressId === "new") {
        if (saveForFuture && addressStreet && addressNumber && addressNeighborhood && addressCity) {
          // 1. Desabilitar qualquer outro endereço ativo
          const addressesRef = collection(firestore, "addresses");
          const qEnabled = query(addressesRef, where("userId", "==", user.uid), where("enabled", "==", true));
          const snapshot = await getDocs(qEnabled);
          const batch = writeBatch(firestore);
          snapshot.docs.forEach((doc) => {
            batch.update(doc.ref, { enabled: false });
          });
          await batch.commit();

          // 2. Salvar o novo como ativo/habilitado
          await addDoc(collection(firestore, "addresses"), {
            userId: user.uid,
            street: addressStreet,
            cityId: addressCity,
            number: addressNumber,
            neighborhood: addressNeighborhood,
            complement: addressComplement,
            enabled: true,
            createdAt: serverTimestamp()
          });
        }
      } else {
        // Enviar pedido com endereço existente: torná-lo o único habilitado/ativo
        const addressesRef = collection(firestore, "addresses");
        const qAll = query(addressesRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(qAll);
        const batch = writeBatch(firestore);
        snapshot.docs.forEach((docSnap) => {
          if (docSnap.id === selectedAddressId) {
            batch.update(docSnap.ref, { enabled: true });
          } else if (docSnap.data().enabled === true) {
            batch.update(docSnap.ref, { enabled: false });
          }
        });
        await batch.commit();
      }
    } catch (e) {
      console.error("Erro ao atualizar regras de habilitar endereço no envio:", e);
    }
    onConfirm(deliveryPrice);
  };

  return (
    <div className="min-h-screen w-screen bg-brand-light flex items-center justify-center p-4 md:p-6 text-brand-dark select-none">
      
      {/* Central Card */}
      <div className="bg-white w-full max-w-md rounded-premium border border-brand-border/60 p-6 md:p-8 shadow-xl shadow-stone-200/50 flex flex-col">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-black text-brand-dark tracking-tight flex items-center justify-center gap-1.5">
            Quase lá
            <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse"></span>
          </h1>
          <p className="text-xs md:text-sm text-brand-muted mt-2 mb-6">
            Informe o endereço para entregarmos seu pedido.
          </p>
        </div>

        {/* Endereços Salvos Selector */}
        {user && addresses.length > 0 && (
          <div className="mb-6 flex flex-col gap-2">
            <span className="text-[10px] font-black tracking-widest text-brand-muted uppercase mb-1 ml-1 text-left">
              Selecione o Endereço de Entrega
            </span>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {/* Opção Novo Endereço */}
              <button
                onClick={handleSelectNewAddress}
                className={`flex-shrink-0 p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 min-w-[120px] ${
                  selectedAddressId === "new"
                    ? "border-brand-accent bg-brand-light/30"
                    : "border-stone-100 bg-stone-50/50 hover:border-stone-200"
                }`}
              >
                <PlusCircle className="h-5 w-5 text-brand-accent" />
                <span className="text-xs font-black text-brand-dark">Novo Endereço</span>
              </button>

              {/* Endereços Salvos */}
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectAddress(addr)}
                    className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all text-left flex flex-col justify-between max-w-[200px] min-w-[160px] ${
                      isSelected
                        ? "border-brand-accent bg-brand-light/30"
                        : "border-stone-100 bg-stone-50/50 hover:border-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 w-full overflow-hidden">
                      <Home className="h-3.5 w-3.5 text-brand-accent flex-shrink-0" />
                      <span className="text-[10px] font-black text-brand-muted uppercase truncate">
                        {addr.neighborhood}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-brand-dark truncate w-full">
                      {addr.street}, {addr.number}
                    </p>
                    {addr.complement && (
                      <p className="text-[10px] text-stone-400 font-semibold truncate w-full">
                        {addr.complement}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Inputs ou Resumo do Endereço Selecionado */}
        <div className="flex flex-col gap-4 mb-8">
          <span className="text-[10px] font-black tracking-widest text-brand-muted uppercase text-center">
            {selectedAddressId === "new" ? "Cadastrar Endereço" : "Endereço Selecionado"}
          </span>

          {selectedAddressId === "new" ? (
            <>
              {/* Rua */}
              <div className="flex flex-col">
                <label className="text-[10px] font-black tracking-widest text-brand-muted uppercase mb-2 ml-1">
                  Rua / Logradouro
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Av. Paulista" 
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-brand-accent px-5 py-4 rounded-xl text-base font-semibold text-brand-dark focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[10px] font-black tracking-widest text-brand-muted uppercase mb-2 ml-1">Cidade</label>
                  <select 
                    value={addressCity} 
                    onChange={(e) => { setAddressCity(e.target.value); setAddressNeighborhood(""); }}
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-4 rounded-xl text-sm font-semibold"
                  >
                    <option value="">Selecione...</option>
                    {availableCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-black tracking-widest text-brand-muted uppercase mb-2 ml-1">Bairro</label>
                  <select 
                    value={availableNeighborhoods.find(n => n.name === addressNeighborhood)?.id || ""} 
                    onChange={(e) => {
                      const id = e.target.value;
                      const name = availableNeighborhoods.find(n => n.id === id)?.name || "";
                      setAddressNeighborhood(name);
                    }}
                    disabled={!addressCity}
                    className="w-full bg-stone-50 border border-stone-200 px-4 py-4 rounded-xl text-sm font-semibold"
                  >
                    <option value="">Selecione...</option>
                    {availableNeighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                {/* Número */}
                <label className="text-[10px] font-black tracking-widest text-brand-muted uppercase mb-2 ml-1">Nº</label>
                <input 
                  type="text" 
                  placeholder="123" 
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-4 rounded-xl text-base font-semibold"
                />
              </div>

              {/* Complemento */}
              <input 
                type="text" 
                placeholder="Complemento (Apto, bloco...)" 
                value={addressComplement}
                onChange={(e) => setAddressComplement(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-5 py-4 rounded-xl text-base font-semibold text-brand-dark focus:outline-none transition-all duration-200"
              />

              {/* Salvar Endereço Checkbox */}
              {user && (
                <label className="flex items-center gap-2.5 cursor-pointer mt-2 p-3 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-stone-100/50 transition-all select-none">
                  <input 
                    type="checkbox" 
                    checked={saveForFuture} 
                    onChange={(e) => setSaveForFuture(e.target.checked)}
                    className="rounded border-stone-300 text-brand-accent focus:ring-brand-accent h-4 w-4"
                  />
                  <span className="text-xs font-bold text-stone-600">
                    Salvar este endereço para futuros pedidos
                  </span>
                </label>
              )}
            </>
          ) : (
            <div className="p-5 rounded-2xl border border-brand-accent bg-brand-light/20 flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-accent text-brand-dark px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest">
                Salvo
              </div>
              <div className="flex items-start gap-3 mt-1 min-w-0">
                <MapPin className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="font-black text-brand-dark text-base truncate">{addressStreet}, {addressNumber}</h3>
                  <p className="text-sm text-stone-500 font-bold truncate">{addressNeighborhood}</p>
                  {addressComplement && (
                    <p className="text-[10px] text-stone-400 font-semibold mt-0.5">{addressComplement}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Feedback de Entrega e Preço */}
          {addressCity && (
            <div className="mt-2 space-y-3">
              {!isCityDeliveryEnabled ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Infelizmente, não realizamos entregas nesta cidade no momento.</span>
                </div>
              ) : addressNeighborhood && (
                !isNeighborhoodSupported ? (
                  <div className="p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-xs font-bold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Ops! Ainda não atendemos este bairro para entrega.</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-4 bg-brand-light/30 rounded-xl border border-brand-accent/20">
                    <span className="text-xs font-bold text-brand-muted uppercase">Taxa de Entrega</span>
                    <span className="text-base font-black text-brand-success">
                      {deliveryPrice === 0 ? "GRÁTIS" : `R$ ${deliveryPrice.toFixed(2)}`}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button 
            className="w-full bg-brand-success hover:bg-green-700 text-white font-black text-base py-4 rounded-premium shadow-lg shadow-green-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
            disabled={!addressStreet || !addressNumber || !addressNeighborhood || !isCityDeliveryEnabled || !isNeighborhoodSupported} 
            onClick={handleConfirmAndSave}
          >
            <span>CONFIRMAR E ENVIAR</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button 
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 py-3 rounded-full hover:bg-stone-50 transition-colors" 
            onClick={onBack}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar para o pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
}