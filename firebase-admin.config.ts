import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

export const getAdminDb = () => admin.firestore();
export const getAdminAuth = () => admin.auth();