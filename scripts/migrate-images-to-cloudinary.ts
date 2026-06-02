/**
 * Migrate images referenced in Firestore products to Cloudinary.
 * - Finds products with imageUrl pointing to local uploads or localhost
 * - Reads the image from local disk or via HTTP if localhost
 * - Uploads to Cloudinary and updates Firestore product.imageUrl with secure URL
 *
 * Usage:
 * CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... \
 * FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY='-----BEGIN...\n...\n-----END PRIVATE KEY-----' \
 * npx ts-node scripts/migrate-images-to-cloudinary.ts
 */

import * as admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';

// Helper to fetch remote file as Buffer
async function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`HTTP error ${res.statusCode}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function readLocalUpload(fileName: string): Promise<Buffer> {
  const candidates = [
    path.resolve(process.cwd(), 'backend', 'api', 'uploads', fileName),
    path.resolve(process.cwd(), 'apps', 'public', 'uploads', fileName),
    path.resolve(process.cwd(), 'apps', 'uploads', fileName),
    path.resolve(process.cwd(), 'uploads', fileName),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return fs.promises.readFile(p);
    }
  }

  throw new Error('Local file not found in known upload folders');
}

function extractFileNameFromUrl(url: string): string | null {
  try {
    const u = new URL(url, 'http://localhost');
    return u.pathname.split('/').pop() || null;
  } catch {
    return null;
  }
}

async function uploadToCloudinary(buffer: Buffer, filename: string) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: process.env.CLOUDINARY_FOLDER || 'nexorder', public_id: undefined },
      (err, res) => {
        if (err) return reject(err);
        if (!res) return reject(new Error('No response from Cloudinary'));
        resolve({ secure_url: res.secure_url, public_id: res.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function main() {
  // Validate env
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Missing Cloudinary env vars. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    process.exit(1);
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('Missing Firebase admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  // Init Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Init Firebase Admin
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  console.log(privateKey);
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    } as any),
  });

  const db = admin.firestore();

  console.log('Fetching products...');
  const snapshot = await db.collection('products').get();
  console.log(`Found ${snapshot.size} products`);

  let migrated = 0;
  for (const doc of snapshot.docs) {
    const data: any = doc.data();
    const imageUrl: string | undefined = data.imageUrl;
    if (!imageUrl) continue;

    // Skip Cloudinary or remote non-local URLs
    if (imageUrl.includes('res.cloudinary.com') || imageUrl.startsWith('http') && !imageUrl.includes('localhost') ) {
      console.log(`Skipping ${doc.id} (already remote): ${imageUrl}`);
      continue;
    }

    try {
      console.log(`Processing ${doc.id}: ${imageUrl}`);
      let buffer: Buffer | null = null;
      if (imageUrl.startsWith('http') && imageUrl.includes('localhost')) {
        // fetch from localhost URL
        buffer = await fetchBuffer(imageUrl);
      } else if (imageUrl.startsWith('/uploads') || imageUrl.includes('/uploads/')) {
        const fileName = extractFileNameFromUrl(imageUrl) as string;
        buffer = await readLocalUpload(fileName);
      } else {
        console.log(`Unknown imageUrl format for ${doc.id}, skipping: ${imageUrl}`);
        continue;
      }

      if (!buffer) {
        console.warn(`No buffer for ${doc.id}, skipping`);
        continue;
      }

      const fileName = extractFileNameFromUrl(imageUrl) || `product_${doc.id}`;
      const res = await uploadToCloudinary(buffer, fileName!);

      await db.collection('products').doc(doc.id).update({ imageUrl: res.secure_url });
      console.log(`Migrated ${doc.id} → ${res.secure_url}`);
      migrated++;
    } catch (err) {
      console.error(`Failed ${doc.id}:`, err);
    }
  }

  console.log(`\nDone. Migrated ${migrated} images.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
