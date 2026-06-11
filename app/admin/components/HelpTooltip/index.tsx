"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { getArticleById } from "@/src/lib/help-content";
import "./styles.css";

interface Props {
  helpId: string;
}

export default function HelpTooltip({ helpId }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const article = getArticleById(helpId);

  useEffect(() => {
    if (!visible || !ref.current) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  if (!article) return null;

  return (
    <span
      className="help-tooltip-wrapper"
      ref={ref}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible((v) => !v)}
      aria-label={`Ajuda: ${article.title}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setVisible((v) => !v);
      }}
    >
      <HelpCircle size={16} className="help-tooltip-icon" />
      {visible && (
        <div className="help-tooltip-popover" role="tooltip">
          <p className="help-tooltip-text">{article.shortDescription}</p>
        </div>
      )}
    </span>
  );
}