"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/src/services/firebase";
import { userRepository } from "@totem/shared/types/user.repository";
import { UserProfile } from "@totem/shared/types/auth";
import { logger } from "@/src/lib/logger";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      try {
        const profile = await userRepository.getById(auth.currentUser.uid);
        setUser(profile);
      } catch (error) {
        logger.error("AuthProvider", "Erro ao atualizar perfil", error);
      }
    }
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      logger.error("AuthProvider", "Erro ao sair", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = await userRepository.getById(firebaseUser.uid);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        logger.error("AuthProvider", "Erro ao carregar perfil", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    logger.error("AuthProvider", "useAuth usado fora de AuthProvider");
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
