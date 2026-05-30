import { Timestamp } from "firebase/firestore";

export type UserRole = 'admin' | 'client' | 'owner';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date | Timestamp;
  companyId?: string; // Mantido para compatibilidade futura
}

export type AuthError = { code: string; message: string };