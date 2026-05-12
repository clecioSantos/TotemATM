import * as multer from 'multer';

// Usamos memoryStorage para que o arquivo fique disponível em file.buffer
const storage = (multer.default || multer).memoryStorage();

export const uploadConfig = {
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido. Use JPEG, PNG ou WebP.'));
    }
  }
};

export const upload = (multer.default || multer)(uploadConfig);
