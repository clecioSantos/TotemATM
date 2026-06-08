"use client";

import { useState } from "react";
import { PromotionEvent } from "@totem/shared/types";
import { Timestamp } from "firebase/firestore";
import "./styles.css";

interface Props {
  initialData?: PromotionEvent | null;
  onSubmit: (data: any) => Promise<void>;
}

const nowISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function EventForm({ initialData, onSubmit }: Props) {
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerUrl || "");
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder ?? 0);
  const [status, setStatus] = useState<string>(initialData?.status || "draft");
  const [bannerFile, setBannerFile] = useState<File | undefined>();
  const [uploading, setUploading] = useState(false);

  const toDate = (ts: any): Date => {
    if (!ts) return new Date();
    if (ts.toDate) return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  const [startAt, setStartAt] = useState(
    initialData?.startAt ? toDate(initialData.startAt).toISOString().slice(0, 16) : nowISO()
  );
  const [endAt, setEndAt] = useState(
    initialData?.endAt ? toDate(initialData.endAt).toISOString().slice(0, 16) : nowISO()
  );
  const [submitting, setSubmitting] = useState(false);

  const formatSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleNameChange = (value: string) => {
    setName(value);
    if (!initialData) {
      setSlug(formatSlug(value));
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      if (bannerUrl) formData.append("oldImageUrl", bannerUrl);

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Falha no upload");

      setBannerUrl(result.imageUrl);
    } catch (error) {
      console.error("Erro ao fazer upload do banner:", error);
      alert("Erro ao fazer upload da imagem. Verifique o servidor.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const data: any = {
      name,
      slug,
      description,
      bannerUrl,
      displayOrder: Number(displayOrder),
      status,
      startAt: Timestamp.fromDate(new Date(startAt)),
      endAt: Timestamp.fromDate(new Date(endAt)),
    };

    if (initialData?.id) {
      data.id = initialData.id;
      if (initialData.permanent) {
        delete data.status;
        delete data.slug;
      }
    }

    await onSubmit(data);
    setSubmitting(false);
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Nome do Evento</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          disabled={initialData?.permanent}
        />
      </div>

      <div className="input-group">
        <label>Slug</label>
        <input
          className="form-input"
          value={slug}
          onChange={(e) => setSlug(formatSlug(e.target.value))}
          required
          disabled={initialData?.permanent}
          placeholder="ex: promocao-verao"
        />
      </div>

      <div className="input-group">
        <label>Descrição</label>
        <textarea
          className="form-input form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Banner do Evento</label>
        <div className="image-upload-container" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div className="image-upload-preview" style={{ width: 120, height: 80, borderRadius: 8, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
            {bannerUrl ? (
              <img src={bannerUrl} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#94a3b8" }}>
                🖼
              </div>
            )}
          </div>
          <div className="image-upload-controls" style={{ flex: 1 }}>
            <label className="image-upload-button" style={{ display: "inline-block", padding: "10px 20px", background: "#09090b", color: "#fff", borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
              {uploading ? "Enviando..." : bannerUrl ? "Alterar Banner" : "Selecionar Banner"}
              <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden-file-input" style={{ display: "none" }} />
            </label>
            <p className="upload-hint" style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Formatos aceitos: JPG, PNG.</p>
          </div>
        </div>
      </div>

      <div className="input-group">
        <label>Ordem de Exibição</label>
        <input
          className="form-input"
          type="number"
          min="0"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(Number(e.target.value))}
        />
      </div>

      <div className="input-group">
        <label>Status</label>
        <select
          className="form-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={initialData?.permanent}
        >
          <option value="draft">Rascunho</option>
          <option value="scheduled">Agendado</option>
          <option value="active">Ativo</option>
          <option value="finished">Encerrado</option>
        </select>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, display: "grid" }}>
        <div className="input-group">
          <label>Início</label>
          <input
            className="form-input"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Término</label>
          <input
            className="form-input"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            required
          />
        </div>
      </div>

      <button type="submit" className="form-submit" disabled={submitting || uploading}>
        {submitting ? "Salvando..." : initialData ? "Atualizar Evento" : "Criar Evento"}
      </button>
    </form>
  );
}
