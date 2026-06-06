import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const missing: string[] = [];
    if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
    const msg = `Cloudinary config ausente: ${missing.join(', ')}`;
    logger.error('CLOUDINARY', msg);
    throw new Error(msg);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  configured = true;
  logger.info('CLOUDINARY', 'Cloudinary configurado sob demanda', {
    cloud_name: cloudName,
  });
}

export const CLOUDINARY_FOLDER = (() => {
  return process.env.CLOUDINARY_FOLDER || 'nexorder';
})();

export function getCloudinary(): typeof cloudinary {
  ensureConfigured();
  return cloudinary;
}

export { cloudinary };
