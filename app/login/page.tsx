"use client";

import React, { useState, Suspense, useEffect, useRef } from "react";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../../src/services/firebase";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { logger } from "@/src/lib/logger";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { Eye, EyeOff, Loader2, CheckCircle, ArrowRight, Mail, RefreshCw } from "lucide-react";

const benefits = [
  "Gestão de pedidos em tempo real",
  "Totem de autoatendimento",
  "Relatórios financeiros",
  "Integração com WhatsApp",
  "Cardápio digital",
];

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const emailError = touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = touched.password && password && password.length < 6;
  const canSubmit = email && password && !emailError && !passwordError && !loading;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const userRole = data.role || "client";

        await userCredential.user.getIdToken(true);
        await userCredential.user.reload();

        if (!userCredential.user.emailVerified && userRole !== "admin" && userRole !== "owner") {
          await fetch("/api/auth/logout", { method: "POST" });
          router.replace("/verify-email");
          return;
        }

        if (redirectPath) {
          window.location.href = redirectPath;
        } else if (userRole === "admin" || userRole === "owner") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/totem";
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || "Erro ao criar sessão segura no servidor.");
        logger.error("LOGIN_PAGE", "Erro na API de Sessão", undefined, errorData);
      }
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        "auth/invalid-credential": "E-mail ou senha inválidos.",
        "auth/user-not-found": "Usuário não encontrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/invalid-email": "E-mail inválido.",
        "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
      };
      const firebaseError = error?.code || "auth/unknown";
      setError(errorMessages[firebaseError] || "Erro ao fazer login. Verifique suas credenciais.");
      logger.error("LOGIN_PAGE", `Erro no login: ${firebaseError}`, error);
    } finally {
      setLoading(false);
    }
  };

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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
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
        <div className="w-full max-w-3xl animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/Logo.png" alt="Bora De Delivery" className="h-12 mx-auto mb-3" />
            <h1 className="text-2xl font-black">Bem-vindo</h1>
            <p className="text-sm text-[#666] mt-1">Faça login para continuar</p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1F1F1F] mb-1.5">E-mail</label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                placeholder="seu@email.com"
                autoComplete="email"
                required
                className={`w-full h-12 px-4 rounded-xl border text-sm bg-white outline-none transition-all placeholder:text-[#999] ${
                  emailError ? 'border-[#FF4D4F] focus:border-[#FF4D4F] ring-1 ring-[#FF4D4F]/20' : 'border-[#EAEAEA] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20'
                }`}
              />
              {emailError && <p className="text-xs text-[#FF4D4F] mt-1">E-mail inválido</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#1F1F1F] mb-1.5">Senha</label>
              <div className={`relative rounded-xl transition-all border bg-white ${
                passwordError ? 'border-[#FF4D4F] ring-1 ring-[#FF4D4F]/20' : 'border-[#EAEAEA] focus-within:border-[#FF6B00] focus-within:ring-1 focus-within:ring-[#FF6B00]/20'
              }`}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full h-12 px-4 pr-12 text-sm bg-transparent outline-none placeholder:text-[#999]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#666] hover:text-[#1F1F1F] rounded-lg hover:bg-gray-100 transition-all"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <p className="text-xs text-[#FF4D4F] mt-1">Mínimo de 6 caracteres</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-[#EAEAEA] text-[#FF6B00] focus:ring-[#FF6B00]/20" />
                <span className="text-[#666]">Lembrar-me</span>
              </label>
              <Link href="/forgot-password" className="text-[#FF6B00] font-semibold hover:underline">Esqueci minha senha</Link>
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
                <><Loader2 size={18} className="animate-spin" /> Entrando...</>
              ) : (
                <><span>Entrar</span> <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#666] mt-8">
            Ainda não tem conta?{" "}
            <Link
              href={`/register${redirectPath ? `?redirect=${redirectPath}` : ""}`}
              className="text-[#FF6B00] font-bold hover:underline"
            >
              Crie uma agora
            </Link>
          </p>

          <p className="text-center text-xs text-[#999] mt-6 lg:hidden">
            © 2026 Bora De Delivery
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ErrorBoundary context="LoginPage">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
          <Loader2 size={24} className="animate-spin text-[#FF6B00]" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </ErrorBoundary>
  );
}
