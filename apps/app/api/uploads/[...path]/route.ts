import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as pathModule from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const uploadFolder = process.env.VERCEL 
      ? pathModule.join(process.env.TMP || '/tmp', 'uploads')
      : pathModule.resolve(process.cwd(), 'public', 'uploads');

    const filePath = pathArray.join('/');
    const fullPath = pathModule.join(uploadFolder, filePath);

    // Validar que o caminho está dentro da pasta de uploads
    if (!fullPath.startsWith(uploadFolder)) {
      return new NextResponse('Acesso negado', { status: 403 });
    }

    // Verificar se o arquivo existe
    if (!fs.existsSync(fullPath)) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    // Ler e retornar o arquivo
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Inferir tipo MIME
    const ext = pathModule.extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    return new NextResponse('Erro ao servir arquivo', { status: 500 });
  }
}
