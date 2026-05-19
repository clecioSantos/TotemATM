import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// No Vercel, usar /tmp para arquivos temporários
const uploadFolder = process.env.VERCEL 
  ? path.join(process.env.TMP || '/tmp', 'uploads')
  : path.resolve(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

export const saveFile = async (file: {
  buffer: Buffer;
  originalname: string;
}): Promise<string> => {
  const fileHash = crypto.randomBytes(10).toString('hex');
  const fileName = `${fileHash}-${file.originalname.replace(/\s/g, '_')}`;
  const filePath = path.join(uploadFolder, fileName);

  await fs.promises.writeFile(filePath, file.buffer);
  
  // Retorna o caminho relativo (ex: /uploads/nome_arquivo.jpg)
  return `/uploads/${fileName}`;
};

export const deleteFile = async (fileUrl: string | undefined): Promise<void> => {
  if (!fileUrl) return;

  try {
    const fileName = fileUrl.split('/').pop();
    if (fileName) {
      const filePath = path.join(uploadFolder, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
  }
};
