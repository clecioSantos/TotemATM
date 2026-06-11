"use client";

import { useEffect, useCallback } from "react";
import { X, Lightbulb, List } from "lucide-react";
import { getArticleById } from "@/src/lib/help-content";
import "./styles.css";

interface Props {
  helpId: string;
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ helpId, open, onClose }: Props) {
  const article = getArticleById(helpId);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open || !article) return null;

  return (
    <div
      className="help-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={article.title}
    >
      <div className="help-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="help-modal-header">
          <h2 className="help-modal-title">{article.title}</h2>
          <button
            className="help-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="help-modal-body">
          <p className="help-modal-description">{article.content}</p>

          <div className="help-modal-section">
            <div className="help-modal-section-header">
              <List size={16} />
              <span>Passo a passo</span>
            </div>
            <ol className="help-modal-list">
              {article.topics.map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ol>
          </div>

          <div className="help-modal-section">
            <div className="help-modal-section-header">
              <Lightbulb size={16} />
              <span>Dicas importantes</span>
            </div>
            <ul className="help-modal-list help-modal-tips">
              {article.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}