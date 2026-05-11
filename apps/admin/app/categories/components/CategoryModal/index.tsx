"use client";

import "./styles.css";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function CategoryModal({ isOpen, onClose, title, children }: CategoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="category-modal-overlay" onClick={onClose}>
      <div className="category-modal-card" onClick={e => e.stopPropagation()}>
        <header className="category-modal-header">
          <h2>{title}</h2>
          <button className="category-modal-close" onClick={onClose}>&times;</button>
        </header>
        {children}
      </div>
    </div>
  );
}
