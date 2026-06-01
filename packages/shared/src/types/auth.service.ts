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
    const { user } = await signInWithEmailAndPassword(auth, email, pass);
    
    // Sincroniza sessão e claims no servidor
    const response = await this.setSession(user);
    const profile = await userRepository.getById(user.uid);
    
    if (!profile) throw new Error("Perfil de usuário não encontrado.");
    
    return profile;
  },

  async register(email: string, pass: string, name: string, role: UserRole): Promise<UserProfile> {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    
    const profile: Omit<UserProfile, "createdAt"> = {
      uid: user.uid,
      email: email,
      name: name,
      role: role
    };

    await userRepository.create(profile);
    await this.setSession(user); // Define claims e cookie no registro

    return { ...profile, createdAt: new Date() };
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
  },

  async setSession(user: User): Promise<any> {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
    return res.json();
  }
};