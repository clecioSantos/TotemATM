import * as admin from 'firebase-admin';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class FirebaseAdminConfig implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        // databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }
  }

  getFirestore() {
    return admin.firestore();
  }
}