"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { useRouter } from "next/navigation";

export default function NewStorePage() {
  const router = useRouter();
  const [cities, setCities] = useState<any[]>([]);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCity, setNewCity] = useState({ name: "", estado: "" });

  const handleAddCity = async () => {
    if (!newCity.name || !newCity.estado) return;
    await addDoc(collection(firestore, "cities"), newCity);
    setNewCity({ name: "", estado: "" });
    setIsAddingCity(false);
  };
  const [formData, setFormData] = useState({
    name: "",
    razãoSocial: "",
    cnpj: "",
    telefone: "",
    whatsapp: "",
    email: "",
    logo: "",
    banner: "",
    endereco: "",
    cep: "",
    cidade: "",
    estado: "",
    bairro: "",
    numero: "",
    areasAtuacao: [] as string[],
    horario: {
      seg: { open: "", close: "" },
      ter: { open: "", close: "" },
      qua: { open: "", close: "" },
      qui: { open: "", close: "" },
      sex: { open: "", close: "" },
      sab: { open: "", close: "" },
      dom: { open: "", close: "" },
    },
    tempoPreparoMin: "",
    tempoPreparoMax: "",
  });

  const handleHorarioChange = (dia: string, field: 'open' | 'close', value: string) => {
    setFormData((prev) => ({
      ...prev,
      horario: {
        ...prev.horario,
        [dia]: { ...prev.horario[dia as keyof typeof prev.horario], [field]: value },
      },
    }));
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "cities"), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCities(data);
    });
    return () => unsub();
  }, []);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      if (formData[field as keyof typeof formData]) {
        uploadData.append("oldImageUrl", formData[field as keyof typeof formData] as string);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setFormData((prev) => ({ ...prev, [field]: result.imageUrl }));
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Verifique o servidor.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setFormData((prev) => {
      const areas = prev.areasAtuacao.includes(area)
        ? prev.areasAtuacao.filter((a) => a !== area)
        : [...prev.areasAtuacao, area];
      return { ...prev, areasAtuacao: areas };
    });
  };


  const areas = [
    "Lanches", "Pizzas", "Pratos", "Marmitas", "Porções", 
    "Bebidas", "Sobremesas", "Açaí", "Sushi", "Padaria e Confeitaria e mercado"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(firestore, "companies"), formData);
      alert("Loja criada com sucesso!");
      router.push("/owner/stores");
    } catch (error) {
      console.error("Erro ao salvar loja:", error);
      alert("Erro ao salvar loja.");
    }
  };

  const textFields = [
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
  ];

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Criar Nova Loja</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4">
        {textFields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700">{field.label} <span className="text-red-500">*</span></label>
            <input
              type="text"
              name={field.name}
              value={(formData as any)[field.name] || ""}
              required
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Estado <span className="text-red-500">*</span></label>
                <select
                    name="estado"
                    value={formData.estado}
                    required
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                >
                    <option value="">Selecione o estado</option>
                    {estadosBrasileiros.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Cidade <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                    <select
                        name="cidade"
                        value={formData.cidade}
                        required
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    >
                        <option value="">Selecione a cidade</option>
                        {cities
                            .filter(c => c.estado === formData.estado)
                            .map((city) => (
                            <option key={city.id} value={city.name}>{city.name}</option>
                        ))}
                    </select>
                    <button 
                        type="button" 
                        onClick={() => setIsAddingCity(!isAddingCity)}
                        className="mt-1 bg-green-600 text-white px-3 py-2 rounded"
                    >
                        +
                    </button>
                </div>
                {isAddingCity && (
                    <div className="mt-2 p-2 border rounded bg-gray-50">
                        <input 
                            placeholder="Nome da cidade" 
                            className="block w-full border mb-1 p-1" 
                            onChange={(e) => setNewCity({...newCity, name: e.target.value})} 
                            value={newCity.name}
                        />
                        <select 
                            className="block w-full border mb-1 p-1" 
                            onChange={(e) => setNewCity({...newCity, estado: e.target.value})}
                            value={newCity.estado}
                        >
                            <option value="">Selecione o estado</option>
                            {estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                        </select>
                        <button type="button" onClick={handleAddCity} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">Adicionar</button>
                    </div>
                )}
            </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Funcionamento <span className="text-red-500">*</span></label>
          <div className="space-y-2">
            {diasSemana.map((dia) => (
              <div key={dia.id} className="grid grid-cols-3 gap-4 items-center">
                <span className="font-medium text-sm">{dia.label}</span>
                <input
                  type="time"
                  value={formData.horario[dia.id as keyof typeof formData.horario].open}
                  onChange={(e) => handleHorarioChange(dia.id, 'open', e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                />
                <input
                  type="time"
                  value={formData.horario[dia.id as keyof typeof formData.horario].close}
                  onChange={(e) => handleHorarioChange(dia.id, 'close', e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
            ))}
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Tempo Preparo Mín (min) <span className="text-red-500">*</span></label>
                <input type="number" name="tempoPreparoMin" value={formData.tempoPreparoMin} required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tempo Preparo Máx (min) <span className="text-red-500">*</span></label>
                <input type="number" name="tempoPreparoMax" value={formData.tempoPreparoMax} required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
        </div>

        {["logo", "banner"].map((field) => (
            <div key={field}>
                <label className="block text-sm font-medium text-gray-700">{field.charAt(0).toUpperCase() + field.slice(1)} <span className="text-red-500">*</span></label>
                <input
                    type="file"
                    required
                    onChange={(e) => handleImageUpload(e, field)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
            </div>
        ))}
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Áreas de Atuação <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {areas.map((area) => (
                    <label key={area} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={formData.areasAtuacao.includes(area)}
                            onChange={() => toggleArea(area)}
                            className="rounded border-gray-300"
                        />
                        <span>{area}</span>
                    </label>
                ))}
            </div>
        </div>
        <div className="md:col-span-2 flex gap-4 mt-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex-1">
            Salvar Loja
          </button>
          <button type="button" onClick={() => router.push('/owner/stores')} className="bg-gray-400 text-white px-4 py-2 rounded">
            Sair
          </button>
        </div>
      </form>
    </div>
  );
}

