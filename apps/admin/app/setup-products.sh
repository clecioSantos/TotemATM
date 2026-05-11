#!/bin/bash

# NexOrder - Product Management Structure Setup
# Autor: Gemini Code Assist (Senior Specialist)

BASE_PATH="apps/admin/app/products"

echo "🚀 Iniciando a criação da estrutura de Produtos em $BASE_PATH..."

# 1. Criar estrutura de diretórios
mkdir -p $BASE_PATH/components/ProductTable
mkdir -p $BASE_PATH/components/ProductModal
mkdir -p $BASE_PATH/components/ProductForm
mkdir -p $BASE_PATH/components/ProductFilters
mkdir -p $BASE_PATH/components/CategorySelect
mkdir -p $BASE_PATH/hooks
mkdir -p $BASE_PATH/services
mkdir -p $BASE_PATH/types
mkdir -p $BASE_PATH/utils

echo "📁 Pastas criadas com sucesso."

# 2. Criar Tipagens
cat <<EOF > $BASE_PATH/types/index.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  active: boolean;
  featured: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
}
EOF

# 3. Criar Firebase Service
cat <<EOF > $BASE_PATH/services/firebaseService.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
EOF

# 4. Criar Hooks (Lógica Real-time)
cat <<EOF > $BASE_PATH/hooks/useProducts.ts
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product } from '../types';
import { firestore, storage } from '../services/firebaseService';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
      })) as Product[]);
      setLoading(false);
    });
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, \`products/\${Date.now()}_\${file.name}\`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  const saveProduct = async (data: Partial<Product>, file?: File) => {
    let imageUrl = data.imageUrl || '';
    if (file) imageUrl = await uploadImage(file);

    if (data.id) {
      const productRef = doc(firestore, 'products', data.id);
      await updateDoc(productRef, { ...data, imageUrl });
    } else {
      await addDoc(collection(firestore, 'products'), {
        ...data,
        imageUrl,
        active: data.active ?? true,
        featured: data.featured ?? false,
        createdAt: Timestamp.now(),
      });
    }
  };

  const removeProduct = async (id: string) => {
    await deleteDoc(doc(firestore, 'products', id));
  };

  return { products, loading, saveProduct, removeProduct };
};
EOF

cat <<EOF > $BASE_PATH/hooks/useCategories.ts
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Category } from '../types';
import { firestore } from '../services/firebaseService';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, 'categories'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Category[]);
      setLoading(false);
    });
  }, []);

  return { categories, loading };
};
EOF

# 5. Criar Componentes UI

# ProductTable
cat <<EOF > $BASE_PATH/components/ProductTable/styles.css
.product-table-wrapper {
  background: white;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  overflow: hidden;
  border: 1px solid #f1f1f1;
}

.p-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.p-table th {
  padding: 20px 24px;
  background: #fafafa;
  color: #71717a;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  border-bottom: 1px solid #f1f1f1;
}

.p-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #f1f1f1;
  color: #18181b;
  font-size: 16px;
}

.p-table tr:hover {
  background: #fcfcfc;
}

.product-img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  background: #eee;
}

.badge {
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 700;
}

.badge-active { background: #dcfce7; color: #166534; }
.badge-inactive { background: #fee2e2; color: #991b1b; }

.actions-cell {
  display: flex;
  gap: 12px;
}

.btn-action {
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: opacity 0.2s;
}

.btn-edit { color: #09090b; }
.btn-delete { color: #ef4444; }
EOF

cat <<EOF > $BASE_PATH/components/ProductTable/index.tsx
"use client";

import { Product, Category } from "../../types";
import "./styles.css";

interface Props {
  products: Product[];
  categories: Category[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, categories, onEdit, onDelete }: Props) {
  return (
    <div className="product-table-wrapper">
      <table className="p-table">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <img src={product.imageUrl} className="product-img" alt={product.name} />
              </td>
              <td>
                <strong>{product.name}</strong>
              </td>
              <td>
                {categories.find(c => c.id === product.categoryId)?.name || 'Sem categoria'}
              </td>
              <td>R$ {product.price.toFixed(2)}</td>
              <td>
                <span className={\`badge \${product.active ? 'badge-active' : 'badge-inactive'}\`}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="actions-cell">
                <button className="btn-action btn-edit" onClick={() => onEdit(product)}>Editar</button>
                <button className="btn-action btn-delete" onClick={() => onDelete(product.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF

# ProductForm
cat <<EOF > $BASE_PATH/components/ProductForm/styles.css
.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 14px;
  font-weight: 600;
  color: #71717a;
}

.form-input {
  height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid #e4e4e7;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #09090b;
}

.form-textarea {
  min-height: 100px;
  padding: 12px 16px;
  resize: vertical;
}

.form-submit {
  height: 52px;
  background: #09090b;
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
}
EOF

cat <<EOF > $BASE_PATH/components/ProductForm/index.tsx
"use client";

import { useState } from "react";
import { Product, Category } from "../../types";
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
  const [imageFile, setImageFile] = useState<File | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      id: initialData?.id,
      name,
      price: Number(price),
      categoryId,
      description,
      imageUrl: initialData?.imageUrl
    }, imageFile);
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
        <label>Imagem</label>
        <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0])} />
      </div>

      <button type="submit" className="form-submit">Salvar Alterações</button>
    </form>
  );
}
EOF

# ProductModal
cat <<EOF > $BASE_PATH/components/ProductModal/index.tsx
"use client";

import "./styles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function ProductModal({ isOpen, onClose, title, children }: Props) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </header>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
EOF

cat <<EOF > $BASE_PATH/components/ProductModal/styles.css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h3 { font-size: 24px; margin: 0; }

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #a1a1aa;
}
EOF

# 6. Criar Página Principal (page.tsx e page.css)
# O conteúdo de page.tsx e page.css já foi enviado nas respostas anteriores.
# Vou apenas garantir que os imports estejam corretos para este script.

cat <<EOF > $BASE_PATH/page.tsx
"use client";

import { useState } from "react";
import { useProducts } from "./hooks/useProducts";
import { useCategories } from "./hooks/useCategories";
import ProductTable from "./components/ProductTable";
import ProductModal from "./components/ProductModal";
import ProductForm from "./components/ProductForm";
import "./page.css";

export default function ProductsPage() {
  const { products, loading: pLoading, saveProduct, removeProduct } = useProducts();
  const { categories, loading: cLoading } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  return (
    <main className="products-container">
      <header className="products-header">
        <div className="products-title-area">
          <h1>Produtos</h1>
          <p>Gerencie o cardápio do seu estabelecimento</p>
        </div>

        <button className="add-product-btn" onClick={() => setIsModalOpen(true)}>
          + Novo Produto
        </button>
      </header>

      <section className="products-content">
        {pLoading || cLoading ? (
          <p>Carregando dados...</p>
        ) : (
          <ProductTable 
            products={products} 
            categories={categories}
            onDelete={removeProduct}
            onEdit={handleEdit} 
          />
        )}
      </section>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={handleClose}
        title={editingProduct ? "Editar Produto" : "Novo Produto"}
      >
        <ProductForm 
          categories={categories} 
          initialData={editingProduct}
          onSubmit={async (data, file) => {
            await saveProduct(data, file);
            handleClose();
          }}
        />
      </ProductModal>
    </main>
  );
}
EOF

echo "✅ Estrutura NexOrder de Produtos criada com sucesso!"
echo "💡 Lembre-se de rodar 'chmod +x setup-products.sh' e depois './setup-products.sh' no terminal."