"use client";

import { useState } from "react";
import { Product, Category, ProductSize } from '@totem/shared/types';
import "./styles.css";

interface Props {
  initialData?: Product | null;
  categories: Category[];
  onSubmit: (data: Partial<Product>, file?: File) => Promise<void>;
}

export default function ProductForm({ initialData, categories, onSubmit }: Props) {
  const [name, setName] = useState(initialData?.name || "");
  const [price, setPrice] = useState(initialData?.price || 0);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [sizes, setSizes] = useState<ProductSize[]>(initialData?.sizes || []);

  const selectedCategory = categories.find(c => c.id === categoryId);
  const possuiTamanhos = selectedCategory?.possuiTamanhos === true;

  const addSize = () => {
    setSizes(prev => [...prev, { nome: "", preco: 0, quantidadeSabores: 0 }]);
  };

  const removeSize = (index: number) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: keyof ProductSize, value: string | number) => {
    setSizes(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData: Partial<Product> = {
      name,
      price: Number(price),
      categoryId,
      description,
      active,
      featured,
      imageUrl: initialData?.imageUrl,
      sizes: possuiTamanhos ? sizes.filter(s => s.nome.trim()) : undefined,
    };

    if (initialData?.id) {
      productData.id = initialData.id;
    }

    await onSubmit(productData, imageFile);
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Nome do Produto</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      
      <div className="input-group">
        <label>Preço Base</label>
        <input className="form-input" type="number" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} required />
      </div>

      <div className="input-group">
        <label>Categoria</label>
        <select className="form-input" value={categoryId} onChange={e => { setCategoryId(e.target.value); setSizes([]); }} required>
          <option value="">Selecione...</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="input-group">
        <label>Descrição</label>
        <textarea className="form-input form-textarea" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {possuiTamanhos && (
        <div className="sizes-section">
          <div className="sizes-header">
            <label>Tamanhos</label>
            <button type="button" onClick={addSize} className="add-size-btn">+ Adicionar Tamanho</button>
          </div>
          {sizes.length === 0 && (
            <p className="sizes-empty">Nenhum tamanho cadastrado. Adicione os tamanhos disponíveis (ex: Pequena, Média, Grande).</p>
          )}
          {sizes.map((size, index) => (
            <div key={index} className="size-entry">
              <div className="size-entry-fields">
                <div className="size-field">
                  <label className="size-field-label">Nome</label>
                  <input
                    className="form-input"
                    placeholder="Ex: Pequena"
                    value={size.nome}
                    onChange={e => updateSize(index, 'nome', e.target.value)}
                  />
                </div>
                <div className="size-field">
                  <label className="size-field-label">Preço (R$)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={size.preco}
                    onChange={e => updateSize(index, 'preco', Number(e.target.value))}
                  />
                </div>
                <div className="size-field">
                  <label className="size-field-label">Sabores</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={size.quantidadeSabores}
                    onChange={e => updateSize(index, 'quantidadeSabores', Number(e.target.value))}
                    title="Quantos sabores o cliente pode escolher neste tamanho"
                  />
                </div>
              </div>
              <button type="button" className="remove-size-btn" onClick={() => removeSize(index)} title="Remover tamanho">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="input-group">
        <label>Imagem do Produto</label>
        {initialData?.imageUrl && !imageFile && (
          <div className="current-image-preview">
            <img src={initialData.imageUrl} alt="Atual" />
            <span>Imagem atual preservada</span>
          </div>
        )}
        <input 
          type="file" 
          className="form-input" 
          accept="image/*" 
          onChange={e => setImageFile(e.target.files?.[0])} 
        />
      </div>

      <div className="input-group checkbox-group">
        <input type="checkbox" id="product-active" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <label htmlFor="product-active">Produto Ativo</label>
      </div>
      <div className="input-group checkbox-group">
        <input type="checkbox" id="product-featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        <label htmlFor="product-featured">Produto em Destaque</label>
      </div>
      <button type="submit" className="form-submit">Salvar Produto</button>
    </form>
  );
}
