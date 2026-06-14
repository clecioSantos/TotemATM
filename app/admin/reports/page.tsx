"use client";

import { BarChart3 } from "lucide-react";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";

function ReportsContent() {
  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Em breve — análises e relatórios da sua loja.</p>
        </div>
      </header>
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <BarChart3 size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">Página em desenvolvimento</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ErrorBoundary context="ReportsPage">
      <ReportsContent />
    </ErrorBoundary>
  );
}
