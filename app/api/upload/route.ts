import { NextRequest, NextResponse } from 'next/server';
import { saveFile, deleteFile } from '../../../src/services/file-manager';
import { logger } from '@/src/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    logger.info("API_UPLOAD", "Requisição de upload iniciada");

    const formData = await request.formData().catch(() => null);

    if (!formData) {
      return NextResponse.json(
        { success: false, error: 'FormData inválido' },
        { status: 400 }
      );
    }

    const file = formData.get('image');
    const oldImageUrl = formData.get('oldImageUrl') as string | null;

    if (!(file instanceof File) || !file.name) {
      logger.warn("API_UPLOAD", "Nenhum arquivo válido recebido");
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo de imagem válido foi enviado.' },
        { status: 400 }
      );
    }

    if (oldImageUrl) {
      try {
        await deleteFile(oldImageUrl);
        logger.info("API_UPLOAD", `Imagem anterior deletada: ${oldImageUrl}`);
      } catch (deleteError) {
        logger.warn("API_UPLOAD", "Erro ao deletar imagem anterior, continuando", deleteError);
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const fileData = {
      buffer,
      originalname: file.name,
    };

    const result = await saveFile(fileData);

    logger.info("API_UPLOAD", `Upload concluído: ${result.imageUrl}`);

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      publicId: result.publicId,
    });
  } catch (error) {
    logger.error("API_UPLOAD", "Erro no upload de imagem", error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upload da imagem' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('fileUrl');

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'URL do arquivo não fornecida.' },
        { status: 400 }
      );
    }

    await deleteFile(decodeURIComponent(fileUrl));

    logger.info("API_UPLOAD", `Arquivo deletado: ${fileUrl}`);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("API_UPLOAD", "Erro ao deletar arquivo", error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar arquivo.' },
      { status: 500 }
    );
  }
}
