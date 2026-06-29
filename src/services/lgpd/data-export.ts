import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

export interface ExportedUserData {
  exportedAt: string;
  user: Record<string, any>;
  addresses: any[];
  orders: any[];
  consents: Record<string, any>;
}

export async function exportUserData(userId: string): Promise<ExportedUserData> {
  const userSnap = await getDoc(doc(firestore, "users", userId));
  if (!userSnap.exists()) throw new Error("Usuário não encontrado");

  const userData = userSnap.data();

  const addressesQuery = query(
    collection(firestore, "addresses"),
    where("userId", "==", userId)
  );
  const addressesSnap = await getDocs(addressesQuery);
  const addresses = addressesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const ordersQuery = query(
    collection(firestore, "orders"),
    where("customerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const ordersSnap = await getDocs(ordersQuery);
  const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return {
    exportedAt: new Date().toISOString(),
    user: {
      uid: userData.uid,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      cpf: userData.cpf,
      birthDate: userData.birthDate,
      role: userData.role,
      photoURL: userData.photoURL,
      provider: userData.provider,
      createdAt: userData.createdAt,
      totalOrders: userData.totalOrders,
      totalSpent: userData.totalSpent,
      favorites: userData.favorites,
      acceptedTerms: userData.acceptedTerms,
      acceptedPrivacyPolicy: userData.acceptedPrivacyPolicy,
      termsVersion: userData.termsVersion,
      privacyVersion: userData.privacyVersion,
      acceptedAt: userData.acceptedAt,
    },
    addresses,
    orders,
    consents: {
      acceptedTerms: userData.acceptedTerms,
      acceptedPrivacyPolicy: userData.acceptedPrivacyPolicy,
      termsVersion: userData.termsVersion,
      privacyVersion: userData.privacyVersion,
      acceptedAt: userData.acceptedAt,
      acceptanceSource: userData.acceptanceSource,
    },
  };
}
