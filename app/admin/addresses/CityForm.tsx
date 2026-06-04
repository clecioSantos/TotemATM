import React, { useState, useEffect } from "react";

interface CityFormProps {
  initialData?: any | null;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

export default function CityForm({ initialData, onSubmit, onClose }: CityFormProps) {
  const [cityName, setCityName] = useState(initialData?.name || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCityName(initialData?.name || "");
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) return;
    setSubmitting(true);
    await onSubmit(cityName);
    setSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="input-group">
        <label style={{ fontSize: '11px', fontWeight: '900', color: '#a1a1aa', marginBottom: '8px', display: 'block' }}>NOME DA CIDADE</label>
        <input type="text" className="form-input" value={cityName} onChange={e => setCityName(e.target.value)} placeholder="Ex: São Paulo" required autoFocus style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f4f4f5', outline: 'none' }} />
      </div>
      <button type="submit" className="primary-button" disabled={submitting} style={{ width: '100%', padding: '14px' }}>
        {submitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Cadastrar Cidade")}
      </button>
    </form>
  );
}
