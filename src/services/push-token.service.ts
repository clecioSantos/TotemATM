import { doc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";
import { firestore } from "./firebase";
import { logger } from "@/src/lib/logger";

interface PushTokenDoc {
  uid: string;
  role: string;
  token: string;
  platform: "android" | "web";
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeenAt: Timestamp;
}

export const pushTokenService = {
  async saveToken(uid: string, role: string, token: string, platform: "android" | "web"): Promise<void> {
    try {
      const q = query(collection(firestore, "push_tokens"), where("token", "==", token));
      const existing = await getDocs(q);

      if (!existing.empty) {
        const docRef = existing.docs[0].ref;
        await updateDoc(docRef, {
          uid,
          role,
          active: true,
          platform,
          updatedAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
        });
        logger.info("PUSH_TOKEN", "Token atualizado", { uid, token: token.slice(0, 16) + "..." });
      } else {
        await setDoc(doc(collection(firestore, "push_tokens")), {
          uid,
          role,
          token,
          platform,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
        });
        logger.info("PUSH_TOKEN", "Token registrado", { uid, token: token.slice(0, 16) + "..." });
      }
    } catch (error) {
      logger.error("PUSH_TOKEN", "Erro ao salvar token", error);
    }
  },

  async disableToken(token: string): Promise<void> {
    try {
      const q = query(collection(firestore, "push_tokens"), where("token", "==", token));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await updateDoc(d.ref, { active: false, updatedAt: serverTimestamp() });
      });
      logger.info("PUSH_TOKEN", "Token desativado", { token: token.slice(0, 16) + "..." });
    } catch (error) {
      logger.error("PUSH_TOKEN", "Erro ao desativar token", error);
    }
  },

  async disableAllForUser(uid: string): Promise<void> {
    try {
      const q = query(collection(firestore, "push_tokens"), where("uid", "==", uid), where("active", "==", true));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await updateDoc(d.ref, { active: false, updatedAt: serverTimestamp() });
      });
      logger.info("PUSH_TOKEN", "Tokens desativados para usuário", { uid });
    } catch (error) {
      logger.error("PUSH_TOKEN", "Erro ao desativar tokens do usuário", error);
    }
  },

  async getTokensForUser(uid: string): Promise<string[]> {
    try {
      const q = query(collection(firestore, "push_tokens"), where("uid", "==", uid), where("active", "==", true));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data().token as string);
    } catch (error) {
      logger.error("PUSH_TOKEN", "Erro ao buscar tokens", error);
      return [];
    }
  },

  async getTokensForCompany(companyId: string): Promise<string[]> {
    try {
      const q = query(collection(firestore, "push_tokens"), where("companyId", "==", companyId), where("active", "==", true));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data().token as string);
    } catch (error) {
      logger.error("PUSH_TOKEN", "Erro ao buscar tokens da loja", error);
      return [];
    }
  },
};
