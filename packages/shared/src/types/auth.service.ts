import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User
} from "firebase/auth";
import { auth } from "../../../../src/services/firebase";
import { userRepository } from "@totem/shared/types/user.repository";
import { UserProfile, UserRole } from "@totem/shared/types/auth";
import { logger } from "@/src/lib/logger";

export const authService = {
  async login(email: string, pass: string): Promise<UserProfile> {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, pass);
      const response = await this.setSession(user);
      const profile = await userRepository.getById(user.uid);

      if (!profile) {
        throw new Error("Perfil de usuário não encontrado.");
      }

      logger.info("authService", `Login bem-sucedido: ${user.uid}`);
      return profile;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("authService", `Erro no login: ${errMsg}`, error);
      throw error;
    }
  },

  async register(email: string, pass: string, name: string, role: UserRole): Promise<UserProfile> {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, pass);

      const profile: Omit<UserProfile, "createdAt"> = {
        uid: user.uid,
        email: email,
        name: name,
        role: role,
      };

      await userRepository.create(profile);
      await this.setSession(user);

      logger.info("authService", `Registro bem-sucedido: ${user.uid}`);
      return { ...profile, createdAt: new Date() };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("authService", `Erro no registro: ${errMsg}`, error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      await fetch("/api/auth/logout", { method: "POST" });
      logger.info("authService", "Logout realizado");
    } catch (error) {
      logger.error("authService", "Erro no logout", error);
    }
  },

  async setSession(user: User): Promise<any> {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        logger.warn("authService", "Resposta não-ok ao criar sessão", undefined, {
          status: res.status,
        });
      }

      return res.json();
    } catch (error) {
      logger.error("authService", "Erro ao criar sessão", error);
      throw error;
    }
  },
};
