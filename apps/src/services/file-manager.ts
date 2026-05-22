import { cloudinary, CLOUDINARY_FOLDER } from '@/src/lib/cloudinary';

export const saveFile = async (file: {
  buffer: Buffer;
  originalname: string;
}): Promise<{ imageUrl: string; publicId: string }> => {
  return await cloudinary.api.ping();
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
