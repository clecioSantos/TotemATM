"use client";

import { useState } from "react";
import { useCategoriesStore } from "./hooks/useCategories";
import { Category } from "@totem/shared/types";
import CategoryTable from "./components/CategoryTable";
import Modal from "../components/Modal";
import CategoryForm from "./components/CategoryForm";
import "./page.css";

export default function CategoriesPage() {
  const { categories, loading, saveCategory, removeCategory } = useCategoriesStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Categorias</h1>
          <p className="page-subtitle">Organize seus produtos por seções</p>
        </div>
        <button className="primary-button" onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
          <span>➕</span> Nova Categoria
        </button>
      </header>

      <main className="page-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma categoria cadastrada. Crie uma categoria para poder adicionar produtos ao cardápio.</p>
          </div>
        ) : (
          <CategoryTable 
            categories={categories} 
            onEdit={handleEdit} 
            onDelete={removeCategory} 
          />
        )}
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Editar Categoria" : "Nova Categoria"}
      >
        <CategoryForm 
          initialData={editingCategory}
          onSubmit={async (data) => {
            try {
              await saveCategory(data);
              setIsModalOpen(false);
            } catch (err) {
              console.error("LOG: [CategoriesPage] Falha ao executar saveCategory:", err);
              alert("Erro ao salvar categoria. Verifique o console.");
            }
          }}
        />
      </Modal>
    </div>
  );
}
