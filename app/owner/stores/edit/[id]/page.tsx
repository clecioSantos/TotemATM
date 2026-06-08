"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, onSnapshot, addDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useRouter, useParams } from "next/navigation";
import { StoreUser, adminStorePermissions, computeStoreIds } from "@totem/shared/types/auth";
import { StoreUsersSection } from "@/src/components/StoreUsersSection";

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const [cities, setCities] = useState<any[]>([]);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCity, setNewCity] = useState({ name: "", estado: "" });
  
  const [formData, setFormData] = useState<any>(null);
  const [users, setUsers] = useState<StoreUser[]>([]);
  const [previousCommission, setPreviousCommission] = useState<number | null>(null);

  const estadosBrasileiros = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const diasSemana = [
    { id: "seg", label: "Segunda" },
    { id: "ter", label: "Terça" },
    { id: "qua", label: "Quarta" },
    { id: "qui", label: "Quinta" },
    { id: "sex", label: "Sexta" },
    { id: "sab", label: "Sábado" },
    { id: "dom", label: "Domingo" },
  ];

  const areas = [
    "Lanches", "Pizzas", "Pratos", "Marmitas", "Porções", 
    "Bebidas", "Sobremesas", "Açaí", "Sushi", "Padaria e Confeitaria e mercado"
  ];

  const maskCEP = (value: string) => {
    return value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").substring(0, 9);
  };

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5")
      .substring(0, 18);
  };

  const maskTelefone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/^(\(\d{2}\)\s\d{4})(\d)/, "$1-$2")
        .substring(0, 14);
    } else {
      return digits
        .replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3")
        .substring(0, 15);
    }
  };

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const docRef = doc(firestore, "companies", storeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            if (data.cep) data.cep = maskCEP(data.cep);
            if (data.telefone) data.telefone = maskTelefone(data.telefone);
            if (data.whatsapp) data.whatsapp = maskTelefone(data.whatsapp);
            if (data.cnpj) data.cnpj = maskCNPJ(data.cnpj);
          }
          setFormData(data);
          setUsers(data.users || []);
          setPreviousCommission(data.platform_commission_percent ?? 6.00);
        }
      } catch (error) {
        console.error("🔥 Erro ao buscar loja:", error);
      }
    };
    fetchStore();

    const unsub = onSnapshot(collection(firestore, "cities"), (snap) => {
      setCities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("🔥 Erro ao carregar cidades:", error);
    });
    return () => unsub();
  }, [storeId]);

  const handleAddCity = async () => {
    try {
      if (!newCity.name || !newCity.estado) return;
      await addDoc(collection(firestore, "cities"), newCity);
      setNewCity({ name: "", estado: "" });
      setIsAddingCity(false);
    } catch (error) {
      console.error("🔥 Erro ao adicionar cidade:", error);
    }
  };

  const handleHorarioChange = (dia: string, field: 'open' | 'close', value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      horario: {
        ...prev.horario,
        [dia]: { ...prev.horario?.[dia] || { open: "", close: "" }, [field]: value },
      },
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      if (formData?.[field]) {
        uploadData.append("oldImageUrl", formData[field]);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setFormData((prev: any) => ({ ...prev, [field]: result.imageUrl }));
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Verifique o servidor.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (name === "cep") {
      value = maskCEP(value);
    } else if (name === "telefone" || name === "whatsapp") {
      value = maskTelefone(value);
    } else if (name === "cnpj") {
      value = maskCNPJ(value);
    }
    setFormData({ ...formData, [name]: value });
  };

  const toggleArea = (area: string) => {
    const current = formData.areasAtuacao || [];
    const updated = current.includes(area) ? current.filter((a: string) => a !== area) : [...current, area];
    setFormData({ ...formData, areasAtuacao: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { userIds, adminIds } = computeStoreIds(users);
      const updateData = { ...formData, users, userIds, adminIds };

      const newCommission = formData.platform_commission_percent;
      if (previousCommission !== null && newCommission !== previousCommission) {
        const auditRef = collection(firestore, "commission_audit_log");
        await addDoc(auditRef, {
          companyId: storeId,
          companyName: formData.name,
          previousCommission,
          newCommission,
          changedBy: "owner",
          changedById: "system",
          timestamp: new Date(),
        });
        setPreviousCommission(newCommission);
      }

      await updateDoc(doc(firestore, "companies", storeId), updateData);

      for (const storeUser of users) {
        try {
          const userRef = doc(firestore, "users", storeUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().companyId !== storeId) {
            await updateDoc(userRef, {
              companyId: storeId,
              role: storeUser.role === "admin" ? "admin" : "collaborator",
            });
          }
        } catch (err) {
          console.error(`Erro ao atualizar perfil do usuário ${storeUser.uid}:`, err);
        }
      }

      alert("Loja atualizada!");
      router.push("/owner/stores");
    } catch (error) {
      console.error("Erro ao atualizar loja:", error);
      alert("Erro ao atualizar loja.");
    }
  };

  if (!formData) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Loja</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
            { name: "name", label: "Nome da Loja" },
            { name: "razãoSocial", label: "Razão Social" },
            { name: "cnpj", label: "CNPJ" },
            { name: "telefone", label: "Telefone" },
            { name: "whatsapp", label: "WhatsApp" },
            { name: "email", label: "E-mail" },
            { name: "endereco", label: "Endereço" },
            { name: "cep", label: "CEP" },
            { name: "bairro", label: "Bairro" },
            { name: "numero", label: "Número" },
        ].map(field => (
            <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                <input name={field.name} value={formData[field.name] || ""} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
        ))}
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Estado <span className="text-red-500">*</span></label>
                <select name="estado" value={formData.estado || ""} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="">Selecione o estado</option>
                    {estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Cidade <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                    <select name="cidade" value={formData.cidade || ""} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                        <option value="">Selecione a cidade</option>
                        {cities.filter(c => c.estado === formData.estado).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setIsAddingCity(!isAddingCity)} className="mt-1 bg-green-600 text-white px-3 py-2 rounded">+</button>
                </div>
                {isAddingCity && (
                    <div className="mt-2 p-2 border rounded bg-gray-50">
                        <input placeholder="Nome da cidade" className="block w-full border mb-1 p-1" onChange={(e) => setNewCity({...newCity, name: e.target.value})} value={newCity.name} />
                        <select className="block w-full border mb-1 p-1" onChange={(e) => setNewCity({...newCity, estado: e.target.value})} value={newCity.estado}>
                            <option value="">Selecione o estado</option>
                            {estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                        </select>
                        <button type="button" onClick={handleAddCity} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">Adicionar</button>
                    </div>
                )}
            </div>
        </div>

        {["logo", "banner"].map((field) => (
            <div key={field}>
                <label className="block text-sm font-medium text-gray-700">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                {formData[field] && <img src={formData[field]} className="h-20 mb-2" />}
                <input type="file" onChange={(e) => handleImageUpload(e, field)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
        ))}

        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Horários</label>
            {diasSemana.map(dia => (
                <div key={dia.id} className="grid grid-cols-3 gap-2 mt-1 items-center">
                    <span>{dia.label}</span>
                    <input type="time" value={formData.horario?.[dia.id]?.open || ""} onChange={(e) => handleHorarioChange(dia.id, 'open', e.target.value)} className="border p-1" />
                    <input type="time" value={formData.horario?.[dia.id]?.close || ""} onChange={(e) => handleHorarioChange(dia.id, 'close', e.target.value)} className="border p-1" />
                </div>
            ))}
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <input type="number" name="tempoPreparoMin" placeholder="Tempo Mín" value={formData.tempoPreparoMin || ""} onChange={handleChange} className="border p-2" />
            <input type="number" name="tempoPreparoMax" placeholder="Tempo Máx" value={formData.tempoPreparoMax || ""} onChange={handleChange} className="border p-2" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Comissão da Plataforma (%)</label>
          <p className="text-xs text-gray-500 mb-1">Percentual de comissão sobre cada pedido. Mín: 0, Máx: 100.</p>
          <input
            type="number"
            name="platform_commission_percent"
            value={formData.platform_commission_percent ?? 6.00}
            onChange={(e) => setFormData({ ...formData, platform_commission_percent: parseFloat(e.target.value) || 0 })}
            min="0"
            max="100"
            step="0.5"
            className="border p-2 w-32"
          />
        </div>

        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Áreas de Atuação <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {areas.map((area) => (
                    <label key={area} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={(formData.areasAtuacao || []).includes(area)}
                            onChange={() => toggleArea(area)}
                            className="rounded border-gray-300"
                        />
                        <span>{area}</span>
                    </label>
                ))}
            </div>
        </div>

        <StoreUsersSection users={users} onChange={setUsers} companyId={storeId} />
        <div className="md:col-span-2 flex gap-4 mt-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex-1">
            Salvar Alterações
          </button>
          <button type="button" onClick={() => router.push('/owner/stores')} className="bg-gray-400 text-white px-4 py-2 rounded">
            Sair
          </button>
        </div>
      </form>
    </div>
  );
}
