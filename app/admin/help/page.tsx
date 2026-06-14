"use client";

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { Search, BookOpen, Mail, Send, X, Loader2 } from "lucide-react";
import { useAuth } from "@/app/admin/orders/AuthContext";
import helpContent from "@/src/lib/help-content";
import HelpModal from "../components/HelpModal";
import "../page.css";

export default function HelpCenterPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedHelpId, setSelectedHelpId] = useState<string | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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

  const sendContact = async () => {
    if (!contactSubject || !contactMessage.trim()) return;
    setSending(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(firestore, "contacts"), {
        subject: contactSubject,
        message: contactMessage.trim(),
        phone: contactPhone.trim() || null,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        userName: user?.name || null,
        companyId: user?.companyId || null,
        createdAt: serverTimestamp(),
      });
      setSent(true);
      setTimeout(() => { setIsContactOpen(false); setSent(false); setContactSubject(""); setContactMessage(""); setContactPhone(""); }, 2000);
    } catch {
      alert("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

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

      <div className="help-footer">
        <p className="help-footer-text">Não encontrou o que procurava?</p>
        <button
          onClick={() => setIsContactOpen(true)}
          className="help-contact-btn"
        >
          <Mail size={16} /> Fale Conosco
        </button>
      </div>

      <HelpModal
        helpId={selectedHelpId || ""}
        open={!!selectedHelpId}
        onClose={() => setSelectedHelpId(null)}
      />

      {/* Contact Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !sending && setIsContactOpen(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Fale Conosco</h3>
              <button onClick={() => setIsContactOpen(false)} disabled={sending}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Send size={24} className="text-green-600" />
                </div>
                <p className="font-bold text-green-700">Mensagem enviada com sucesso!</p>
                <p className="text-sm text-gray-500 mt-1">Entraremos em contato em breve.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Assunto</label>
                  <select
                    value={contactSubject}
                    onChange={e => setContactSubject(e.target.value)}
                    className="form-input w-full"
                  >
                    <option value="">Selecione...</option>
                    <option value="question">Pergunta</option>
                    <option value="add-company">Quero adicionar minha empresa no Bora</option>
                    <option value="complaint">Reclamação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Telefone para contato</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Mensagem</label>
                  <textarea
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    placeholder="Descreva sua dúvida ou problema..."
                    rows={4}
                    className="form-input w-full resize-none"
                  />
                </div>
                <button
                  onClick={sendContact}
                  disabled={!contactSubject || !contactMessage.trim() || sending}
                  className="save-button"
                >
                  {sending ? <><Loader2 size={18} className="spin" /> Enviando...</> : <><Send size={18} /> Enviar Mensagem</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}