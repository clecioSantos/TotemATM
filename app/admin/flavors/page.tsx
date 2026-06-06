"use client";

import { useState } from "react";
import { useFlavors } from "./hooks/useFlavors";
import { useCategoriesStore } from "../categories/hooks/useCategories";
import { CategoryFlavor } from "@totem/shared/types";
import FlavorTable from "./components/FlavorTable";
import FlavorForm from "./components/FlavorForm";
import Modal from "../components/Modal";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import "./page.css";

function FlavorsContent() {
  const { flavors, loading: flavLoading, saveFlavor, removeFlavor } = useFlavors();
  const { categories, loading: catLoading } = useCategoriesStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<CategoryFlavor | null>(null);

  const handleEdit = (flavor: CategoryFlavor) => {
    setEditingFlavor(flavor);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingFlavor(null);
    setIsModalOpen(false);
  };

  const isLoading = flavLoading || catLoading;

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Sabores</h1>
          <p className="page-subtitle">Configure os sabores disponíveis por categoria</p>
        </div>
        <button className="primary-button" onClick={() => { setEditingFlavor(null); setIsModalOpen(true); }}>
          <span>➕</span> Novo Sabor
        </button>
      </header>

      <main className="page-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando sabores...</p>
          </div>
        ) : flavors.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum sabor cadastrado. Crie categorias com "Possui Sabores" ativo primeiro.</p>
          </div>
        ) : (
          <FlavorTable
            flavors={flavors}
            categories={categories}
            onDelete={(id) => { if (window.confirm("Deseja excluir este sabor?")) removeFlavor(id); }}
            onEdit={handleEdit}
          />
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingFlavor ? "Editar Sabor" : "Novo Sabor"}
      >
        <FlavorForm
          categories={categories}
          initialData={editingFlavor}
          onSubmit={async (data) => {
            try {
              await saveFlavor(data);
              handleClose();
            } catch (err) {
              logger.error("FlavorsPage.saveFlavor", err);
            }
          }}
        />
      </Modal>
    </div>
  );
}

export default function FlavorsPage() {
  return <ErrorBoundary context="FlavorsPage"><FlavorsContent /></ErrorBoundary>;
}
