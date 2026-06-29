import { doc, setDoc, collection, addDoc, serverTimestamp, deleteDoc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";
import { createAuditLog } from "./audit-log";

export type DeletionStatus = "requested" | "approved" | "rejected" | "completed";

export interface DeletionRequest {
  userId: string;
  userName: string;
  userEmail: string;
  status: DeletionStatus;
  requestedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reason?: string;
}

export async function requestAccountDeletion(userId: string, userName: string, userEmail: string): Promise<void> {
  await addDoc(collection(firestore, "deletion_requests"), {
    userId,
    userName,
    userEmail,
    status: "requested",
    requestedAt: serverTimestamp(),
  });

  await createAuditLog({
    usuario: userId,
    acao: "exclusao_solicitada",
    tipo: "exclusao",
    detalhes: `Usuário ${userName} (${userEmail}) solicitou exclusão de conta.`,
  });
}

export async function executeAccountDeletion(userId: string): Promise<void> {
  const batch = writeBatch(firestore);

  batch.delete(doc(firestore, "users", userId));

  const addressesSnap = await getDocs(
    query(collection(firestore, "addresses"), where("userId", "==", userId))
  );
  addressesSnap.docs.forEach(d => batch.delete(d.ref));

  const pushTokensSnap = await getDocs(
    query(collection(firestore, "push_tokens"), where("uid", "==", userId))
  );
  pushTokensSnap.docs.forEach(d => batch.delete(d.ref));

  const notificationsSnap = await getDocs(
    query(collection(firestore, "notifications"), where("userId", "==", userId))
  );
  notificationsSnap.docs.forEach(d => batch.delete(d.ref));

  await batch.commit();

  await createAuditLog({
    usuario: userId,
    acao: "exclusao_executada",
    tipo: "exclusao",
    detalhes: "Dados pessoais, endereços, tokens e notificações removidos.",
  });
}

export async function anonimizeUserData(userId: string): Promise<void> {
  const { updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(firestore, "users", userId), {
    name: "[USUÁRIO REMOVIDO]",
    email: `removido-${userId.slice(0, 8)}@boradedelivery.com`,
    phone: "",
    cpf: "",
    birthDate: "",
    photoURL: "",
    internalNotes: "",
    favorites: {},
    anonimizedAt: serverTimestamp(),
  });

  await createAuditLog({
    usuario: userId,
    acao: "exclusao_executada",
    tipo: "exclusao",
    detalhes: "Dados pessoais anonimizados. Registros financeiros preservados.",
  });
}
