import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER: CLOUDINARY_FOLDER_ENV,
} = process.env;

logger.info('CLOUDINARY', 'Verificando configuração do Cloudinary', {
  hasCloudName: !!CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!CLOUDINARY_API_KEY,
  hasApiSecret: !!CLOUDINARY_API_SECRET,
  hasFolder: !!CLOUDINARY_FOLDER_ENV,
  nodeEnv: process.env.NODE_ENV,
});

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  logger.error(
    'CLOUDINARY',
    'Variáveis de ambiente Cloudinary ausentes'
  );
  throw new Error(
    'Cloudinary environment variables not set: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
  );
}

try {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  logger.info('CLOUDINARY', 'Cloudinary configurado com sucesso', {
    cloud_name: CLOUDINARY_CLOUD_NAME,
  });
} catch (error) {
  logger.error('CLOUDINARY', 'Erro ao configurar Cloudinary', error);
  throw error;
}

export const CLOUDINARY_FOLDER = CLOUDINARY_FOLDER_ENV || 'nexorder';
export { cloudinary };
