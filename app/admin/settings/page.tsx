"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { Copy, Check, QrCode, ExternalLink, LogOut, Store, Save, Loader2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { firestore } from "@/src/services/firebase";
import { doc, getDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import "./page.css";

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

export default function ConfigurationsPage() {
  const { signOut, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [totemUrl, setTotemUrl] = useState("");

  const [companyData, setCompanyData] = useState<any>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    if (user?.companyId && typeof window !== 'undefined') {
      const url = `${window.location.origin}/totem/${user.companyId}`;
      setTotemUrl(url);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.companyId) return;
    const fetchCompany = async () => {
      try {
        const docRef = doc(firestore, "companies", user.companyId!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            if (data.cep) data.cep = maskCEP(data.cep);
            if (data.telefone) data.telefone = maskTelefone(data.telefone);
            if (data.whatsapp) data.whatsapp = maskTelefone(data.whatsapp);
            if (data.cnpj) data.cnpj = maskCNPJ(data.cnpj);
          }
          setCompanyData(data);
        }
      } catch (error) {
        console.error("🔥 Erro ao buscar empresa:", error);
      } finally {
        setLoadingCompany(false);
      }
    };
    fetchCompany();
  }, [user?.companyId]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "cities"), (snap) => {
      setCities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("🔥 Erro ao carregar cidades:", error);
    });
    return () => unsub();
  }, []);

  const handleCopy = () => {
    if (!totemUrl) return;
    navigator.clipboard.writeText(totemUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    setCompanyData({ ...companyData, [name]: value });
  };

  const handleHorarioChange = (dia: string, field: 'open' | 'close', value: string) => {
    setCompanyData((prev: any) => ({
      ...prev,
      horario: {
        ...prev.horario,
        [dia]: { ...prev.horario?.[dia] || { open: "", close: "" }, [field]: value },
      },
    }));
  };

  const toggleArea = (area: string) => {
    const current = companyData.areasAtuacao || [];
    const updated = current.includes(area)
      ? current.filter((a: string) => a !== area)
      : [...current, area];
    setCompanyData({ ...companyData, areasAtuacao: updated });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      if (companyData?.[field]) {
        uploadData.append("oldImageUrl", companyData[field]);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setCompanyData((prev: any) => ({ ...prev, [field]: result.imageUrl }));
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Verifique o servidor.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "companies", user.companyId), companyData);
      alert("Dados da empresa atualizados!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar os dados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="configurations-view">
      <header className="header">
        <div className="page-title-area">
          <h2 className="page-title">Configurações</h2>
          <p className="page-subtitle">Gerencie as preferências da sua conta e do sistema</p>
        </div>
      </header>

      <div className="settings-container">
        <div className="settings-card">
          <div className="totem-link-section">
            <header className="section-header">
              <QrCode size={20} className="section-icon" />
              <h3 className="section-title">Link do Totem</h3>
            </header>

            <div className="section-content">
              <p className="user-detail">Compartilhe este link com seus clientes ou abra em seus tablets:</p>

              <div className="link-copy-wrapper">
                <input
                  type="text"
                  readOnly
                  value={totemUrl}
                  className="totem-url-input"
                />
                <div className="link-actions">
                  <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copied ? "Copiado!" : "Copiar"}</span>
                  </button>
                  <a
                    href={totemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="totem-open-btn"
                  >
                    <ExternalLink size={18} />
                    <span>TOTEM</span>
                  </a>
                </div>
              </div>

              <div className="qr-code-area">
                <div className="qr-container">
                  {totemUrl ? (
                    <QRCodeCanvas
                      value={totemUrl}
                      size={160}
                      style={{ border: '8px solid #fff', borderRadius: '12px', width: '100%', height: 'auto', maxWidth: '160px' }}
                    />
                  ) : <p>Gerando QR Code...</p>}
                </div>
                <p className="qr-hint">Aponte a câmera para testar</p>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card settings-card--wide">
          <header className="section-header">
            <Store size={20} className="section-icon" />
            <h3 className="section-title">Dados da Empresa</h3>
          </header>

          {loadingCompany ? (
            <div className="loading-container">
              <Loader2 size={24} className="spin" />
              <p>Carregando dados da empresa...</p>
            </div>
          ) : !companyData ? (
            <p className="user-detail">Nenhum dado de empresa encontrado para o seu perfil.</p>
          ) : (
            <form onSubmit={handleSubmit} className="company-form">
              <div className="company-form-grid">
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
                  <div key={field.name} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <input
                      name={field.name}
                      value={companyData[field.name] || ""}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                ))}

                <div className="form-group">
                  <label className="form-label">Estado <span className="text-red-500">*</span></label>
                  <select name="estado" value={companyData.estado || ""} onChange={handleChange} className="form-input">
                    <option value="">Selecione o estado</option>
                    {estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cidade <span className="text-red-500">*</span></label>
                  <select name="cidade" value={companyData.cidade || ""} onChange={handleChange} className="form-input">
                    <option value="">Selecione a cidade</option>
                    {cities.filter(c => c.estado === companyData.estado).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="company-form-section">
                <h4 className="form-section-title">Logo e Banner</h4>
                <div className="company-form-grid company-form-grid--images">
                  {["logo", "banner"].map((field) => (
                    <div key={field} className="form-group">
                      <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                      {companyData[field] && (
                        <img src={companyData[field]} alt={field} className="image-preview" />
                      )}
                      <input type="file" onChange={(e) => handleImageUpload(e, field)} className="form-input" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="company-form-section">
                <h4 className="form-section-title">Horários de Funcionamento</h4>
                <div className="schedule-grid">
                  {diasSemana.map(dia => (
                    <div key={dia.id} className="schedule-row">
                      <span className="schedule-day-label">{dia.label}</span>
                      <input
                        type="time"
                        value={companyData.horario?.[dia.id]?.open || ""}
                        onChange={(e) => handleHorarioChange(dia.id, 'open', e.target.value)}
                        className="form-input schedule-input"
                      />
                      <input
                        type="time"
                        value={companyData.horario?.[dia.id]?.close || ""}
                        onChange={(e) => handleHorarioChange(dia.id, 'close', e.target.value)}
                        className="form-input schedule-input"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="company-form-section">
                <h4 className="form-section-title">Tempo de Preparo (minutos)</h4>
                <div className="prep-time-grid">
                  <div className="form-group">
                    <label className="form-label">Tempo Mínimo</label>
                    <input
                      type="number"
                      name="tempoPreparoMin"
                      value={companyData.tempoPreparoMin || ""}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tempo Máximo</label>
                    <input
                      type="number"
                      name="tempoPreparoMax"
                      value={companyData.tempoPreparoMax || ""}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="company-form-section">
                <h4 className="form-section-title">Áreas de Atuação <span className="text-red-500">*</span></h4>
                <div className="areas-grid">
                  {areas.map((area) => (
                    <label key={area} className="area-checkbox">
                      <input
                        type="checkbox"
                        checked={(companyData.areasAtuacao || []).includes(area)}
                        onChange={() => toggleArea(area)}
                        className="area-checkbox-input"
                      />
                      <span>{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button" disabled={saving}>
                  {saving ? (
                    <><Loader2 size={18} className="spin" /> Salvando...</>
                  ) : (
                    <><Save size={18} /> Salvar Alterações</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="settings-card">
          <div className="user-profile-info">
            <h3 className="section-title">Minha Conta</h3>
            <p className="user-detail">Nome: <strong>{user?.name || "Administrador"}</strong></p>
            <p className="user-detail">E-mail: <strong>{user?.email}</strong></p>
          </div>

          <div className="settings-footer">
            <button className="logout-button" onClick={signOut}>
              <LogOut size={18} /> Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
