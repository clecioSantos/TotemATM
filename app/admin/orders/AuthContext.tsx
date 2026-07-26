"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../../src/services/firebase";
import { firestore } from "../../../src/services/firebase";
import { doc, getDoc } from "firebase/firestore";
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUser(profile);
            document.cookie = `user-role=${profile.role}; path=/; max-age=432000; sameSite=lax`;
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || "Administrador",
              role: 'admin',
              companyId: 'default',
              createdAt: new Date().toISOString()
            } as unknown as UserProfile);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("🔥 Erro no onAuthStateChanged:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setUser(null);
      await auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("🔥 Erro ao fazer logout:", error);
    }
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
