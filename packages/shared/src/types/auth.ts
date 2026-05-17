export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'staff' | 'user';
  companyId: string;
}