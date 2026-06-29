import { collection, doc, getDoc, getDocs, setDoc, addDoc, query, orderBy, limit, Timestamp, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

export interface LegalDocument {
  id: string;
  titulo: string;
  conteudo: string;
  versao: number;
  dataCriacao: Timestamp;
  dataAtualizacao: Timestamp;
  ativo: boolean;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  titulo: string;
  conteudo: string;
  versao: number;
  dataCriacao: Timestamp;
}

export interface UserConsent {
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  acceptedCookies: boolean;
  termsVersion: number;
  privacyVersion: number;
  cookiesVersion: number;
  acceptedAt: Timestamp;
  acceptanceSource: "register" | "login" | "reauth";
  deviceInfo?: string;
}

export const LEGAL_DOCUMENTS = {
  TERMOS_USO: "termos_uso",
  POLITICA_PRIVACIDADE: "politica_privacidade",
  POLITICA_COOKIES: "politica_cookies",
};

export async function getActiveDocument(documentId: string): Promise<LegalDocument | null> {
  const q = query(
    collection(firestore, "legal_documents", documentId, "versions"),
    limit(20)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docs = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as LegalDocument))
    .filter(d => d.ativo)
    .sort((a, b) => b.versao - a.versao);
  return docs[0] || null;
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const q = query(
    collection(firestore, "legal_documents", documentId, "versions"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, documentId, ...d.data() } as DocumentVersion))
    .sort((a, b) => b.versao - a.versao);
}

export async function publishDocument(documentId: string, titulo: string, conteudo: string, versao: number): Promise<void> {
  await addDoc(collection(firestore, "legal_documents", documentId, "versions"), {
    titulo,
    conteudo,
    versao,
    dataCriacao: serverTimestamp(),
    ativo: true,
  });
}

export async function getUserConsent(userId: string): Promise<UserConsent | null> {
  const snap = await getDoc(doc(firestore, "users", userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data.acceptedTerms) return null;
  return {
    acceptedTerms: data.acceptedTerms || false,
    acceptedPrivacyPolicy: data.acceptedPrivacyPolicy || false,
    acceptedCookies: data.acceptedCookies || false,
    termsVersion: data.termsVersion || 0,
    privacyVersion: data.privacyVersion || 0,
    cookiesVersion: data.cookiesVersion || 0,
    acceptedAt: data.acceptedAt,
    acceptanceSource: data.acceptanceSource || "register",
    deviceInfo: data.deviceInfo,
  };
}

export async function saveUserConsent(userId: string, consent: UserConsent): Promise<void> {
  const data: any = {
    acceptedTerms: consent.acceptedTerms,
    acceptedPrivacyPolicy: consent.acceptedPrivacyPolicy,
    acceptedCookies: consent.acceptedCookies,
    termsVersion: consent.termsVersion,
    privacyVersion: consent.privacyVersion,
    cookiesVersion: consent.cookiesVersion,
    acceptedAt: serverTimestamp(),
    acceptanceSource: consent.acceptanceSource,
  };
  if (consent.deviceInfo) data.deviceInfo = consent.deviceInfo;
  const { setDoc, doc } = await import("firebase/firestore");
  await setDoc(doc(firestore, "users", userId), data, { merge: true });
}

export async function checkConsentRequired(userId: string): Promise<{
  terms: boolean;
  privacy: boolean;
  cookies: boolean;
} | null> {
  const consent = await getUserConsent(userId);
  const currentTerms = await getActiveDocument(LEGAL_DOCUMENTS.TERMOS_USO);
  const currentPrivacy = await getActiveDocument(LEGAL_DOCUMENTS.POLITICA_PRIVACIDADE);
  const currentCookies = await getActiveDocument(LEGAL_DOCUMENTS.POLITICA_COOKIES);

  if (!consent) return { terms: true, privacy: true, cookies: true };

  return {
    terms: currentTerms ? consent.termsVersion < currentTerms.versao : false,
    privacy: currentPrivacy ? consent.privacyVersion < currentPrivacy.versao : false,
    cookies: currentCookies ? consent.cookiesVersion < currentCookies.versao : false,
  };
}
