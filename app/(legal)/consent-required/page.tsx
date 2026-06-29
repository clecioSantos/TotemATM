"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@totem/shared/types/AuthProvider";
import { Shield, FileText, Cookie, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { checkConsentRequired, saveUserConsent, LEGAL_DOCUMENTS, getActiveDocument } from "@/src/services/lgpd/legal-documents";
import { createAuditLog } from "@/src/services/lgpd/audit-log";

export default function ConsentRequiredPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedCookies, setAcceptedCookies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [required, setRequired] = useState<{ terms: boolean; privacy: boolean; cookies: boolean } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    checkConsentRequired(user.uid).then((result) => {
      if (!result || (!result.terms && !result.privacy && !result.cookies)) {
        router.push("/totem");
        return;
      }
      setRequired(result);
      setLoading(false);
    });
  }, [user, router, authLoading]);

  const handleAccept = async () => {
    if (!user || !required) return;
    setSaving(true);
    try {
      const termsDoc = await getActiveDocument(LEGAL_DOCUMENTS.TERMOS_USO);
      const privacyDoc = await getActiveDocument(LEGAL_DOCUMENTS.POLITICA_PRIVACIDADE);
      const cookiesDoc = await getActiveDocument(LEGAL_DOCUMENTS.POLITICA_COOKIES);

      await saveUserConsent(user.uid, {
        acceptedTerms,
        acceptedPrivacyPolicy: acceptedPrivacy,
        acceptedCookies: acceptedCookies,
        termsVersion: termsDoc?.versao || 1,
        privacyVersion: privacyDoc?.versao || 1,
        cookiesVersion: cookiesDoc?.versao || 1,
        acceptedAt: undefined as any,
        acceptanceSource: "reauth",
        deviceInfo: navigator.userAgent,
      });

      await createAuditLog({
        usuario: user.uid,
        acao: "termos_aceites",
        tipo: "consentimento",
        detalhes: `Usuário reaceitou termos (v${termsDoc?.versao || 1}), privacidade (v${privacyDoc?.versao || 1}) e cookies (v${cookiesDoc?.versao || 1}).`,
      });

      router.push("/totem");
    } catch (error) {
      console.error("Erro ao salvar consentimento:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#666]">Verificando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Inter',sans-serif] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 animate-slide-up">
        <div className="text-center mb-8">
          <Shield size={48} className="mx-auto text-[#FF6B00] mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Documentos Atualizados</h1>
          <p className="text-sm text-[#666] leading-relaxed">
            Os documentos da plataforma foram atualizados. É necessário aceitar os novos termos para continuar.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {required?.terms && (
            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#FF6B00] cursor-pointer transition-colors">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 accent-[#FF6B00]" />
              <div>
                <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                  <FileText size={16} /> Li e aceito os{" "}
                  <Link href="/termos" className="text-[#FF6B00] hover:underline">Termos de Uso</Link>
                </span>
                <span className="text-[11px] text-[#999]">Versão mais recente dos termos</span>
              </div>
            </label>
          )}

          {required?.privacy && (
            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#FF6B00] cursor-pointer transition-colors">
              <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-1 accent-[#FF6B00]" />
              <div>
                <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                  <Shield size={16} /> Li e aceito a{" "}
                  <Link href="/privacidade" className="text-[#FF6B00] hover:underline">Política de Privacidade</Link>
                </span>
                <span className="text-[11px] text-[#999]">Versão mais recente da política</span>
              </div>
            </label>
          )}

          {required?.cookies && (
            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#FF6B00] cursor-pointer transition-colors">
              <input type="checkbox" checked={acceptedCookies} onChange={(e) => setAcceptedCookies(e.target.checked)} className="mt-1 accent-[#FF6B00]" />
              <div>
                <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                  <Cookie size={16} /> Li e aceito a{" "}
                  <Link href="/cookies" className="text-[#FF6B00] hover:underline">Política de Cookies</Link>
                </span>
                <span className="text-[11px] text-[#999]">Versão mais recente da política</span>
              </div>
            </label>
          )}
        </div>

        <button
          onClick={handleAccept}
          disabled={!acceptedTerms || !acceptedPrivacy || !acceptedCookies || saving}
          className="w-full h-12 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] disabled:bg-[#EAEAEA] disabled:text-[#999] disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-200/50"
        >
          {saving ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</>
          ) : (
            <><CheckCircle size={18} /> Aceitar e Continuar <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}
