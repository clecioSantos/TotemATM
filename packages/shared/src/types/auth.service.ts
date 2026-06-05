import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User
} from "firebase/auth";
import { auth } from "../../../../src/services/firebase";
import { userRepository } from "@totem/shared/types/user.repository";
import { UserProfile, UserRole } from "@totem/shared/types/auth";

export const authService = {
  async login(email: string, pass: string): Promise<UserProfile> {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, pass);
      
      await this.setSession(user);
      const profile = await userRepository.getById(user.uid);
      
      if (!profile) throw new Error("Perfil de usuário não encontrado.");
      
      return profile;
    } catch (error) {
      console.error("🔥 Erro no login:", error);
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
        role: role
      };

      await userRepository.create(profile);
      await this.setSession(user);

      return { ...profile, createdAt: new Date() };
    } catch (error) {
      console.error("🔥 Erro no registro:", error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("🔥 Erro no signOut:", error);
    }
  },

  async setSession(user: User): Promise<any> {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      return res.json();
    } catch (error) {
      console.error("🔥 Erro ao definir sessão:", error);
      throw error;
    }
  }
};