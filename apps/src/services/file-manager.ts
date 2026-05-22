import { cloudinary, CLOUDINARY_FOLDER } from '@/src/lib/cloudinary';

export const saveFile = async (file: {
  buffer: Buffer;
  originalname: string;
}): Promise<{ imageUrl: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const fileInfo = {
      originalname: file.originalname,
      bufferLength: file.buffer?.length ?? 0,
      bufferType: file.buffer?.constructor?.name ?? 'unknown',
      folder: CLOUDINARY_FOLDER,
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    };

    console.log('🔍 saveFile - starting upload with details:', fileInfo);

    const uploadOptions: any = {
      folder: CLOUDINARY_FOLDER,
      // Force detailed error response from Cloudinary
      resource_type: 'auto',
      timeout: 60000, // 60 second timeout
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          const e: any = error;
          const errorDetails = {
            name: e.name ?? 'unknown',
            message: typeof e.message === 'string' ? e.message.slice(0, 500) : String(e.message),
            http_code: e.http_code ?? e.statusCode ?? null,
            http_body: e.http_body ? String(e.http_body).slice(0, 500) : undefined,
            fullErrorKeys: Object.keys(e).slice(0, 20),
          };

          console.error('🔴 saveFile - Upload failed with error:', errorDetails);
          console.error('🔴 saveFile - Full error stack:', e.stack ?? 'no stack');

          // Log entire error object for inspection
          if (typeof e === 'object') {
            try {
              console.error('🔴 saveFile - Error object JSON:', JSON.stringify(e, null, 2).slice(0, 1000));
            } catch (jsonErr) {
              console.error('🔴 saveFile - Could not stringify error:', jsonErr);
            }
          }

          return reject(error);
        }

        if (!result) {
          console.error('🔴 saveFile - Cloudinary returned no result (result is null/undefined)');
          return reject(new Error('No result from Cloudinary'));
        }

        console.log('✅ saveFile - Upload successful:', {
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });

        resolve({ imageUrl: result.secure_url, publicId: result.public_id });
      }
    );

    // Log stream setup
    console.log('🔍 saveFile - stream created, about to write buffer of', file.buffer.length, 'bytes');

    // Handle stream errors before calling end()
    stream.on('error', (streamError) => {
      console.error('🔴 saveFile - stream emitted error event:', streamError);
      reject(streamError);
    });

    try {
      stream.end(file.buffer);
      console.log('🔍 saveFile - buffer written to stream, waiting for response...');
    } catch (err) {
      console.error('🔴 saveFile - Error calling stream.end():', err);
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
