import { v2 as cloudinary } from 'cloudinary';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER: CLOUDINARY_FOLDER_ENV,
} = process.env;

function configureCloudinary() {
  if (cloudinary.config().cloud_name) return;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('🔴 cloudinary.ts - Cloudinary env vars missing, will retry on first use');
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured for cloud:', CLOUDINARY_CLOUD_NAME);
}

function ensureCloudinary() {
  configureCloudinary();
  if (!cloudinary.config().cloud_name) {
    throw new Error(
      'Cloudinary não configurado: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    );
  }
}

export const CLOUDINARY_FOLDER = CLOUDINARY_FOLDER_ENV || 'nexorder';
export { cloudinary, ensureCloudinary };