"use client";

import { useState } from "react";
import { CategoryFlavor, Category } from "@totem/shared/types";
import "../../../products/components/ProductForm/styles.css";

interface Props {
  initialData?: CategoryFlavor | null;
  categories: Category[];
  onSubmit: (data: Partial<CategoryFlavor>) => Promise<void>;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseCurrencyInput = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, '');
  return Number(digits) / 100;
};

export default function FlavorForm({ initialData, categories = [], onSubmit }: Props) {
  const [nome, setNome] = useState(initialData?.nome || "");
  const [preco, setPreco] = useState(initialData?.preco || 0);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [ordem, setOrdem] = useState(initialData?.ordem ?? 0);
  const [ativo, setAtivo] = useState(initialData?.ativo ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const data: Partial<CategoryFlavor> = {
      nome,
      preco: Number(preco),
      categoryId,
      ordem: Number(ordem),
      ativo,
    };
    if (initialData?.id) data.id = initialData.id;
    await onSubmit(data);
    setSubmitting(false);
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Nome do Sabor</label>
        <input className="form-input" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Calabresa" />
      </div>
      <div className="input-group">
        <label>Preço Extra (R$)</label>
        <input className="form-input" type="text" inputMode="numeric" value={formatCurrency(preco)} onChange={e => setPreco(parseCurrencyInput(e.target.value))} />
      </div>
      <div className="input-group">
        <label>Categoria</label>
        <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
          <option value="">Selecione...</option>
          {categories.filter(c => c.possuiSabores).map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label>Ordem de Exibição</label>
        <input className="form-input" type="number" min="0" value={ordem} onChange={e => setOrdem(Number(e.target.value))} />
      </div>

      <div className="checkbox-group">
        <input type="checkbox" id="flavor-ativo" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
        <label htmlFor="flavor-ativo">Sabor Ativo</label>
      </div>

      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? "Salvando..." : "Salvar Sabor"}
      </button>
    </form>
  );
}
