"use client";

import { useState } from "react";
import { useCondiments, Condiment } from "./hooks/useCondiments";
import { useCategoriesStore } from "../categories/hooks/useCategories";
import CondimentTable from "./components/CondimentTable";
import CondimentForm from "./components/CondimentForm";
import Modal from "../components/Modal";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { logger } from "@/src/lib/logger";
import "./page.css";

function CondimentsContent() {
  const { condiments, loading: condLoading, saveCondiment, removeCondiment } = useCondiments();
  const { categories, loading: catLoading } = useCategoriesStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondiment, setEditingCondiment] = useState<Condiment | null>(null);

  const handleEdit = (condiment: Condiment) => {
    setEditingCondiment(condiment);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingCondiment(null);
    setIsModalOpen(false);
  };

  const isLoading = condLoading || catLoading;

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Condimentos Adicionais</h1>
          <p className="page-subtitle">Personalize a experiência do seu cliente com extras</p>
        </div>

        <button className="primary-button" onClick={() => {
          setEditingCondiment(null);
          setIsModalOpen(true);
        }}>
          <span>➕</span> Novo Condimento
        </button>
      </header>

      <main className="page-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando condimentos...</p>
          </div>
        ) : condiments.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum condimento disponível no momento.</p>
          </div>
        ) : (
          <CondimentTable 
            condiments={condiments} 
            categories={categories}
            onDelete={(id) => {
              if (window.confirm("Deseja excluir este condimento?")) removeCondiment(id);
            }}
            onEdit={handleEdit} 
          />
        )}
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleClose}
        title={editingCondiment ? "Editar Condimento" : "Cadastrar Condimento"}
      >
        <CondimentForm 
          categories={categories} 
          initialData={editingCondiment}
          onSubmit={async (data, file) => {
            try {
              await saveCondiment(data, file);
              handleClose();
            } catch (err) {
              logger.error("CondimentsPage.saveCondiment", err);
            }
          }}
        />
      </Modal>
    </div>
  );
}

export default function CondimentsPage() {
  return <ErrorBoundary context="CondimentsPage"><CondimentsContent /></ErrorBoundary>;
}
