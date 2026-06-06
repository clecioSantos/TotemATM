"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "@/src/services/firebase";
import Link from "next/link";
import { userRepository } from "@totem/shared/types/user.repository";
import { useSearchParams } from "next/navigation";
import { logger } from "@/src/lib/logger";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import {
  Eye, EyeOff, Loader2, CheckCircle, XCircle, ArrowRight,
  ArrowLeft, User, Mail, Lock, ChevronRight
} from "lucide-react";

const benefits = [
  "Gestão de pedidos em tempo real",
  "Totem de autoatendimento",
  "Relatórios financeiros",
  "Integração com WhatsApp",
  "Cardápio digital",
];

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const nameClean = useMemo(() => name.trim().replace(/\s+/g, " "), [name]);
  const nameError = touched.name && (nameClean.length < 3 || /^\d+$/.test(nameClean));
  const nameValid = nameClean.length >= 3 && !/^\d+$/.test(nameClean);

  const emailError = touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const passwordRules = useMemo(() => [
    { label: "8 caracteres", check: password.length >= 8 },
    { label: "1 letra maiúscula", check: /[A-Z]/.test(password) },
    { label: "1 letra minúscula", check: /[a-z]/.test(password) },
    { label: "1 número", check: /\d/.test(password) },
  ], [password]);

  const passwordScore = passwordRules.filter(r => r.check).length;
  const passwordStrength = passwordScore === 0 ? "" : passwordScore <= 2 ? "Fraca" : passwordScore === 3 ? "Média" : "Forte";

  const passwordError = touched.password && password.length > 0 && passwordScore < 4;
  const passwordValid = password.length > 0 && passwordScore === 4;

  const confirmError = touched.confirm && confirmPassword.length > 0 && confirmPassword !== password;
  const confirmValid = confirmPassword.length > 0 && confirmPassword === password;

  const canSubmit = nameValid && emailValid && passwordValid && confirmValid && !loading;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: nameClean });

      await userRepository.create({
        uid: userCredential.user.uid,
        email: email.trim(),
        name: nameClean,
        role: "client",
        companyId: "default",
      });

      try {
        await sendEmailVerification(userCredential.user);
        logger.info("REGISTER_PAGE", "E-mail de verificação enviado", { email });
      } catch (verifyErr) {
        logger.warn("REGISTER_PAGE", "Falha ao enviar e-mail de verificação", verifyErr);
      }

      setRegisteredEmail(email.trim());
      setRegistered(true);
      logger.info("REGISTER_PAGE", `Usuário cadastrado: ${userCredential.user.uid}`);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      const errorMessages: Record<string, string> = {
        "auth/configuration-not-found": "Provedor de E-mail/Senha não ativado no Console do Firebase.",
        "auth/email-already-in-use": "Este e-mail já está cadastrado.",
        "auth/invalid-email": "Digite um e-mail válido.",
        "auth/weak-password": "A senha não atende aos requisitos mínimos.",
        "auth/operation-not-allowed": "Cadastro desabilitado temporariamente.",
        "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
        "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
      };
      const firebaseError = fbErr?.code || "auth/unknown";
      setError(errorMessages[firebaseError] || "Ocorreu um erro inesperado. Tente novamente.");
      logger.error("REGISTER_PAGE", `Erro: ${firebaseError}`, err);
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex font-['Inter',sans-serif]">
        <style>{`
          @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
          .animate-slide-up { animation: slideUp 0.5s ease-out both }
        `}</style>
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
              Conta criada com sucesso!
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Enviamos um e-mail de confirmação. Verifique sua caixa de entrada para ativar sua conta.
            </p>
          </div>
          <div className="relative z-10">
            <p className="text-white/50 text-xs">© 2026 Bora De Delivery</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-slide-up text-center">
            <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-[#22C55E]" />
            </div>
            <h1 className="text-2xl font-black mb-3">Conta criada com sucesso!</h1>
            <p className="text-sm text-[#666] mb-6 leading-relaxed">
              Enviamos um e-mail de confirmação para <strong className="text-[#1F1F1F]">{registeredEmail}</strong>.
              Verifique sua caixa de entrada e spam para ativar sua conta.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-12 px-6 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] transition-all text-sm"
            >
              Ir para Login <ArrowRight size={18} />
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
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-white text-3xl font-black mb-3 leading-tight">
            Se a fome chama,<br />Bora de Delivery.
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            Crie sua conta e comece a gerenciar seu delivery com agilidade e eficiência.
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
      <div className="w-full lg:w-1/2 flex items-start justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-lg pt-6 lg:pt-10 pb-8 animate-slide-up">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <img src="/Logo.png" alt="Bora De Delivery" className="h-12 mx-auto mb-3" />
            <h1 className="text-2xl font-black">Criar sua conta</h1>
            <p className="text-sm text-[#666] mt-1">Cadastre-se para começar</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
              <User size={26} className="text-[#FF6B00]" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black">Criar sua conta</h1>
              <p className="text-sm lg:text-base text-[#666] mt-0.5">Cadastre-se para começar a utilizar o sistema</p>
            </div>
          </div>

          <form onSubmit={handleRegister} noValidate className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-semibold text-[#1F1F1F] mb-1.5">Nome completo</label>
              <div className={`relative rounded-xl transition-all border bg-white ${
                nameError ? 'border-[#FF4D4F] ring-1 ring-[#FF4D4F]/20' : nameValid ? 'border-[#22C55E] ring-1 ring-[#22C55E]/20' : 'border-[#EAEAEA] focus-within:border-[#FF6B00] focus-within:ring-1 focus-within:ring-[#FF6B00]/20'
              }`}>
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
                <input
                  ref={nameRef}
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  required
                  aria-label="Nome completo"
                  className="w-full h-12 pl-10 pr-10 text-sm bg-transparent outline-none placeholder:text-[#999]"
                />
                {nameValid && <CheckCircle size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#22C55E]" />}
                {nameError && <XCircle size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FF4D4F]" />}
              </div>
              {nameError && name.length > 0 && (
                <p className="text-xs text-[#FF4D4F] mt-1">Mínimo de 3 caracteres e não pode conter apenas números</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-[#1F1F1F] mb-1.5">E-mail</label>
              <div className={`relative rounded-xl transition-all border bg-white ${
                emailError ? 'border-[#FF4D4F] ring-1 ring-[#FF4D4F]/20' : emailValid ? 'border-[#22C55E] ring-1 ring-[#22C55E]/20' : 'border-[#EAEAEA] focus-within:border-[#FF6B00] focus-within:ring-1 focus-within:ring-[#FF6B00]/20'
              }`}>
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                  aria-label="E-mail"
                  className="w-full h-12 pl-10 pr-10 text-sm bg-transparent outline-none placeholder:text-[#999]"
                />
                {emailValid && <CheckCircle size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#22C55E]" />}
                {emailError && <XCircle size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FF4D4F]" />}
              </div>
              {emailError && <p className="text-xs text-[#FF4D4F] mt-1">Digite um e-mail válido (ex: nome@dominio.com)</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-[#1F1F1F] mb-1.5">Senha</label>
              <div className={`relative rounded-xl transition-all border bg-white ${
                passwordError ? 'border-[#FF4D4F] ring-1 ring-[#FF4D4F]/20' : passwordValid ? 'border-[#22C55E] ring-1 ring-[#22C55E]/20' : 'border-[#EAEAEA] focus-within:border-[#FF6B00] focus-within:ring-1 focus-within:ring-[#FF6B00]/20'
              }`}>
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  placeholder="Crie uma senha forte"
                  autoComplete="new-password"
                  required
                  aria-label="Senha"
                  className="w-full h-12 pl-10 pr-12 text-sm bg-transparent outline-none placeholder:text-[#999]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#666] hover:text-[#1F1F1F] rounded-lg hover:bg-gray-100 transition-all"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          passwordScore <= 1 ? 'w-[25%] bg-[#FF4D4F]' : passwordScore === 2 ? 'w-[50%] bg-[#FFB800]' : passwordScore === 3 ? 'w-[75%] bg-[#22C55E]' : 'w-full bg-[#22C55E]'
                        }`}
                      />
                    </div>
                    {passwordStrength && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                        passwordScore <= 2 ? 'text-[#FF4D4F]' : passwordScore === 3 ? 'text-[#FFB800]' : 'text-[#22C55E]'
                      }`}>
                        {passwordStrength}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {passwordRules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px]">
                        {rule.check ? (
                          <CheckCircle size={12} className="text-[#22C55E] flex-shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-[#ccc] flex-shrink-0" />
                        )}
                        <span className={rule.check ? "text-[#22C55E]" : "text-[#999]"}>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-[#1F1F1F] mb-1.5">Confirmar senha</label>
              <div className={`relative rounded-xl transition-all border bg-white ${
                confirmError ? 'border-[#FF4D4F] ring-1 ring-[#FF4D4F]/20' : confirmValid ? 'border-[#22C55E] ring-1 ring-[#22C55E]/20' : 'border-[#EAEAEA] focus-within:border-[#FF6B00] focus-within:ring-1 focus-within:ring-[#FF6B00]/20'
              }`}>
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, confirm: true }))}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  required
                  aria-label="Confirmar senha"
                  className="w-full h-12 pl-10 pr-12 text-sm bg-transparent outline-none placeholder:text-[#999]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#666] hover:text-[#1F1F1F] rounded-lg hover:bg-gray-100 transition-all"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmError && <p className="text-xs text-[#FF4D4F] mt-1">As senhas não conferem</p>}
              {confirmValid && <p className="text-xs text-[#22C55E] mt-1">Senhas conferem</p>}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 animate-fade-in" role="alert">
                <p className="text-xs text-[#FF4D4F] text-center font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              aria-label="Criar conta"
              className="w-full h-12 bg-[#FF6B00] text-white font-bold rounded-xl hover:bg-[#E65C00] disabled:bg-[#EAEAEA] disabled:text-[#999] disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-200/50"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Criando conta...</>
              ) : (
                <><span>Criar conta</span> <ChevronRight size={18} /></>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center mt-8">
            <Link
              href={`/login${redirectPath ? `?redirect=${redirectPath}` : ""}`}
              className="inline-flex items-center gap-2 text-[#FF6B00] font-bold text-sm hover:underline"
            >
              <ArrowLeft size={18} /> Já tenho uma conta
            </Link>
          </div>

          <p className="text-center text-xs text-[#999] mt-8 lg:hidden">© 2026 Bora De Delivery</p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <ErrorBoundary context="RegisterPage">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
          <Loader2 size={24} className="animate-spin text-[#FF6B00]" />
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </ErrorBoundary>
  );
}
