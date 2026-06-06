"use client";

import React, { useState, Suspense } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/services/firebase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { logger } from "@/src/lib/logger";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import "./page.css";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const userRole = data.role || "client";

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
    <div className="login-container">
      <div className="login-card">
        <header className="login-header">
          <h1>Bora De Delivery</h1>
          <p>Faça seu login</p>
        </header>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <span className="error-message">{error}</span>}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Entrando..." : "Acessar Sistema"}
          </button>
        </form>
        <p className="footer-text" style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          Ainda não tem conta?{" "}
          <Link
            href={`/register${redirectPath ? `?redirect=${redirectPath}` : ""}`}
            style={{ color: '#000', fontWeight: '600', textDecoration: 'none' }}
          >
            Crie uma agora
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ErrorBoundary context="LoginPage">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </ErrorBoundary>
  );
}
