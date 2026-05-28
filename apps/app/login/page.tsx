"use client";

import React, { useState, Suspense } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/services/firebase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
        // Redireciona para a página original (ex: totem/[id]) ou para o admin por padrão
        window.location.href = redirectPath || "/admin";
      } else {
        setError("Erro ao criar sessão segura.");
      }
    } catch (err) {
      console.error("🔥 Erro Firebase:", err);
      setError("Falha no login: verifique suas credenciais ou se o provedor está ativo no console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <header className="login-header">
          <h1>NexOrder</h1>
          <p>Painel Administrativo</p>
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
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}