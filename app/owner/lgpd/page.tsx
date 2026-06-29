"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, FileText, Cookie, Plus, History, Download, Trash2, CheckCircle, X, Loader2, AlertTriangle, Eye, EyeOff, Copy } from "lucide-react";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp, onSnapshot, Timestamp } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { LEGAL_DOCUMENTS, publishDocument, getDocumentVersions } from "@/src/services/lgpd/legal-documents";
import { createAuditLog } from "@/src/services/lgpd/audit-log";

type Tab = "termos" | "privacidade" | "cookies" | "exclusoes" | "logs";

interface DeletionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  requestedAt: Timestamp;
}

export default function AdminLGPD() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("termos");
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingDeletions, setLoadingDeletions] = useState(false);
  const [showContent, setShowContent] = useState<string | null>(null);

  const documentConfig = {
    termos: { id: LEGAL_DOCUMENTS.TERMOS_USO, label: "Termos de Uso", icon: FileText },
    privacidade: { id: LEGAL_DOCUMENTS.POLITICA_PRIVACIDADE, label: "Política de Privacidade", icon: Shield },
    cookies: { id: LEGAL_DOCUMENTS.POLITICA_COOKIES, label: "Política de Cookies", icon: Cookie },
  };

  useEffect(() => {
    if (tab === "termos" || tab === "privacidade" || tab === "cookies") {
      const config = documentConfig[tab];
      getDocumentVersions(config.id).then(setVersions);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "exclusoes") {
      setLoadingDeletions(true);
      const q = query(collection(firestore, "deletion_requests"), orderBy("requestedAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setDeletionRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as DeletionRequest)));
        setLoadingDeletions(false);
      });
      return () => unsub();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "logs") {
      const q = query(collection(firestore, "audit_logs"), orderBy("data", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [tab]);

  const handlePublish = async () => {
    if (!title || !content || !version) return;
    setSaving(true);
    try {
      const config = documentConfig[tab as keyof typeof documentConfig];
      await publishDocument(config.id, title, content, version);
      await createAuditLog({
        usuario: user?.uid || "admin",
        acao: "termos_publicados",
        tipo: "documento_legal",
        detalhes: `Nova versão (v${version}) de "${config.label}" publicada.`,
      });
      setShowEditor(false);
      setTitle("");
      setContent("");
      setToast(`"${config.label}" publicado com sucesso!`);
      setTimeout(() => setToast(null), 4000);
      getDocumentVersions(config.id).then(setVersions);
    } catch (err) {
      setToast("Erro ao publicar.");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "termos", label: "Termos", icon: FileText },
    { key: "privacidade", label: "Privacidade", icon: Shield },
    { key: "cookies", label: "Cookies", icon: Cookie },
    { key: "exclusoes", label: "Exclusões", icon: Trash2 },
    { key: "logs", label: "Auditoria", icon: History },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield size={28} className="text-[#FF6B00]" />
          <h1 className="text-2xl font-black">LGPD e Privacidade</h1>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${tab === t.key ? "bg-white text-[#FF6B00] shadow-sm" : "text-[#666] hover:text-[#1F1F1F]"}`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {(tab === "termos" || tab === "privacidade" || tab === "cookies") && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">{documentConfig[tab].label}</h2>
            <button onClick={() => { setShowEditor(true); setVersion(versions.length > 0 ? versions[0].versao + 1 : 1); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-bold hover:bg-[#E65C00] transition-all">
              <Plus size={16} /> Nova Versão
            </button>
          </div>

          {showEditor && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Nova Versão — v{version}</h3>
                <button onClick={() => setShowEditor(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
              </div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do documento" className="w-full h-11 px-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00]" />
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Conteúdo do documento (HTML suportado)" rows={15} className="w-full p-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] text-sm outline-none focus:border-[#FF6B00] font-mono resize-y" />
              <button onClick={handlePublish} disabled={saving || !title || !content}
                className="w-full h-11 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] disabled:bg-[#EAEAEA] disabled:text-[#999] disabled:cursor-not-allowed transition-all text-sm">
                {saving ? "Publicando..." : "Publicar Nova Versão"}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {versions.length === 0 ? (
              <p className="text-sm text-[#999] italic py-8 text-center">Nenhuma versão publicada ainda.</p>
            ) : (
              versions.map(v => (
                <div key={v.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">v{v.versao}</span>
                      <span className="text-xs text-[#999]">{v.titulo}</span>
                      <span className="text-[10px] text-gray-400">
                        {v.dataCriacao?.seconds ? new Date(v.dataCriacao.seconds * 1000).toLocaleString("pt-BR") : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setShowContent(v.conteudo || "")} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Visualizar"><Eye size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "exclusoes" && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg mb-4">Solicitações de Exclusão</h2>
          {loadingDeletions ? (
            <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#FF6B00]" /></div>
          ) : deletionRequests.length === 0 ? (
            <p className="text-sm text-[#999] italic py-8 text-center">Nenhuma solicitação de exclusão.</p>
          ) : (
            deletionRequests.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{r.userName}</p>
                    <p className="text-xs text-[#666]">{r.userEmail}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Solicitado em: {r.requestedAt?.seconds ? new Date(r.requestedAt.seconds * 1000).toLocaleString("pt-BR") : ""}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${r.status === "requested" ? "bg-yellow-100 text-yellow-800" : r.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {r.status === "requested" ? "Pendente" : r.status === "completed" ? "Concluído" : r.status === "rejected" ? "Negado" : r.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg mb-4">Logs de Auditoria</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-[#999] italic py-8 text-center">Nenhum log registrado.</p>
          ) : (
            <div className="space-y-1">
              {logs.map(l => (
                <div key={l.id} className="bg-white rounded-lg border border-gray-50 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">{l.acao?.replace(/_/g, " ")}</span>
                    <span className="text-gray-400">{l.data?.seconds ? new Date(l.data.seconds * 1000).toLocaleString("pt-BR") : ""}</span>
                  </div>
                  <p className="text-gray-500 mt-0.5">{l.detalhes}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Usuário: {l.usuario?.substring(0, 12)}... | Tipo: {l.tipo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowContent(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Visualizar Conteúdo</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { navigator.clipboard.writeText(showContent || ""); setToast("Conteúdo copiado!"); setTimeout(() => setToast(null), 3000); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-1" title="Copiar"><Copy size={16} /> Copiar</button>
                <button onClick={() => setShowContent(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
              </div>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{showContent}</div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-4 right-4 z-[60] max-w-[430px] mx-auto animate-slide-up"
          style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
