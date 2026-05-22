import { v2 as cloudinary } from 'cloudinary';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER: CLOUDINARY_FOLDER_ENV,
} = process.env;

console.log('🔍 cloudinary.ts - Checking environment variables at import time');
console.log('🔍 cloudinary.ts - ENV state:', {
  hasCloudName: !!CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!CLOUDINARY_API_KEY,
  hasApiSecret: !!CLOUDINARY_API_SECRET,
  hasFolder: !!CLOUDINARY_FOLDER_ENV,
  cloudNameValue: CLOUDINARY_CLOUD_NAME ? `${CLOUDINARY_CLOUD_NAME.slice(0, 5)}...` : 'missing',
  nodeEnv: process.env.NODE_ENV,
});

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('🔴 cloudinary.ts - FATAL: Missing required environment variables!');
  throw new Error(
    'Cloudinary environment variables not set: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
  );
}

console.log('🔍 cloudinary.ts - Configuring cloudinary with cloud_name:', CLOUDINARY_CLOUD_NAME);
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});
console.log('✅ cloudinary.ts - Cloudinary configured successfully');
// Safe debug: log only the cloud name (never log keys/secrets)
console.log('🔍 Cloudinary configured for cloud:', CLOUDINARY_CLOUD_NAME);

export const CLOUDINARY_FOLDER = CLOUDINARY_FOLDER_ENV || 'nexorder';
export { cloudinary };