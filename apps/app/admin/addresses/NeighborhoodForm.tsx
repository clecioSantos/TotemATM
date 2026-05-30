import React, { useState, useEffect } from "react";

interface Neighborhood {
  id?: string;
  name: string;
  deliveryPrice: number;
  enabled?: boolean;
}

interface NeighborhoodFormProps {
  initialData?: Neighborhood | null;
  selectedCityId: string;
  onSubmit: (name: string, cityId: string, deliveryPrice: number, enabled: boolean) => Promise<void>;
  onClose: () => void;
}

export default function NeighborhoodForm({ initialData, selectedCityId, onSubmit, onClose }: NeighborhoodFormProps) {
  const [neighborhoodName, setNeighborhoodName] = useState(initialData?.name || "");
  const [deliveryPrice, setDeliveryPrice] = useState(initialData?.deliveryPrice || 0);
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNeighborhoodName(initialData?.name || "");
    setDeliveryPrice(initialData?.deliveryPrice || 0);
    setEnabled(initialData?.enabled ?? true);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neighborhoodName.trim() || !selectedCityId) return;
    setSubmitting(true);
    await onSubmit(neighborhoodName, selectedCityId, Number(deliveryPrice), enabled);
    setSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="input-group">
        <label style={{ fontSize: '11px', fontWeight: '900', color: '#a1a1aa', marginBottom: '8px', display: 'block' }}>NOME DO BAIRRO</label>
        <input type="text" className="form-input" value={neighborhoodName} onChange={e => setNeighborhoodName(e.target.value)} placeholder="Ex: Centro" required autoFocus style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f4f4f5', outline: 'none' }} />
      </div>
      {!initialData && (
        <div className="input-group">
          <div style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a', padding: '12px', borderRadius: '12px', fontSize: '12px', lineHeight: '1.5', marginBottom: '12px' }}>
            💡 <strong>Nota:</strong> Valor <strong>0.00</strong> significa entrega grátis. 
            Sem valor definido, considera-se que a loja não atende o bairro.
          </div>
          <label style={{ fontSize: '11px', fontWeight: '900', color: '#a1a1aa', marginBottom: '8px', display: 'block' }}>VALOR DA ENTREGA (R$)</label>
          <input 
            type="number" 
            step="0.01" 
            className="form-input" 
            value={deliveryPrice} 
            onChange={e => {
              const val = Number(e.target.value);
              setDeliveryPrice(val);
              // Habilita automaticamente se o preço for maior que zero
              if (val > 0) setEnabled(true);
            }} 
            placeholder="0.00" 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f4f4f5', outline: 'none' }} 
          />
        </div>
      )}

      <div className="input-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={e => setEnabled(e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Habilitar entrega para este bairro</span>
        </label>
        <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>* Ao definir um custo de entrega, o bairro será habilitado automaticamente.</p>
      </div>

      <button type="submit" className="primary-button" disabled={submitting} style={{ width: '100%', padding: '14px' }}>
        {submitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Cadastrar Bairro")}
      </button>
    </form>
  );
}