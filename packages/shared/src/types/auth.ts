import { Timestamp } from "firebase/firestore";

export type UserRole = 'admin' | 'client' | 'owner' | 'collaborator';

export interface StorePermissions {
  editProducts: boolean;
  editOrders: boolean;
  editSettings: boolean;
  manageUsers: boolean;
  viewReports: boolean;
  manageCoupons: boolean;
  manageCategories: boolean;
  manageFlavors: boolean;
  manageCondiments: boolean;
  manageAddresses: boolean;
  manageReviews: boolean;
}

export const defaultStorePermissions: StorePermissions = {
  editProducts: false,
  editOrders: false,
  editSettings: false,
  manageUsers: false,
  viewReports: false,
  manageCoupons: false,
  manageCategories: false,
  manageFlavors: false,
  manageCondiments: false,
  manageAddresses: false,
  manageReviews: false,
};

export const adminStorePermissions: StorePermissions = {
  editProducts: true,
  editOrders: true,
  editSettings: true,
  manageUsers: true,
  viewReports: true,
  manageCoupons: true,
  manageCategories: true,
  manageFlavors: true,
  manageCondiments: true,
  manageAddresses: true,
  manageReviews: true,
};

export interface StoreUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'collaborator';
  permissions: StorePermissions;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date | Timestamp;
  companyId?: string;
}

export type AuthError = { code: string; message: string };

export function computeStoreIds(users: StoreUser[]): { userIds: string[]; adminIds: string[] } {
  return {
    userIds: users.map(u => u.uid),
    adminIds: users.filter(u => u.role === 'admin').map(u => u.uid),
  };
}