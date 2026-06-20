"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { useStoreSetupStatus } from "@/src/hooks/useStoreSetupStatus";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import {
  CheckCircle, Circle, ChevronRight, ChevronLeft, Rocket, Image,
  Store, MapPin, CreditCard, Package, Truck, Loader2,
  Camera, ShoppingBag, Clock, Tag, Upload, Trash2, Plus, ExternalLink
} from "lucide-react";

const stepKeys = ["logo", "banner", "storeData", "schedule", "areas", "deliveryOrPickup", "mercadopago", "catalog", "review"] as const;
type StepKey = (typeof stepKeys)[number];

const diasSemana = [
  { id: "seg", label: "Segunda" }, { id: "ter", label: "Terça" }, { id: "qua", label: "Quarta" },
  { id: "qui", label: "Quinta" }, { id: "sex", label: "Sexta" }, { id: "sab", label: "Sábado" }, { id: "dom", label: "Domingo" },
];

const areasList = ["Lanches", "Pizzas", "Pratos", "Marmitas", "Porções", "Bebidas", "Sobremesas", "Açaí", "Sushi", "Padaria e Confeitaria e mercado"];

const estadosBrasileiros = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

function OnboardingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { status, loading, refetch } = useStoreSetupStatus(user?.companyId);
  const [currentStep, setCurrentStep] = useState<StepKey>("logo");
  const [companyData, setCompanyData] = useState<any>(null);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.companyId) return;
    getDoc(doc(firestore, "companies", user.companyId)).then((snap) => { if (snap.exists()) setCompanyData(snap.data()); });
    getDocs(query(collection(firestore, "cities"), ...([] as any[]))).then((s) => setCities(s.docs.map((d: any) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name)))).catch(() => {});
  }, [user?.companyId]);

  useEffect(() => {
    if (!user?.companyId) return;
    const unsub = onSnapshot(doc(firestore, "companies", user.companyId), (snap) => { if (snap.exists()) setCompanyData(snap.data()); });
    return () => unsub();
  }, [user?.companyId]);

  const saveCompany = async (data: any) => {
    if (!user?.companyId) return;
    try { await updateDoc(doc(firestore, "companies", user.companyId), data); setTimeout(() => refetch(), 500); } catch (e) { console.error(e); }
  };

  const stepOrder = [...stepKeys];
  const currentIndex = stepOrder.indexOf(currentStep);
  const goNext = () => { if (currentIndex < stepOrder.length - 1) setCurrentStep(stepOrder[currentIndex + 1]); };
  const goBack = () => { if (currentIndex > 0) setCurrentStep(stepOrder[currentIndex - 1]); };

  const { steps, percent, completed, canOpen } = status || { steps: {} as any, percent: 0, completed: [], canOpen: false };

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, setUploading: (v: boolean) => void) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("image", file);
      if (companyData?.[field]) fd.append("oldImageUrl", companyData[field]);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const result = await res.json();
      if (res.ok) { await updateDoc(doc(firestore, "companies", user!.companyId), { [field]: result.imageUrl }); setTimeout(() => refetch(), 500); }
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "logo":
        return <StepCard icon={<Camera size={32} />} title="Foto de Perfil" help="Essa imagem será exibida para seus clientes na listagem de lojas." done={steps.logo} doneLabel="Configurada">
          <div className="space-y-4">
            {companyData?.logo && <img src={companyData.logo} alt="logo" className="w-24 h-24 rounded-2xl object-cover border" />}
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors">
              {uploadingLogo ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span className="text-sm font-medium text-gray-600">{uploadingLogo ? "Enviando..." : companyData?.logo ? "Trocar foto" : "Selecionar foto"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "logo", setUploadingLogo)} disabled={uploadingLogo} />
            </label>
          </div>
        </StepCard>;
      case "banner":
        return <StepCard icon={<Image size={32} />} title="Banner da Loja" help="O banner aparece no topo da página da sua loja." done={steps.banner} doneLabel="Configurado">
          <div className="space-y-4">
            {companyData?.banner && <div className="w-full h-24 rounded-xl overflow-hidden"><img src={companyData.banner} alt="banner" className="w-full h-full object-cover" /></div>}
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors">
              {uploadingBanner ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span className="text-sm font-medium text-gray-600">{uploadingBanner ? "Enviando..." : companyData?.banner ? "Trocar banner" : "Selecionar banner"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "banner", setUploadingBanner)} disabled={uploadingBanner} />
            </label>
          </div>
        </StepCard>;
      case "storeData":
        return <StepCard icon={<Store size={32} />} title="Dados da Loja" help="Preencha os dados básicos da sua empresa." done={steps.storeData} doneLabel="Preenchidos">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[{ key: "name", label: "Nome*" }, { key: "telefone", label: "Telefone" }, { key: "endereco", label: "Endereço" }, { key: "numero", label: "Número" }, { key: "bairro", label: "Bairro" }].map((f) => (
              <div key={f.key}><label className="text-xs font-bold text-gray-500 uppercase">{f.label}</label>
                <input value={companyData?.[f.key] || ""} onChange={(e) => setCompanyData((p: any) => ({ ...p, [f.key]: e.target.value }))} onBlur={() => { const v = companyData?.[f.key]; if (v) saveCompany({ [f.key]: v }); }} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-500" /></div>
            ))}
            <div><label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
              <select value={companyData?.estado || ""} onChange={(e) => { setCompanyData((p: any) => ({ ...p, estado: e.target.value })); saveCompany({ estado: e.target.value }); }} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
                <option value="">Selecione</option>{estadosBrasileiros.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
              <select value={companyData?.cidade || ""} onChange={(e) => { setCompanyData((p: any) => ({ ...p, cidade: e.target.value })); saveCompany({ cidade: e.target.value }); }} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
                <option value="">Selecione</option>{cities.filter((c) => !companyData?.estado || c.estado === companyData.estado).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select></div>
          </div>
        </StepCard>;
      case "schedule":
        return <StepCard icon={<Clock size={32} />} title="Horários de Funcionamento" help="Defina os dias e horários em que sua loja estará aberta." done={steps.schedule} doneLabel="Configurados">
          <div className="space-y-2">{diasSemana.map((dia) => {
            const h = companyData?.horario?.[dia.id] || { open: "", close: "" };
            return <div key={dia.id} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-sm font-medium text-gray-600">{dia.label}</span>
              <input type="time" value={h.open || ""} onChange={(e) => { const n = { ...companyData?.horario, [dia.id]: { ...h, open: e.target.value } }; setCompanyData((p: any) => ({ ...p, horario: n })); }} onBlur={() => companyData?.horario && saveCompany({ horario: companyData.horario })} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              <input type="time" value={h.close || ""} onChange={(e) => { const n = { ...companyData?.horario, [dia.id]: { ...h, close: e.target.value } }; setCompanyData((p: any) => ({ ...p, horario: n })); }} onBlur={() => companyData?.horario && saveCompany({ horario: companyData.horario })} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>;
          })}</div>
        </StepCard>;
      case "areas":
        return <StepCard icon={<Tag size={32} />} title="Áreas de Atuação" help="Selecione os tipos de produtos que sua loja oferece." done={steps.areas} doneLabel="Configuradas">
          <div className="grid grid-cols-2 gap-2">{areasList.map((area) => {
            const selected = companyData?.areasAtuacao?.includes(area);
            return <label key={area} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
              <input type="checkbox" checked={selected || false} onChange={async (e) => {
                const current = companyData?.areasAtuacao || [];
                const n = e.target.checked ? [...current, area] : current.filter((a: string) => a !== area);
                setCompanyData((p: any) => ({ ...p, areasAtuacao: n })); await saveCompany({ areasAtuacao: n });
              }} className="sr-only" />
              {selected ? <CheckCircle size={16} className="text-orange-500" /> : <Circle size={16} className="text-gray-300" />}
              <span className="text-sm font-medium">{area}</span>
            </label>;
          })}</div>
        </StepCard>;
      case "deliveryOrPickup":
        return <DeliveryStep companyId={user?.companyId} done={steps.deliveryOrPickup} refetch={refetch} />;
      case "mercadopago":
        return <MercadoPagoStep companyId={user?.companyId} done={steps.mercadopago} refetch={refetch} />;
      case "catalog":
        return <CatalogStep companyId={user?.companyId} done={steps.category && steps.product} refetch={refetch} />;
      case "review":
        return <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Rocket size={40} className="text-green-600" /></div>
            <h2 className="text-2xl font-bold text-gray-900">{canOpen ? "Tudo pronto!" : "Quase lá!"}</h2>
            <p className="text-gray-500 mt-1">{canOpen ? "Sua loja está pronta para receber pedidos." : "Complete os itens pendentes para abrir sua loja."}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 mb-6">
            {[
              { key: "logo", label: "Foto de perfil" }, { key: "banner", label: "Banner" }, { key: "storeData", label: "Dados da loja" },
              { key: "schedule", label: "Horários" }, { key: "areas", label: "Áreas de atuação" }, { key: "deliveryOrPickup", label: "Entrega ou retirada" },
              { key: "mercadopago", label: "Mercado Pago" }, { key: "category", label: "Categoria" }, { key: "product", label: "Produto" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                {(steps as any)[item.key] ? <CheckCircle size={20} className="text-green-500" /> : <Circle size={20} className="text-red-300" />}
              </div>
            ))}
          </div>
          {canOpen ? (
            <button onClick={async () => { if (!user?.companyId) return; await updateDoc(doc(firestore, "companies", user.companyId), { open: true }); router.push("/admin"); }}
              className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-2xl hover:bg-green-700 shadow-lg flex items-center justify-center gap-2"><Rocket size={22} /> Abrir Loja</button>
          ) : (
            <button onClick={() => { const f = stepOrder.find(s => s !== "review" && !(steps as any)[s === "catalog" ? "category" : s]); if (f) setCurrentStep(f); }}
              className="w-full py-4 bg-orange-600 text-white font-bold text-lg rounded-2xl hover:bg-orange-700">Continuar Configuração</button>
          )}
        </div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Rocket size={20} className="text-orange-600" /></div>
          <div><h1 className="text-lg font-bold text-gray-900">Configuração da Loja</h1><p className="text-xs text-gray-500">{completed.length} de 9 etapas concluídas</p></div>
        </div>
        <button onClick={() => router.push("/admin")} className="text-sm text-gray-400 hover:text-gray-600">Sair</button>
      </div>
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-1 mb-2">
            {stepKeys.filter(s => s !== "review").map((s) => {
              const isActive = s === currentStep;
              const k = s === "catalog" ? "category" : s;
              return <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${(steps as any)[k] ? "bg-green-500" : isActive ? "bg-orange-500" : "bg-gray-200"}`} />;
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{currentStep === "review" ? "Revisão" : currentStep}</span>
            <span>{percent}%</span>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8">{renderStep()}</div>
      {currentStep !== "review" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={goBack} disabled={currentIndex === 0} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-30"><ChevronLeft size={18} /> Anterior</button>
            <button onClick={goNext}
              disabled={currentStep === "catalog" ? !(steps.category && steps.product) : !(steps as any)[currentStep]}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${(currentStep === "catalog" ? steps.category && steps.product : (steps as any)[currentStep]) ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >Próximo <ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ icon, title, help, done, doneLabel, children }: { icon: React.ReactNode; title: string; help: string; done: boolean; doneLabel: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-start gap-4 mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${done ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>{done ? <CheckCircle size={28} /> : icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-3"><h2 className="text-xl font-bold text-gray-900">{title}</h2>{done && <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold flex items-center gap-1"><CheckCircle size={12} /> {doneLabel}</span>}</div>
        <p className="text-sm text-gray-500 mt-1">{help}</p>
      </div>
    </div>
    {children}
  </div>;
}

function DeliveryStep({ companyId, done, refetch }: { companyId?: string; done: boolean; refetch: () => void }) {
  const [cities, setCities] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [citySettings, setCitySettings] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [pickupEnabled, setPickupEnabled] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    getDoc(doc(firestore, "companies", companyId)).then((s) => { if (s.exists()) setPickupEnabled(s.data().pickupEnabled === true); });
    const u1 = onSnapshot(collection(firestore, "cities"), (snap) => setCities(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name))));
    const u2 = onSnapshot(query(collection(firestore, "deliveryCosts"), where("companyId", "==", companyId)), (snap) => setCosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(query(collection(firestore, "storeCitySettings"), where("companyId", "==", companyId)), (snap) => setCitySettings(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, [companyId]);

  useEffect(() => {
    if (!selectedCityId) { setNeighborhoods([]); return; }
    const u = onSnapshot(query(collection(firestore, "neighborhoods"), where("cityId", "==", selectedCityId)), (snap) => setNeighborhoods(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name))));
    return () => u();
  }, [selectedCityId]);

  const setDeliveryPrice = async (nb: any, price: number | null) => {
    if (!companyId) return;
    const existing = costs.find((c) => c.neighborhoodId === nb.id);
    try {
      if (existing) {
        if (price === null) { await deleteDoc(doc(firestore, "deliveryCosts", existing.id)); setCosts((p) => p.filter((c) => c.id !== existing.id)); }
        else { await updateDoc(doc(firestore, "deliveryCosts", existing.id), { deliveryPrice: price, enabled: true }); setCosts((p) => p.map((c) => c.id === existing.id ? { ...c, deliveryPrice: price, enabled: true } : c)); }
      } else if (price !== null) {
        const ref = await addDoc(collection(firestore, "deliveryCosts"), { companyId, neighborhoodId: nb.id, neighborhood: nb.name, deliveryPrice: price, enabled: true, createdAt: serverTimestamp() });
        setCosts((p) => [...p, { id: ref.id, companyId, neighborhoodId: nb.id, neighborhood: nb.name, deliveryPrice: price, enabled: true }]);
      }
      if (price !== null && nb.cityId) {
        const existingSetting = citySettings.find((s) => s.cityId === nb.cityId);
        if (existingSetting) {
          if (!existingSetting.enabled) await updateDoc(doc(firestore, "storeCitySettings", existingSetting.id), { enabled: true });
        } else {
          await addDoc(collection(firestore, "storeCitySettings"), { companyId, cityId: nb.cityId, enabled: true });
        }
      }
      setTimeout(() => refetch(), 300);
    } catch (e) { console.error(e); }
  };

  const toggleCity = async (cityId: string, enabled: boolean) => {
    if (!companyId) return;
    try {
      const existing = citySettings.find((s) => s.cityId === cityId);
      if (existing) { await updateDoc(doc(firestore, "storeCitySettings", existing.id), { enabled }); setCitySettings((p) => p.map((s) => s.id === existing.id ? { ...s, enabled } : s)); }
      else { await addDoc(collection(firestore, "storeCitySettings"), { companyId, cityId, enabled }); }
    } catch (e) { console.error(e); }
  };

  const togglePickup = async (val: boolean) => {
    if (!companyId) return;
    await updateDoc(doc(firestore, "companies", companyId), { pickupEnabled: val });
    setPickupEnabled(val); setTimeout(() => refetch(), 300);
  };

  return <StepCard icon={<Truck size={32} />} title="Entrega e Retirada" help="Defina como seus clientes receberão os pedidos." done={done} doneLabel="Configurada">
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cidades com entrega ativa</p>
        <div className="max-h-32 overflow-y-auto space-y-1.5">{cities.map((city) => {
          const isActive = citySettings.find((s) => s.cityId === city.id)?.enabled !== false;
          return <label key={city.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => toggleCity(city.id, e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
            <span className="text-sm font-medium">{city.name} - {city.estado}</span>
          </label>;
        })}</div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Bairros</p>
        <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2 outline-none">
          <option value="">Selecione uma cidade</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selectedCityId && neighborhoods.length === 0 && <p className="text-xs text-gray-400">Nenhum bairro cadastrado.</p>}
        <div className="max-h-44 overflow-y-auto space-y-1.5">{neighborhoods.map((nb) => {
          const cost = costs.find((c) => c.neighborhoodId === nb.id);
          return <div key={nb.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">{nb.name}</span>
            <input type="number" step="0.5" min="0" value={cost?.deliveryPrice ?? ""} placeholder="R$" onChange={async (e) => {
              const val = parseFloat(e.target.value);
              if (e.target.value === "" || e.target.value === "0") await setDeliveryPrice(nb, null);
              else if (!isNaN(val) && val > 0) await setDeliveryPrice(nb, val);
            }} className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right outline-none focus:border-orange-500" />
          </div>;
        })}</div>
      </div>
      <div className="border-t border-gray-100 pt-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={pickupEnabled} onChange={(e) => togglePickup(e.target.checked)} className="w-5 h-5 rounded accent-orange-500" />
          <span className="text-sm font-medium">Habilitar retirada na loja</span>
        </label>
      </div>
    </div>
  </StepCard>;
}

function CatalogStep({ companyId, done, refetch }: { companyId?: string; done: boolean; refetch: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [addingCat, setAddingCat] = useState(false);
  const [addingProd, setAddingProd] = useState(false);
  const [activeTab, setActiveTab] = useState<"categories" | "products">("categories");
  const [uploadingProdImg, setUploadingProdImg] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  const [catForm, setCatForm] = useState({ name: "", possuiTamanhos: false, possuiSabores: false, schedulingMode: "none", minimumPreparationMinutes: "", requiresCustomerContact: false, customerInstructions: "" });
  const [prodForm, setProdForm] = useState({ name: "", description: "", price: "", categoryId: "", imageUrl: "", active: true, featured: false });
  const [sizes, setSizes] = useState<{ nome: string; preco: string; quantidadeSabores: string }[]>([]);

  useEffect(() => {
    if (!companyId) return;
    const u1 = onSnapshot(query(collection(firestore, "categories"), where("companyId", "==", companyId)), (snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(query(collection(firestore, "products"), where("companyId", "==", companyId)), (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, [companyId]);

  const resetCatForm = () => { setCatForm({ name: "", possuiTamanhos: false, possuiSabores: false, schedulingMode: "none", minimumPreparationMinutes: "", requiresCustomerContact: false, customerInstructions: "" }); setEditingCatId(null); };
  const resetProdForm = () => { setProdForm({ name: "", description: "", price: "", categoryId: "", imageUrl: "", active: true, featured: false }); setSizes([]); setEditingProdId(null); };

  const saveCategory = async () => {
    if (!catForm.name.trim() || !companyId) return;
    setAddingCat(true);
    try {
      const data = {
        name: catForm.name.trim(), possuiTamanhos: catForm.possuiTamanhos, possuiSabores: catForm.possuiSabores,
        schedulingMode: catForm.schedulingMode,
        minimumPreparationMinutes: catForm.minimumPreparationMinutes ? parseInt(catForm.minimumPreparationMinutes) : null,
        requiresCustomerContact: catForm.requiresCustomerContact,
        customerInstructions: catForm.customerInstructions || null,
      };
      if (editingCatId) {
        await updateDoc(doc(firestore, "categories", editingCatId), data);
      } else {
        await addDoc(collection(firestore, "categories"), { ...data, companyId, createdAt: serverTimestamp() });
      }
      resetCatForm(); setTimeout(() => refetch(), 300);
    } catch (e) { console.error(e); } finally { setAddingCat(false); }
  };

  const editCategory = (c: any) => {
    setCatForm({
      name: c.name || "", possuiTamanhos: c.possuiTamanhos || false, possuiSabores: c.possuiSabores || false,
      schedulingMode: c.schedulingMode || "none", minimumPreparationMinutes: c.minimumPreparationMinutes?.toString() || "",
      requiresCustomerContact: c.requiresCustomerContact || false, customerInstructions: c.customerInstructions || "",
    });
    setEditingCatId(c.id);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    try { await deleteDoc(doc(firestore, "categories", id)); setTimeout(() => refetch(), 300); } catch (e) { console.error(e); }
  };

  const saveProduct = async () => {
    if (!prodForm.name.trim() || !prodForm.price || !prodForm.categoryId || !companyId) return;
    setAddingProd(true);
    try {
      const sizesData = sizes.filter((s) => s.nome.trim() && s.preco).map((s) => ({
        nome: s.nome.trim(), preco: parseFloat(s.preco), quantidadeSabores: parseInt(s.quantidadeSabores) || 0,
      }));
      const data = {
        name: prodForm.name.trim(), description: prodForm.description.trim(),
        price: parseFloat(prodForm.price), imageUrl: prodForm.imageUrl || "",
        categoryId: prodForm.categoryId, active: prodForm.active, featured: prodForm.featured,
        sizes: sizesData.length > 0 ? sizesData : [],
      };
      if (editingProdId) {
        await updateDoc(doc(firestore, "products", editingProdId), data);
      } else {
        await addDoc(collection(firestore, "products"), { ...data, companyId, createdAt: serverTimestamp() });
      }
      resetProdForm(); setTimeout(() => refetch(), 300);
    } catch (e) { console.error(e); } finally { setAddingProd(false); }
  };

  const editProduct = (p: any) => {
    setProdForm({
      name: p.name || "", description: p.description || "", price: p.price?.toString() || "",
      categoryId: p.categoryId || "", imageUrl: p.imageUrl || "",
      active: p.active !== false, featured: p.featured || false,
    });
    setSizes((p.sizes || []).map((s: any) => ({ nome: s.nome || "", preco: s.preco?.toString() || "", quantidadeSabores: s.quantidadeSabores?.toString() || "0" })));
    setEditingProdId(p.id);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    try { await deleteDoc(doc(firestore, "products", id)); setTimeout(() => refetch(), 300); } catch (e) { console.error(e); }
  };

  const addSize = () => setSizes((p) => [...p, { nome: "", preco: "", quantidadeSabores: "0" }]);
  const updateSize = (i: number, field: string, val: string) => setSizes((p) => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const removeSize = (i: number) => setSizes((p) => p.filter((_, idx) => idx !== i));

  const uploadProdImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingProdImg(true);
    try {
      const fd = new FormData(); fd.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const result = await res.json();
      if (res.ok) setProdForm((p) => ({ ...p, imageUrl: result.imageUrl }));
    } catch (e) { console.error(e); } finally { setUploadingProdImg(false); }
  };

  return <StepCard icon={<ShoppingBag size={32} />} title="Catálogo" help="Adicione os produtos que seus clientes poderão comprar." done={done} doneLabel="Configurado">
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setActiveTab("categories")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "categories" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
          Categorias ({categories.length})
        </button>
        <button onClick={() => setActiveTab("products")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "products" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
          Produtos ({products.length})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && <>
        {categories.length > 0 && <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">{categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-gray-700 truncate">{c.name}</span>
              {c.possuiTamanhos && <span className="text-[10px] text-gray-400">📐</span>}
              {c.possuiSabores && <span className="text-[10px] text-gray-400">🍨</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => editCategory(c)} className="p-1.5 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-lg">Editar</button>
              <button onClick={() => deleteCategory(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={13} className="text-red-400" /></button>
            </div>
          </div>
        ))}</div>}

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase">{editingCatId ? "Editar Categoria" : "Nova Categoria"}</p>
          <input value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome da categoria" className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-purple-500" />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={catForm.possuiTamanhos} onChange={(e) => setCatForm((p) => ({ ...p, possuiTamanhos: e.target.checked }))} className="w-4 h-4 rounded accent-purple-500" /> Possui tamanhos</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={catForm.possuiSabores} onChange={(e) => setCatForm((p) => ({ ...p, possuiSabores: e.target.checked }))} className="w-4 h-4 rounded accent-purple-500" /> Possui sabores</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Agendamento</label>
              <select value={catForm.schedulingMode} onChange={(e) => setCatForm((p) => ({ ...p, schedulingMode: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none">
                <option value="none">Sem agendamento</option><option value="optional">Opcional</option><option value="required">Obrigatório</option>
              </select></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Prep. mínimo (min)</label>
              <input type="number" value={catForm.minimumPreparationMinutes} onChange={(e) => setCatForm((p) => ({ ...p, minimumPreparationMinutes: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={catForm.requiresCustomerContact} onChange={(e) => setCatForm((p) => ({ ...p, requiresCustomerContact: e.target.checked }))} className="w-4 h-4 rounded accent-purple-500" /> Requer contato com o cliente</label>
          {catForm.requiresCustomerContact && <textarea value={catForm.customerInstructions} onChange={(e) => setCatForm((p) => ({ ...p, customerInstructions: e.target.value }))} placeholder="Instruções para o cliente..." rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none resize-none" />}
          <div className="flex gap-2">
            <button onClick={saveCategory} disabled={!catForm.name.trim() || addingCat} className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1">{addingCat ? "Salvando..." : editingCatId ? "Atualizar" : "Adicionar"}</button>
            {editingCatId && <button onClick={resetCatForm} className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700">Cancelar</button>}
          </div>
        </div>
      </>}

      {/* Products Tab */}
      {activeTab === "products" && <>
        {products.length > 0 && <div className="max-h-48 overflow-y-auto space-y-1.5 mb-3">{products.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center"><Package size={14} className="text-gray-400" /></div>}
              <span className="text-sm font-medium text-gray-700 truncate">{p.name}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm font-bold text-gray-500">R$ {p.price?.toFixed(2)}</span>
              <button onClick={() => editProduct(p)} className="ml-1 p-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-lg">Editar</button>
              <button onClick={() => deleteProduct(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={13} className="text-red-400" /></button>
            </div>
          </div>
        ))}</div>}

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase">{editingProdId ? "Editar Produto" : "Novo Produto"}</p>
          <input value={prodForm.name} onChange={(e) => setProdForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome do produto" className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-orange-500" />
          <textarea value={prodForm.description} onChange={(e) => setProdForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descrição (opcional)" rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Preço (R$)</label>
              <input type="number" step="0.01" min="0" value={prodForm.price} onChange={(e) => setProdForm((p) => ({ ...p, price: e.target.value }))} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Categoria</label>
              <select value={prodForm.categoryId} onChange={(e) => setProdForm((p) => ({ ...p, categoryId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none">
                <option value="">Selecione</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Imagem</label>
            <div className="flex items-center gap-3 mt-1">
              {prodForm.imageUrl && <img src={prodForm.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border" />}
              <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-orange-400 transition-colors">
                {uploadingProdImg ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} className="text-gray-500" />}
                <span className="text-sm text-gray-600">{uploadingProdImg ? "Enviando..." : prodForm.imageUrl ? "Trocar" : "Upload"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={uploadProdImage} disabled={uploadingProdImg} />
              </label>
            </div>
          </div>
          <div className="flex gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prodForm.active} onChange={(e) => setProdForm((p) => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded accent-orange-500" /> Ativo</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prodForm.featured} onChange={(e) => setProdForm((p) => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 rounded accent-orange-500" /> Destaque</label></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Tamanhos</span>
              <button onClick={addSize} className="text-xs text-orange-600 font-semibold flex items-center gap-1"><Plus size={14} /> Adicionar tamanho</button>
            </div>
            {sizes.length > 0 && <div className="space-y-2">{sizes.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={s.nome} onChange={(e) => updateSize(i, "nome", e.target.value)} placeholder="Ex: Grande" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none" />
                <input value={s.preco} onChange={(e) => updateSize(i, "preco", e.target.value)} type="number" step="0.01" min="0" placeholder="Preço" className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none" />
                <input value={s.quantidadeSabores} onChange={(e) => updateSize(i, "quantidadeSabores", e.target.value)} type="number" min="0" placeholder="Sabores" className="w-16 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none" title="Qtd. sabores" />
                <button onClick={() => removeSize(i)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
              </div>
            ))}</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={saveProduct} disabled={!prodForm.name.trim() || !prodForm.price || !prodForm.categoryId || addingProd} className="flex-1 py-2.5 bg-orange-600 text-white font-bold rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-1">{addingProd ? "Salvando..." : editingProdId ? "Atualizar" : "Adicionar"}</button>
            {editingProdId && <button onClick={resetProdForm} className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700">Cancelar</button>}
          </div>
        </div>
      </>}
    </div>
  </StepCard>;
}

function MercadoPagoStep({ companyId, done, refetch }: { companyId?: string; done: boolean; refetch: () => void }) {
  const [mpConnected, setMpConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    getDoc(doc(firestore, "companies", companyId)).then((s) => { if (s.exists()) setMpConnected(s.data().mercadopago_connected === true); setLoading(false); });
  }, [companyId]);

  const connect = async () => {
    try { const res = await fetch(`/api/mercadopago/oauth/connect?companyId=${companyId}&redirect=/admin/onboarding`); const data = await res.json(); if (data.url) window.location.href = data.url; } catch (e) { console.error(e); }
  };
  const disconnect = async () => {
    if (!companyId) return;
    try { await fetch("/api/mercadopago/oauth/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId }) }); setMpConnected(false); setTimeout(() => refetch(), 300); } catch (e) { console.error(e); }
  };

  return <StepCard icon={<CreditCard size={32} />} title="Mercado Pago" help="Conecte sua conta para receber pagamentos." done={done} doneLabel="Conectado">
    {loading ? <div className="flex items-center gap-2 text-gray-400"><Loader2 size={16} className="animate-spin" /> <span className="text-sm">Verificando...</span></div>
    : mpConnected ? <div className="space-y-3"><div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl"><CheckCircle size={18} className="text-green-500" /><span className="text-sm font-medium text-green-700">Mercado Pago conectado</span></div><button onClick={disconnect} className="text-sm text-red-500 hover:text-red-600 font-medium">Desconectar</button></div>
    : <button onClick={connect} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"><ExternalLink size={18} /> Conectar Mercado Pago</button>}
  </StepCard>;
}

export default function OnboardingPage() {
  return <ErrorBoundary context="OnboardingPage"><OnboardingContent /></ErrorBoundary>;
}
