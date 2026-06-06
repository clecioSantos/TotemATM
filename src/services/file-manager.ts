import { getCloudinary, CLOUDINARY_FOLDER } from '../lib/cloudinary';
import { logger } from '../lib/logger';

export const saveFile = async (file: {
  buffer: Buffer;
  originalname: string;
}): Promise<{ imageUrl: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const fileInfo = {
      originalname: file.originalname,
      bufferLength: file.buffer?.length ?? 0,
      folder: CLOUDINARY_FOLDER,
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
    };

    logger.info('FILE_MANAGER', 'Iniciando upload', fileInfo);

    const uploadOptions: any = {
      folder: CLOUDINARY_FOLDER,
      resource_type: 'auto',
      timeout: 60000,
    };

    let cloudinary;
    try {
      cloudinary = getCloudinary();
    } catch (err) {
      logger.error('FILE_MANAGER', 'Cloudinary não configurado', err);
      return reject(err);
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          const errObj = error as any;
          logger.error('FILE_MANAGER', 'Upload falhou', error, {
            http_code: errObj.http_code ?? errObj.statusCode ?? null,
          });
          return reject(error);
        }

        if (!result) {
          logger.error('FILE_MANAGER', 'Cloudinary retornou resultado nulo');
          return reject(new Error('No result from Cloudinary'));
        }

        logger.info('FILE_MANAGER', 'Upload bem-sucedido', {
          public_id: result.public_id,
          bytes: result.bytes,
        });

        resolve({ imageUrl: result.secure_url, publicId: result.public_id });
      }
    );

    stream.on('error', (streamError) => {
      logger.error('FILE_MANAGER', 'Erro no stream de upload', streamError);
      reject(streamError);
    });

    try {
      stream.end(file.buffer);
    } catch (err) {
      logger.error('FILE_MANAGER', 'Erro ao escrever buffer no stream', err);
      reject(err);
    }
  });
};

export const deleteFile = async (fileUrlOrPublicId: string | undefined): Promise<void> => {
  if (!fileUrlOrPublicId) {
    logger.warn('FILE_MANAGER', 'deleteFile chamado sem URL/publicId');
    return;
  }

  const cloudinaryUrlRegex = /\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
  const match = fileUrlOrPublicId.match(cloudinaryUrlRegex);

  let cloudinary;
  try {
    cloudinary = getCloudinary();
  } catch {
    logger.warn('FILE_MANAGER', 'Cloudinary não configurado, pulando deleção');
    return;
  }

  try {
    if (match?.[1]) {
      await cloudinary.uploader.destroy(match[1]);
      logger.info('FILE_MANAGER', `Arquivo deletado: ${match[1]}`);
      return;
    }

    if (!fileUrlOrPublicId.startsWith('http')) {
      await cloudinary.uploader.destroy(fileUrlOrPublicId);
      logger.info('FILE_MANAGER', `Arquivo deletado: ${fileUrlOrPublicId}`);
      return;
    }

    logger.warn('FILE_MANAGER', `URL não suportada para deleção: ${fileUrlOrPublicId}`);
  } catch (error) {
    logger.error('FILE_MANAGER', `Erro ao deletar arquivo: ${fileUrlOrPublicId}`, error);
  }
};
