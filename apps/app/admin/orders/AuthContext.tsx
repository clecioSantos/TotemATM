"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../../src/services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { UserProfile } from "@totem/shared/types/auth";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || "Administrador",
          role: 'admin', // Em produção, buscaríamos isso do custom claims ou Firestore
          companyId: 'default',
          createdAt: new Date().toISOString()
        } as unknown as UserProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    setUser(null);
    await auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};