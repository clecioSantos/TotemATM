"use client";

import React, { useState, Suspense, useEffect, useRef } from "react";
import { signInWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup, signInWithCredential, linkWithCredential } from "firebase/auth";
import { auth, firestore } from "../../src/services/firebase";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { logger } from "@/src/lib/logger";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { Eye, EyeOff, Loader2, CheckCircle, ArrowRight, Mail, RefreshCw, X, Send } from "lucide-react";

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingGoogleCred, setPendingGoogleCred] = useState<{ credential: any; email: string } | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sendingContact, setSendingContact] = useState(false);
  const [contactToast, setContactToast] = useState<{ message: string; type?: "error" | "info" } | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const [isRestrictedEnv, setIsRestrictedEnv] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
    const check = () => {
      const isAndroidWebView = /Android/i.test(navigator.userAgent) && !/Chrome\/[.0-9]* Mobile/i.test(navigator.userAgent) && typeof (window as any)?.Capacitor === "undefined";
      setIsRestrictedEnv(isAndroidWebView);
    };
    // Check immediately and after a delay for Capacitor bridge init
    check();
    const t = setTimeout(check, 1000);
    return () => clearTimeout(t);
  }, []);

  const emailError = touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = touched.password && password && password.length < 6;
  const canSubmit = email && password && !emailError && !passwordError && !loading;

  const processGoogleUser = async (googleUser: any, idToken: string) => {
    const userDoc = await getDoc(doc(firestore, "users", googleUser.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(firestore, "users", googleUser.uid), {
        uid: googleUser.uid,
        email: googleUser.email || "",
        name: googleUser.displayName || googleUser.name || "",
        photoURL: googleUser.photoURL || googleUser.picture || "",
        provider: "google",
        role: "client",
        companyId: "default",
        createdAt: serverTimestamp(),
      });
    } else {
      const existing = userDoc.data();
      const updates: Record<string, any> = {};
      if (googleUser.displayName && !existing.name) updates.name = googleUser.displayName;
      if (googleUser.photoURL) updates.photoURL = googleUser.photoURL;
      if (Object.keys(updates).length > 0) {
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(firestore, "users", googleUser.uid), updates);
      }
    }

    let userRole = "client";
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        const data = await res.json();
        userRole = data.role || "client";
      }
    } catch { /* fallback */ }

    if (userRole === "client") {
      try {
        const ud = await getDoc(doc(firestore, "users", googleUser.uid));
        if (ud.exists()) userRole = (ud.data() as any).role || "client";
      } catch { /* fallback */ }
    }

    if (redirectPath) {
      window.location.href = redirectPath;
    } else if (userRole === "admin" || userRole === "owner") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/totem";
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      if (isRestrictedEnv) {
        setError("Login com Google não está disponível neste ambiente. Utilize seu e-mail e senha para entrar.");
        setGoogleLoading(false);
        return;
      }

      const isCapacitor = typeof (window as any)?.Capacitor !== "undefined";

      if (isCapacitor) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (!result?.credential?.idToken) {
          throw new Error("Google Sign-In failed: no ID token");
        }
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        const userCred = await signInWithCredential(auth, credential);
        const idToken = await userCred.user.getIdToken();
        await processGoogleUser(userCred.user, idToken);
      } else {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const idToken = await user.getIdToken();
        await processGoogleUser(user, idToken);
      }
    } catch (error: any) {
      if (error?.code === "auth/account-exists-with-different-credential") {
        const email = error?.customData?.email || "";
        const credential = GoogleAuthProvider.credentialFromError(error);
        if (email && credential) {
          setPendingGoogleCred({ credential, email });
          setError(`O e-mail ${email} já possui cadastro com senha. Faça login com sua senha abaixo para vincular sua conta Google.`);
        } else {
          setError("Esta conta já existe com outro método de login.");
        }
      } else if (error?.code === "auth/popup-blocked") {
        setError("Popup bloqueado pelo navegador.");
      } else if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
        setError("");
      } else {
        setError("Erro ao fazer login com Google. Tente novamente.");
        logger.error("LOGIN_PAGE", "Erro no login Google", error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (pendingGoogleCred) {
        try {
          await linkWithCredential(userCredential.user, pendingGoogleCred.credential);
          logger.info("LOGIN_PAGE", "Conta Google vinculada com sucesso");
          setPendingGoogleCred(null);
        } catch (linkErr) {
          logger.warn("LOGIN_PAGE", "Erro ao vincular conta Google", linkErr);
        }
      }

      const idToken = await userCredential.user.getIdToken();

      let userRole = "client";
      let sessionCreated = false;
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (res.ok) {
          const data = await res.json();
          userRole = data.role || "client";
          sessionCreated = true;
        } else {
          logger.warn("LOGIN_PAGE", "API de sessão indisponível, usando auth local");
        }
      } catch {
        logger.warn("LOGIN_PAGE", "API de sessão indisponível, usando auth local");
      }

      if (!sessionCreated) {
        try {
          const userDoc = await getDoc(doc(firestore, "users", userCredential.user.uid));
          if (userDoc.exists()) {
            userRole = (userDoc.data() as any).role || "client";
          }
        } catch { /* fallback */ }
      }

      await userCredential.user.getIdToken(true);
      await userCredential.user.reload();

      if (!sessionCreated && !userCredential.user.emailVerified && userRole !== "admin" && userRole !== "owner") {
        router.replace("/verify-email");
        return;
      }

      if (!userCredential.user.emailVerified && userRole !== "admin" && userRole !== "owner") {
        try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EAEAEA]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#FAFAFA] px-3 text-[#999] font-medium">ou continue com</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || isRestrictedEnv}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-[#EAEAEA] rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold text-[#1F1F1F]"
            title={isRestrictedEnv ? "Indisponível neste ambiente. Use e-mail e senha." : ""}
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? "Entrando com Google..." : "Entrar com Google"}
          </button>

          <p className="text-center text-sm text-[#666] mt-8">
            Ainda não tem conta?{" "}
            <Link
              href={`/register${redirectPath ? `?redirect=${redirectPath}` : ""}`}
              className="text-[#FF6B00] font-bold hover:underline"
            >
              Crie uma agora
            </Link>
          </p>

          <div className="text-center mt-6">
            <button
              onClick={() => setIsContactOpen(true)}
              className="text-sm text-[#FF6B00] font-semibold hover:underline inline-flex items-center gap-1.5"
            >
              <Mail size={14} /> Fale Conosco
            </button>
          </div>

          <p className="text-center text-xs text-[#999] mt-4 lg:hidden">
            © 2026 Bora De Delivery
          </p>
        </div>
      </div>

      {/* Contact Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setIsContactOpen(false); setContactSubject(""); setContactMessage(""); setContactPhone(""); }}>
          <div className="bg-white w-full max-w-md rounded-t-[24px] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Fale Conosco</h3>
              <button onClick={() => { setIsContactOpen(false); setContactSubject(""); setContactMessage(""); setContactPhone(""); }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-1">Assunto</label>
                <select
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] text-sm font-medium outline-none focus:border-[#FF6B00] transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="question">Pergunta</option>
                  <option value="add-company">Quero adicionar minha empresa no Bora</option>
                  <option value="complaint">Reclamação</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-1">Telefone para contato</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] text-sm font-medium outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-1">Mensagem</label>
                <textarea
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] text-sm font-medium outline-none focus:border-[#FF6B00] transition-colors resize-none"
                />
              </div>

              <button
                onClick={async () => {
                  if (!contactSubject || !contactMessage.trim()) return;
                  setSendingContact(true);
                  try {
                    const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
                    const { firestore } = await import("../../src/services/firebase");
                    await addDoc(collection(firestore, "contacts"), {
                      subject: contactSubject,
                      message: contactMessage.trim(),
                      phone: contactPhone.trim() || null,
                      userId: null,
                      userEmail: null,
                      userName: null,
                      companyId: null,
                      createdAt: serverTimestamp(),
                    });
                    setContactToast({ message: "Mensagem enviada com sucesso! Entraremos em contato em breve.", type: "info" });
                  } catch {
                    setContactToast({ message: "Erro ao enviar mensagem. Tente novamente.", type: "error" });
                  } finally {
                    setSendingContact(false);
                    setIsContactOpen(false);
                    setContactSubject("");
                    setContactMessage("");
                    setContactPhone("");
                  }
                }}
                disabled={!contactSubject || !contactMessage.trim() || sendingContact}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6B00] text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {sendingContact ? (
                  <><Loader2 size={18} className="animate-spin" /> Enviando...</>
                ) : (
                  <><Send size={18} /> Enviar Mensagem</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {contactToast && (
        <div className="fixed bottom-6 left-4 right-4 z-[60] max-w-md mx-auto animate-slide-up p-4 rounded-xl text-sm font-bold shadow-lg"
          style={{
            background: contactToast.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: contactToast.type === "error" ? "#991b1b" : "#166534",
            border: `1px solid ${contactToast.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span>{contactToast.message}</span>
            <button onClick={() => setContactToast(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>✕</button>
          </div>
        </div>
      )}
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
