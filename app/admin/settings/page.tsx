"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import { Copy, Check, QrCode, ExternalLink, LogOut, Store, Save, Loader2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { firestore, auth } from "@/src/services/firebase";
import { doc, getDoc, updateDoc, collection, onSnapshot, FirestoreError } from "firebase/firestore";
import { logger } from "@/src/lib/logger";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { PermissionGate } from "@/src/components/PermissionGate";
import HelpTooltip from "../components/HelpTooltip";
import HelpModal from "../components/HelpModal";
import { useConfirm } from "@/app/components/ConfirmProvider";
import "../page.css";
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

function ConfigurationsContent() {
  const { signOut, user } = useAuth();
  const { showAlert } = useConfirm();
  const [copied, setCopied] = useState(false);
  const [totemUrl, setTotemUrl] = useState("");

  const [companyData, setCompanyData] = useState<any>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [saving, setSaving] = useState(false);
  const [helpModal, setHelpModal] = useState<string | null>(null);


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
        logger.error("SETTINGS_PAGE", "Erro ao carregar dados da empresa", error);
      } finally {
        setLoadingCompany(false);
      }
    };
    fetchCompany();
  }, [user?.companyId]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "cities"), (snap) => {
      try {
        setCities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
      } catch (error) {
        logger.error("SETTINGS_PAGE", "Erro ao processar cidades", error);
      }
    }, (error) => {
      logger.error("SETTINGS_PAGE", "Erro no listener de cidades", error);
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
      await showAlert("Erro ao fazer upload da imagem. Verifique o servidor.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "companies", user.companyId), companyData);

      const token = await auth.currentUser?.getIdToken();
      if (token) {
        fetch("/api/notify/store", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            companyId: user.companyId,
            title: "🔧 Loja Atualizada",
            body: "As configurações da loja foram alteradas.",
            data: { type: "store_update" },
          }),
        }).catch(() => {});
      }

      await showAlert("Dados da empresa atualizados!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      await showAlert("Erro ao salvar os dados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie as preferências da sua conta e do sistema</p>
        </div>
      </header>
        <div className="settings-card">
          <div className="totem-link-section">
            <header className="section-header">
              <QrCode size={20} className="section-icon" />
              <h3 className="section-title">
                Link do Totem
                <HelpTooltip helpId="totem" />
              </h3>
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
                <button
                  className="help-saiba-mais"
                  onClick={() => setHelpModal("totem")}
                  aria-label="Saiba mais sobre o Totem"
                >
                  <ExternalLink size={12} />
                  <span>Saiba mais</span>
                </button>
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
            <PermissionGate permission="editSettings">
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

                <div className="store-preview">
                  {/* Banner */}
                  <div
                    className="store-preview-banner"
                    style={{
                      backgroundImage: companyData.banner
                        ? `url(${companyData.banner})`
                        : undefined,
                    }}
                  >
                    {!companyData.banner && (
                      <div className="store-preview-banner-fallback" />
                    )}
                    <div className="store-preview-overlay" />

                    {/* Logo */}
                    {companyData.logo && (
                      <div className="store-preview-logo-wrapper">
                        <img
                          src={companyData.logo}
                          alt="Logo"
                          className="store-preview-logo"
                        />
                      </div>
                    )}

                    {/* Store info */}
                    <div className="store-preview-info">
                      <h3 className="store-preview-name">
                        {companyData.name || "Nome da Loja"}
                      </h3>
                      <div className="store-preview-meta">
                        <span>★ --</span>
                        <span>🕒 -- min</span>
                        <span>🚚 Entrega rápida</span>
                      </div>
                    </div>
                  </div>

                  {/* Upload buttons */}
                  <div className="store-preview-uploads">
                    <label className="store-preview-upload-btn">
                      {companyData.logo && (
                        <img src={companyData.logo} alt="" className="store-preview-upload-thumb" />
                      )}
                      <span>{companyData.logo ? "Alterar Logo" : "Adicionar Logo"}</span>
                      <input
                        type="file"
                        onChange={(e) => handleImageUpload(e, "logo")}
                        hidden
                      />
                    </label>
                    <label className="store-preview-upload-btn">
                      {companyData.banner && (
                        <img src={companyData.banner} alt="" className="store-preview-upload-thumb" />
                      )}
                      <span>{companyData.banner ? "Alterar Banner" : "Adicionar Banner"}</span>
                      <input
                        type="file"
                        onChange={(e) => handleImageUpload(e, "banner")}
                        hidden
                      />
                    </label>
                  </div>
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
                <h4 className="form-section-title">Agendamento de Pedidos</h4>
                <div className="toggle-switch-row">
                  <div className="toggle-switch-description">
                    <span className="toggle-switch-title">Aceitar Pedidos Agendados</span>
                    <span className="toggle-switch-note">
                      {companyData.schedulingEnabled ? 'Agendamento ativado' : 'Agendamento desativado'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompanyData((prev: any) => ({ ...prev, schedulingEnabled: !prev.schedulingEnabled }))}
                    className={`toggle-switch-button ${companyData.schedulingEnabled ? 'active' : ''}`}
                    aria-pressed={companyData.schedulingEnabled}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
                {companyData.schedulingEnabled && (
                  <div className="mt-4 space-y-4">
                    <div className="form-group">
                      <label className="form-label">Intervalo dos horários</label>
                      <select
                        value={companyData.schedulingSlotMinutes || 30}
                        onChange={(e) => setCompanyData((prev: any) => ({ ...prev, schedulingSlotMinutes: Number(e.target.value) }))}
                        className="form-input"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={60}>60 minutos</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Antecedência máxima (dias)</label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={companyData.schedulingMaxDays || 30}
                        onChange={(e) => setCompanyData((prev: any) => ({ ...prev, schedulingMaxDays: Number(e.target.value) }))}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}
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

                  <div className="company-form-section">
                    <h4 className="form-section-title">Valor Mínimo do Pedido</h4>
                    <div className="prep-time-grid">
                      <div className="form-group">
                        <label className="form-label">Valor mínimo (R$)</label>
                        <input
                          type="number"
                          name="minOrderValue"
                          value={companyData.minOrderValue ?? 0}
                          onChange={(e) => setCompanyData((prev: any) => ({ ...prev, minOrderValue: parseFloat(e.target.value) || 0 }))}
                          min="0"
                          step="0.5"
                          className="form-input"
                        />
                        <p className="text-xs text-brand-muted mt-1">Pedidos com valor abaixo disso não serão aceitos. 0 = sem mínimo.</p>
                      </div>
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
            </PermissionGate>
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
        <HelpModal helpId={helpModal || ""} open={!!helpModal} onClose={() => setHelpModal(null)} />
      </div>
    </div>
  );
}

export default function ConfigurationsPage() {
  return (
    <ErrorBoundary context="ConfigurationsPage">
      <ConfigurationsContent />
    </ErrorBoundary>
  );
}
