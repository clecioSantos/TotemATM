"use client";

import { useState } from "react";
import { Category } from '@totem/shared/types';
import { Condiment } from "../../hooks/useCondiments";
import "../CondimentTable/styles.css";

interface Props {
  initialData?: Condiment | null;
  categories: Category[];
  onSubmit: (data: Partial<Condiment>, file?: File) => Promise<void>;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseCurrencyInput = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, '');
  return Number(digits) / 100;
};

export default function CondimentForm({ initialData, categories = [], onSubmit }: Props) {
  const [name, setName] = useState(initialData?.name || "");
  const [price, setPrice] = useState(initialData?.price || 0);
  const [description, setDescription] = useState(initialData?.description || "");
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true);
  const [categoryIds, setCategoryIds] = useState<string[]>(initialData?.categoryIds || []);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const data: Partial<Condiment> = {
      name,
      price: Number(price),
      description,
      enabled,
      categoryIds,
    };
    if (initialData?.id) data.id = initialData.id;
    await onSubmit(data);
    setSubmitting(false);
  };

  const toggleCategory = (id: string) => {
    setCategoryIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Nome do Condimento</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Bacon Extra" />
      </div>
      
      <div className="input-group">
        <label>Preço Extra (R$)</label>
        <input className="form-input" type="text" inputMode="numeric" value={formatCurrency(price)} onChange={e => setPrice(parseCurrencyInput(e.target.value))} required />
      </div>

      <div className="input-group">
        <label>Descrição</label>
        <textarea className="form-input form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição do acompanhamento..." />
      </div>

      <div className="input-group">
        <label>Disponível nas Categorias:</label>
        <div className="category-selection-grid">
          {categories.length > 0 ? (
            categories.map(cat => (
              <div 
                key={cat.id} 
                className={`category-chip-selectable ${categoryIds.includes(cat.id) ? 'selected' : ''}`}
                onClick={() => toggleCategory(cat.id)}
              >
                {cat.name}
              </div>
            ))
          ) : (
            <p className="upload-hint">Nenhuma categoria encontrada no sistema.</p>
          )}
        </div>
      </div>

      <div className="checkbox-group">
        <input
          type="checkbox"
          id="condiment-enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <label htmlFor="condiment-enabled">Condimento Habilitado para Venda</label>
      </div>
      
      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? "Salvando..." : "Salvar Condimento"}
      </button>
    </form>
  );
}
