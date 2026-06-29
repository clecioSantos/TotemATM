"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { Shield, FileText, Download, Trash2, CheckCircle, AlertTriangle, X, User, Calendar, MapPin, ShoppingBag, Loader2 } from "lucide-react";
import { getUserConsent, LEGAL_DOCUMENTS } from "@/src/services/lgpd/legal-documents";
import { exportUserData } from "@/src/services/lgpd/data-export";
import { requestAccountDeletion } from "@/src/services/lgpd/account-deletion";
import { createAuditLog } from "@/src/services/lgpd/audit-log";

export default function PrivacyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [consent, setConsent] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"confirm" | "warning" | "done">("confirm");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login?redirect=/privacy"); return; }
    getUserConsent(user.uid).then(setConsent);
  }, [user, router, authLoading]);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const data = await exportUserData(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-${user.uid.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
      await createAuditLog({
        usuario: user.uid,
        acao: "dados_exportados",
        tipo: "exportacao",
        detalhes: "Usuário exportou seus dados pessoais.",
      });
    } catch (err) {
      setToast("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await requestAccountDeletion(user.uid, user.name || "Usuário", user.email || "");
      setDeleteStep("done");
    } catch (err) {
      setToast("Erro ao solicitar exclusão. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Inter',sans-serif]">
      <header className="sticky top-0 bg-white z-10 border-b border-[#EAEAEA]">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <img src="/Logo.png" alt="Bora" className="h-[42px] w-auto" />
          </div>
          <button onClick={() => router.push("/totem")} className="text-sm font-bold text-[#666] hover:text-[#1F1F1F]">
            Voltar
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={32} className="text-[#FF6B00]" />
          <h1 className="text-2xl font-black text-gray-900">Minha Privacidade</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="font-bold text-lg flex items-center gap-2"><User size={20} /> Dados Cadastrais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Nome</span>
              <p className="font-medium text-gray-800">{user?.name || "---"}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Email</span>
              <p className="font-medium text-gray-800">{user?.email || "---"}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Telefone</span>
              <p className="font-medium text-gray-800">{(user as any)?.phone || "---"}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">CPF</span>
              <p className="font-medium text-gray-800">{(user as any)?.cpf ? "***" + (user as any).cpf.slice(-4) : "---"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><FileText size={20} /> Termos Aceitos</h2>
          <div className="space-y-3 text-sm">
            <Link href="/termos" target="_blank" className="block text-[#FF6B00] hover:underline font-medium">Termos de Uso</Link>
            <Link href="/privacidade" target="_blank" className="block text-[#FF6B00] hover:underline font-medium">Política de Privacidade</Link>
            <Link href="/cookies" target="_blank" className="block text-[#FF6B00] hover:underline font-medium">Política de Cookies</Link>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
          {consent ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Termos de Uso</span>
                <span className="font-medium text-green-600 flex items-center gap-1"><CheckCircle size={14} /> v{consent.termsVersion}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Política de Privacidade</span>
                <span className="font-medium text-green-600 flex items-center gap-1"><CheckCircle size={14} /> v{consent.privacyVersion}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Data do Consentimento</span>
                <span className="font-medium text-gray-800">
                  {consent.acceptedAt ? new Date(consent.acceptedAt.seconds * 1000).toLocaleDateString("pt-BR") : "---"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#999] italic">Nenhum termo aceito ainda.</p>
          )}
        </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><Download size={20} /> Exportar Meus Dados</h2>
          <p className="text-sm text-[#666]">Baixe todos os seus dados pessoais armazenados na plataforma em formato JSON.</p>
          <button onClick={handleExport} disabled={exporting || exportSuccess}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] disabled:bg-[#EAEAEA] disabled:text-[#999] disabled:cursor-not-allowed transition-all text-sm"
          >
            {exporting ? <><Loader2 size={16} className="animate-spin" /> Exportando...</> : exportSuccess ? <><CheckCircle size={16} /> Exportado com sucesso!</> : <><Download size={16} /> Exportar Meus Dados</>}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2 text-red-600"><Trash2 size={20} /> Solicitar Exclusão da Conta</h2>
          <p className="text-sm text-[#666]">Solicite a exclusão de sua conta e dados pessoais. Pedidos anteriores serão mantidos por obrigação legal.</p>

          {deleteStep === "done" ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-bold text-green-800 flex items-center gap-2"><CheckCircle size={18} /> Solicitação enviada com sucesso!</p>
              <p className="text-xs text-green-700 mt-1">Sua solicitação será analisada e processada em até 15 dias úteis.</p>
            </div>
          ) : !showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm">
              <Trash2 size={16} /> Solicitar Exclusão
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800">Aviso Importante</p>
                  <p className="text-xs text-red-700 mt-1">
                    Esta ação não pode ser desfeita. Seus dados pessoais serão removidos ou anonimizados.
                    Registros de pedidos e financeiros serão mantidos conforme obrigação legal.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#666] hover:bg-gray-50 transition-all">
                  Cancelar
                </button>
                <button onClick={handleDeleteRequest} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all">
                  {deleting ? "Enviando..." : "Confirmar Exclusão"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-4 right-4 z-[60] max-w-[430px] mx-auto animate-slide-up"
          style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          <div className="flex items-center justify-between">
            <span>{toast}</span>
            <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.6 }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
