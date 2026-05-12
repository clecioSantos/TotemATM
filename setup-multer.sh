#!/bin/bash
# Configuração do Multer para o backend do NexOrder

# 1. Instalação das dependências no backend/api
echo "📦 Instalando Multer no backend/api..."
cd "c:/Users/Clecio Santos/Desktop/Projetos/TotemATM/backend/api" || exit
npm install multer
npm install -D @types/multer

# 2. Criação do arquivo de configuração e diretório de uploads
echo "📂 Criando estrutura de pastas e configuração..."
mkdir -p src/config
mkdir -p uploads

cat <<'CONFIG_EOF' > src/config/multer.ts
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const fileHash = crypto.randomBytes(10).toString('hex');
    const fileName = `${fileHash}-${file.originalname}`;
    cb(null, fileName);
  },
});

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

export const upload = multer(uploadConfig);
CONFIG_EOF

echo "✅ Multer configurado com sucesso em src/config/multer.ts"