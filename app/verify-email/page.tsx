"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/src/services/firebase";
import { sendEmailVerification, reload } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logger } from "@/src/lib/logger";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { Loader2, CheckCircle, Mail, ArrowLeft, RefreshCw, LogOut } from "lucide-react";

const benefits = [
  "Gestão de pedidos em tempo real",
  "Totem de autoatendimento",
  "Relatórios financeiros",
  "Integração com WhatsApp",
  "Cardápio digital",
];

function VerifyEmailContent() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  const handleResend = async () => {
    if (!firebaseUser || sending) return;
    setSending(true);
    setError("");
    setSent(false);
    try {
      await sendEmailVerification(firebaseUser);
      setSent(true);
      logger.info("VERIFY_EMAIL", "Reenvio de verificação solicitado");
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      const msg = fbErr?.code === "auth/too-many-requests"
        ? "Muitas tentativas. Tente novamente mais tarde."
        : "Erro ao reenviar e-mail. Tente novamente.";
      setError(msg);
      logger.error("VERIFY_EMAIL", "Erro no reenvio", err);
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!firebaseUser || checking) return;
    setChecking(true);
    setError("");
    try {
      await reload(firebaseUser);
      if (firebaseUser.emailVerified) {
        const idToken = await firebaseUser.getIdToken();
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (res.ok) {
          const data = await res.json();
          const role = data.role || "client";
          router.replace(role === "admin" || role === "owner" ? "/admin" : "/totem");
          return;
        }
        setError("Erro ao restaurar sessão. Faça login novamente.");
      } else {
        setError("Seu e-mail ainda não foi verificado. Tente novamente ou reenvie o e-mail.");
      }
    } catch (err) {
      setError("Erro ao verificar. Tente novamente.");
      logger.error("VERIFY_EMAIL", "Erro na verificação", err);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (err) {
      logger.error("VERIFY_EMAIL", "Erro ao sair", err);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center font-['Inter',sans-serif]">
        <div className="text-center max-w-sm px-6">
          <Mail size={48} className="mx-auto text-[#ccc] mb-4" />
          <h1 className="text-xl font-black mb-2">Verificação necessária</h1>
          <p className="text-sm text-[#666] mb-6">Faça login primeiro para acessar esta página.</p>
          <Link href="/login" className="inline-flex items-center gap-2 h-12 px-6 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] transition-all text-sm">
            <ArrowLeft size={18} /> Ir para login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-['Inter',sans-serif]">
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
        .animate-slide-up { animation: slideUp 0.5s ease-out both }
        .animate-fade-in { animation: fadeIn 0.6s ease-out both }
        .delay-1 { animation-delay:0.1s }
        .delay-2 { animation-delay:0.2s }
        .delay-3 { animation-delay:0.3s }
      `}</style>

      {/* Left - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#FF6B00] to-[#E65C00] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="" className="h-10 w-auto brightness-0 invert" />
            <span className="text-white text-xl font-black">Bora de Delivery</span>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 animate-float">
            <Mail size={32} className="text-white" />
          </div>
          <h2 className="text-white text-3xl font-black mb-3 leading-tight">
            Confirme seu e-mail<br />para continuar.
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            Você está a um passo de começar a usar o Bora de Delivery.
          </p>
          <div className="space-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <span className="text-white/90 text-sm font-medium">{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-white/50 text-xs">© 2026 Bora De Delivery</p>
        </div>
      </div>

      {/* Right - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up text-center">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <img src="/Logo.png" alt="Bora De Delivery" className="h-12 mx-auto mb-3" />
          </div>

          {sent ? (
            <div className="animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-[#22C55E]" />
              </div>
              <h1 className="text-2xl font-black mb-3">E-mail reenviado!</h1>
              <p className="text-sm text-[#666] mb-8 leading-relaxed">
                Novo e-mail de confirmação enviado para <strong className="text-[#1F1F1F]">{firebaseUser.email}</strong>.
                Verifique sua caixa de entrada e spam.
              </p>
              <button
                onClick={() => setSent(false)}
                className="inline-flex items-center gap-2 text-[#FF6B00] font-bold text-sm hover:underline"
              >
                Voltar
              </button>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-6">
                <Mail size={40} className="text-[#FF6B00]" />
              </div>

              <h1 className="text-2xl font-black mb-3">E-mail aguardando confirmação</h1>
              <p className="text-sm text-[#666] mb-2 leading-relaxed">
                Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e clique no link enviado para <strong className="text-[#1F1F1F]">{firebaseUser.email}</strong> para ativar sua conta.
              </p>
              <p className="text-xs text-[#999] mb-8">
                Não encontrou o e-mail? Verifique a caixa de spam.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5 animate-fade-in">
                  <p className="text-xs text-[#FF4D4F] text-center font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleResend}
                  disabled={sending}
                  className="w-full h-12 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] disabled:bg-[#EAEAEA] disabled:text-[#999] disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-200/50"
                >
                  {sending ? (
                    <><Loader2 size={18} className="animate-spin" /> Enviando...</>
                  ) : (
                    <><RefreshCw size={18} /> Reenviar e-mail de verificação</>
                  )}
                </button>

                <button
                  onClick={handleCheckVerification}
                  disabled={checking}
                  className="w-full h-12 bg-white text-[#1F1F1F] font-bold rounded-xl hover:bg-gray-50 disabled:bg-[#EAEAEA] disabled:text-[#999] disabled:cursor-not-allowed transition-all text-sm border border-[#EAEAEA] flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <><Loader2 size={18} className="animate-spin" /> Verificando...</>
                  ) : (
                    <><CheckCircle size={18} /> Já verifiquei meu e-mail</>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full h-12 text-[#666] font-bold rounded-xl hover:bg-gray-50 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> Sair e voltar ao login
                </button>
              </div>
            </>
          )}

          <p className="text-center text-xs text-[#999] mt-8 lg:hidden">© 2026 Bora De Delivery</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <ErrorBoundary context="VerifyEmailPage">
      <VerifyEmailContent />
    </ErrorBoundary>
  );
}
