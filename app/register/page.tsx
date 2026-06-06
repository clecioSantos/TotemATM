"use client";

import React, { useState, Suspense } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/src/services/firebase";
import Link from "next/link";
import { userRepository } from "@totem/shared/types/user.repository";
import { useSearchParams } from "next/navigation";
import { logger } from "@/src/lib/logger";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import "./page.css";

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // SALVAR NO FIRESTORE
      await userRepository.create({
        uid: userCredential.user.uid,
        email: email,
        name: name,
        role: "client", // Altere para "client" se este for o padrão para novos registros
        companyId: "default"
      });

      const idToken = await userCredential.user.getIdToken();

      // Esta é a chamada que estava retornando 404
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        window.location.href = redirectPath || "/";
      } else {
        setError("Conta criada, mas houve um erro ao iniciar sessão.");
        const errorText = await res.text().catch(() => "unknown");
        logger.error("REGISTER_PAGE", "Erro na API de Sessão (register)", undefined, errorText);
      }
    } catch (err: any) {
      const errorMessages: Record<string, string> = {
        "auth/configuration-not-found": "Erro: Provedor de E-mail/Senha não ativado no Console do Firebase.",
        "auth/email-already-in-use": "Este e-mail já está cadastrado.",
        "auth/invalid-email": "E-mail inválido.",
        "auth/weak-password": "Senha muito fraca. Mínimo de 6 caracteres.",
        "auth/operation-not-allowed": "Cadastro desabilitado temporariamente.",
        "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
      };

      const firebaseError = err?.code || "auth/unknown";
      setError(errorMessages[firebaseError] || "Erro ao cadastrar. Verifique os dados.");
      logger.error("REGISTER_PAGE", `Erro no register: ${firebaseError}`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <header className="login-header">
          <h1>Criar Conta</h1>
          <p>Comece a gerenciar seu negócio com Bora De Delivery</p>
        </header>

        <form className="login-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label>Nome Completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
          </div>
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
            {loading ? "Criando conta..." : "Registrar"}
          </button>
        </form>
        <p className="footer-text">Já tem uma conta? <Link href="/login">Entre aqui</Link></p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <ErrorBoundary context="RegisterPage">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </ErrorBoundary>
  );
}
