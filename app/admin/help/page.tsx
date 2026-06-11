"use client";

import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import helpContent from "@/src/lib/help-content";
import HelpModal from "../components/HelpModal";
import "../page.css";

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [selectedHelpId, setSelectedHelpId] = useState<string | null>(null);

  const filtered = helpContent.filter((article) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      article.title.toLowerCase().includes(q) ||
      article.shortDescription.toLowerCase().includes(q) ||
      article.content.toLowerCase().includes(q) ||
      article.keywords.some((kw) => kw.includes(q))
    );
  });

  return (
    <div className="condiments-page-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="page-title">Central de Ajuda</h1>
          <p className="page-subtitle">
            Tire suas dúvidas sobre o funcionamento do sistema
          </p>
        </div>
      </header>

      <div className="help-search-section">
        <div className="help-search-wrapper">
          <Search size={18} className="help-search-icon" />
          <input
            type="text"
            className="help-search-input"
            placeholder="Como podemos ajudar?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Pesquisar na central de ajuda"
          />
        </div>
      </div>

      <div className="help-article-list">
        {filtered.length === 0 ? (
          <div className="help-empty">
            <BookOpen size={40} />
            <p>Nenhum resultado encontrado para "{query}"</p>
            <p className="help-empty-hint">
              Tente termos como: Mercado Pago, split, promoção, entrega
            </p>
          </div>
        ) : (
          filtered.map((article) => (
            <button
              key={article.id}
              className="help-article-card"
              onClick={() => setSelectedHelpId(article.id)}
              aria-label={`Abrir artigo: ${article.title}`}
            >
              <div className="help-article-info">
                <h3 className="help-article-title">{article.title}</h3>
                <p className="help-article-desc">
                  {article.shortDescription}
                </p>
              </div>
              <span className="help-article-arrow">→</span>
            </button>
          ))
        )}
      </div>

      <HelpModal
        helpId={selectedHelpId || ""}
        open={!!selectedHelpId}
        onClose={() => setSelectedHelpId(null)}
      />
    </div>
  );
}