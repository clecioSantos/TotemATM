"use client";

import { useState } from "react";
import { useProducts } from "./hooks/useProducts";
import { useCategories } from "./hooks/useCategories";
import ProductTable from "./components/ProductTable";
import Modal from "../components/Modal";
import ProductForm from "./components/ProductForm"; // Keep this import
import { Product } from '@totem/shared/types';
import "./page.css";

export default function ProductsPage() {
  const { products, loading: productsLoading, error: productsError, saveProduct, removeProduct } = useProducts();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Gerencie o cardápio e a disponibilidade dos seus itens</p>
        </div>

        <button className="primary-button" onClick={() => {
          setEditingProduct(null);
          setIsModalOpen(true);
        }}>
          <span>➕</span> Novo Produto
        </button>
      </header>

      <main className="page-content">
        {productsLoading || categoriesLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando cardápio...</p>
          </div>
        ) : productsError || categoriesError ? (
          <div className="empty-state">
            <p>Ocorreu um erro ao carregar os dados.</p>
          </div>
        ) : (
          <ProductTable 
            products={products} 
            categories={categories}
            onDelete={removeProduct}
            onEdit={handleEdit} 
          />
        )}
      </main>

      <Modal 
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
      </Modal>
    </div>
  );
}
