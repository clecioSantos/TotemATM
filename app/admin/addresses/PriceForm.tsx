import React, { useState } from "react";

interface PriceFormProps {
  initialPrice?: number;
  onSubmit: (price: number) => Promise<void>;
  onClose: () => void;
}

export default function PriceForm({ initialPrice, onSubmit, onClose }: PriceFormProps) {
  const [price, setPrice] = useState(initialPrice || 0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(Number(price));
    setSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a', padding: '12px', borderRadius: '12px', fontSize: '12px', lineHeight: '1.5' }}>
        💡 <strong>Dica:</strong> Defina o preço como <strong>0.00</strong> para oferecer entrega grátis. 
        Caso não defina um valor para o bairro, o sistema assumirá que a loja <strong>não realiza entregas</strong> nesta região.
      </div>
      <div className="input-group">
        <label style={{ fontSize: '11px', fontWeight: '900', color: '#a1a1aa', marginBottom: '8px', display: 'block' }}>
          VALOR DA ENTREGA (R$)
        </label>
        <input 
          type="number" 
          step="0.01" 
          className="form-input" 
          value={price} 
          onChange={e => setPrice(Number(e.target.value))} 
          placeholder="0.00" 
          required 
          autoFocus 
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f4f4f5', outline: 'none' }} 
        />
      </div>
      <button type="submit" className="primary-button" disabled={submitting} style={{ width: '100%', padding: '14px' }}>
        {submitting ? "Salvando..." : "Salvar Preço"}
      </button>
    </form>
  );
}