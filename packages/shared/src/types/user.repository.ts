import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../../../../src/services/firebase";
import { UserProfile } from "@totem/shared/types/auth";

export const userRepository = {
  async getById(uid: string): Promise<UserProfile | null> {
    const docRef = doc(firestore, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        uid: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as UserProfile;
    }
    return null;
  },

  async create(profile: Omit<UserProfile, "createdAt">): Promise<void> {
    try {
      const docRef = doc(firestore, "users", profile.uid);
      await setDoc(docRef, {
        ...profile,
        createdAt: serverTimestamp(),
      });
      console.log("✅ Usuário criado no Firestore:", profile.uid);
    } catch (error) {
      console.error("🔥 Erro ao criar usuário no Firestore:", error);
      throw error;
    }
  }
};