import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const saveFile = async (file: {
  buffer: Buffer;
  originalname: string;
}): Promise<{ imageUrl: string; publicId: string }> => {
  // Validate configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment variables not set: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: process.env.CLOUDINARY_FOLDER || 'nexorder' },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No result from Cloudinary'));
        resolve({ imageUrl: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(file.buffer);
  });
};

export const deleteFile = async (fileUrlOrPublicId: string | undefined): Promise<void> => {
  if (!fileUrlOrPublicId) return;

  try {
    // If it's a Cloudinary URL, extract the public_id
    if (fileUrlOrPublicId.includes('res.cloudinary.com')) {
      // Example URL: https://res.cloudinary.com/<cloud>/image/upload/v123456/folder/name.jpg
      const m = fileUrlOrPublicId.match(/\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
      const publicId = m ? m[1] : null;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        return;
      }
    }

    // If it's already a public id, try destroy directly
    await cloudinary.uploader.destroy(fileUrlOrPublicId);
  } catch (error) {
    console.error('Erro ao deletar arquivo na Cloudinary:', error);
  }
};
