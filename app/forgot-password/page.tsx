"use client";

import React, { useState, useEffect, useRef } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/src/services/firebase";
import Link from "next/link";
import { logger } from "@/src/lib/logger";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { Loader2, ArrowLeft, CheckCircle, Mail, ArrowRight } from "lucide-react";

const benefits = [
  "Gestão de pedidos em tempo real",
  "Totem de autoatendimento",
  "Relatórios financeiros",
  "Integração com WhatsApp",
  "Cardápio digital",
];

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const emailError = touched && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = email && !emailError && !loading && !sent;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      logger.info("FORGOT_PASSWORD", "E-mail de redefinição enviado", { email });
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        "auth/invalid-email": "E-mail inválido.",
        "auth/user-not-found": "Nenhuma conta encontrada com este e-mail.",
        "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
        "auth/missing-email": "Informe um e-mail.",
      };
      const firebaseError = error?.code || "auth/unknown";
      setError(errorMessages[firebaseError] || "Erro ao enviar e-mail. Tente novamente.");
      logger.error("FORGOT_PASSWORD", `Erro: ${firebaseError}`, error);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex font-['Inter',sans-serif]">
        <style>{`
          @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
          .animate-slide-up { animation: slideUp 0.5s ease-out both }
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
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h2 className="text-white text-3xl font-black mb-3 leading-tight">
              E-mail enviado!
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
          </div>
          <div className="relative z-10">
            <p className="text-white/50 text-xs">© 2026 Bora De Delivery</p>
          </div>
        </div>

        {/* Right - Success */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-slide-up text-center">
            <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-[#22C55E]" />
            </div>
            <h1 className="text-2xl font-black mb-3">E-mail enviado!</h1>
            <p className="text-sm text-[#666] mb-8 leading-relaxed">
              Enviamos um link de redefinição de senha para <strong className="text-[#1F1F1F]">{email}</strong>.
              Verifique sua caixa de entrada e spam.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-12 px-6 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] transition-all text-sm"
            >
              <ArrowLeft size={18} /> Voltar para login
            </Link>
            <p className="text-center text-xs text-[#999] mt-8 lg:hidden">© 2026 Bora De Delivery</p>
          </div>
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
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-white text-3xl font-black mb-3 leading-tight">
            Se a fome chama,<br />Bora de Delivery.
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            A plataforma completa para gerenciar seu delivery com agilidade, eficiência e resultados reais.
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

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/Logo.png" alt="Bora De Delivery" className="h-12 mx-auto mb-3" />
            <h1 className="text-2xl font-black">Recuperar senha</h1>
            <p className="text-sm text-[#666] mt-1">Informe seu e-mail</p>
          </div>

          <div className="hidden lg:flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Mail size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Recuperar senha</h1>
              <p className="text-sm text-[#666]">Informe seu e-mail para receber um link de redefinição</p>
            </div>
          </div>

          <form onSubmit={handleReset} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1F1F1F] mb-1.5">E-mail</label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="seu@email.com"
                autoComplete="email"
                required
                className={`w-full h-12 px-4 rounded-xl border text-sm bg-white outline-none transition-all placeholder:text-[#999] ${
                  emailError ? 'border-[#FF4D4F] focus:border-[#FF4D4F] ring-1 ring-[#FF4D4F]/20' : 'border-[#EAEAEA] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20'
                }`}
              />
              {emailError && <p className="text-xs text-[#FF4D4F] mt-1">E-mail inválido</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 animate-fade-in">
                <p className="text-xs text-[#FF4D4F] text-center font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-12 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] disabled:bg-[#EAEAEA] disabled:text-[#999] disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-200/50"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Enviando...</>
              ) : (
                <><span>Enviar link de recuperação</span> <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <Link href="/login" className="inline-flex items-center gap-2 text-[#FF6B00] font-bold text-sm hover:underline">
              <ArrowLeft size={18} /> Voltar para login
            </Link>
          </div>

          <p className="text-center text-xs text-[#999] mt-8 lg:hidden">© 2026 Bora De Delivery</p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <ErrorBoundary context="ForgotPasswordPage">
      <ForgotPasswordForm />
    </ErrorBoundary>
  );
}
