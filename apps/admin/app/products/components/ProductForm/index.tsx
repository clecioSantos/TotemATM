"use client";

import { useState } from "react";
import { Product, Category } from "../../../../../../index"; // Assuming this path is correct
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData: Partial<Product> = {
      name,
      price: Number(price),
      categoryId,
      description,
      active,
      featured,
      imageUrl: initialData?.imageUrl, // Garante que a URL atual seja mantida na edição
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
        <label>Preço</label>
        <input className="form-input" type="number" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} required />
      </div>

      <div className="input-group">
        <label>Categoria</label>
        <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
          <option value="">Selecione...</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="input-group">
        <label>Descrição</label>
        <textarea className="form-input form-textarea" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

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
        <input
          type="checkbox"
          id="product-active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
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