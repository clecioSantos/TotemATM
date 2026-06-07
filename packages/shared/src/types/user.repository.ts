import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../../../../src/services/firebase";
import { UserProfile } from "@totem/shared/types/auth";
import { logger } from "@/src/lib/logger";

export const userRepository = {
  async getById(uid: string): Promise<UserProfile | null> {
    try {
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
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("userRepository", `Erro ao buscar usuário ${uid}: ${errMsg}`, error);
      return null;
    }
  },

  async create(profile: Omit<UserProfile, "createdAt">): Promise<void> {
    try {
      const docRef = doc(firestore, "users", profile.uid);
      await setDoc(docRef, {
        ...profile,
        createdAt: serverTimestamp(),
      });
      logger.info("userRepository", `Usuário criado: ${profile.uid}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("userRepository", `Erro ao criar usuário ${profile.uid}: ${errMsg}`, error);
      throw error;
    }
  },

  async update(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(firestore, "users", uid);
      await updateDoc(docRef, data);
      logger.info("userRepository", `Usuário atualizado: ${uid}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("userRepository", `Erro ao atualizar usuário ${uid}: ${errMsg}`, error);
      throw error;
    }
  },
};
