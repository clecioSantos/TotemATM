import { cloudinary, CLOUDINARY_FOLDER } from '@/src/lib/cloudinary';

export const saveFile = async (file: {
  buffer: Buffer;
  originalname: string;
}): Promise<{ imageUrl: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    console.log('🔍 saveFile - starting upload', {
      originalname: file.originalname,
      bufferLength: file.buffer?.length ?? 0,
      folder: CLOUDINARY_FOLDER,
    });

    const stream = cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDER },
      (error, result) => {
        if (error) {
          // Cloudinary sometimes returns HTML error pages when the upstream fails;
          // log detailed fields (but never log API secrets)
          const e: any = error;
          console.error('🔴 saveFile - Cloudinary error summary:', {
            name: e.name,
            messageSnippet: typeof e.message === 'string' ? e.message.slice(0, 1000) : String(e.message),
            http_code: e.http_code ?? e.statusCode ?? null,
            http_body: (e.http_body && typeof e.http_body === 'string') ? e.http_body.slice(0, 1000) : undefined,
          });
          console.error('🔴 saveFile - Cloudinary full error object:', error);
          return reject(error);
        }
        if (!result) {
          console.error('🔴 saveFile - Cloudinary returned no result');
          return reject(new Error('No result from Cloudinary'));
        }

        console.log('✅ saveFile - Cloudinary result:', {
          secure_url: result.secure_url,
          public_id: result.public_id,
        });

        resolve({ imageUrl: result.secure_url, publicId: result.public_id });
      }
    );

    try {
      stream.end(file.buffer);
    } catch (err) {
      console.error('🔴 saveFile - stream.end error:', err);
      reject(err);
    }
  });
};

export const deleteFile = async (fileUrlOrPublicId: string | undefined): Promise<void> => {
  if (!fileUrlOrPublicId) return;

  const cloudinaryUrlRegex = /\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
  const match = fileUrlOrPublicId.match(cloudinaryUrlRegex);

  try {
    if (match?.[1]) {
      await cloudinary.uploader.destroy(match[1]);
      return;
    }

    if (!fileUrlOrPublicId.startsWith('http')) {
      await cloudinary.uploader.destroy(fileUrlOrPublicId);
      return;
    }

    console.warn('deleteFile skipped unsupported URL:', fileUrlOrPublicId);
  } catch (error) {
    console.error('Erro ao deletar arquivo na Cloudinary:', error);
  }
};
