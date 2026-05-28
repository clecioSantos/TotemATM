"use client";

import { useState } from "react";
import { useCategoriesStore } from "./hooks/useCategories";
import { Category } from "@totem/shared/types";
import CategoryTable from "./components/CategoryTable";
import CategoryModal from "./components/CategoryModal";
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
    <main className="categories-container">
      <header className="categories-header">
        <div>
          <h1>Categorias</h1>
          <p>Organize seus produtos por seções</p>
        </div>
        <button className="add-category-btn" onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
          + Nova Categoria
        </button>
      </header>

      <section>
        {loading ? (
          <p>Carregando...</p>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma categoria cadastrada</h3>
            <p>Crie uma categoria para poder adicionar produtos ao cardápio.</p>
          </div>
        ) : (
          <CategoryTable 
            categories={categories} 
            onEdit={handleEdit} 
            onDelete={removeCategory} 
          />
        )}
      </section>

      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Editar Categoria" : "Nova Categoria"}
      >
        <CategoryForm 
          initialData={editingCategory}
          onSubmit={async (data) => {
            console.log("LOG: [CategoriesPage] Iniciando salvamento no Hook com:", data);
            try {
              await saveCategory(data);
              console.log("LOG: [CategoriesPage] Sucesso ao salvar. Fechando modal.");
              setIsModalOpen(false);
            } catch (err) {
              console.error("LOG: [CategoriesPage] Falha ao executar saveCategory:", err);
              alert("Erro ao salvar categoria. Verifique o console.");
            }
          }}
        />
      </CategoryModal>
    </main>
  );
}
