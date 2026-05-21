import { NextRequest, NextResponse } from 'next/server';
import { saveFile, deleteFile } from '@/src/services/file-manager';

export const runtime = 'nodejs';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const oldImageUrl = formData.get('oldImageUrl') as string | null;

    if (!(file instanceof File) || !file.name) {
      return NextResponse.json(
        { error: 'Nenhum arquivo de imagem válido foi enviado.' },
        { status: 400 }
      );
    }

    if (oldImageUrl) {
      await deleteFile(oldImageUrl);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileData = {
      buffer,
      originalname: file.name,
    };

    const result = await saveFile(fileData);

    return NextResponse.json({ imageUrl: result.imageUrl, publicId: result.publicId });
  } catch (error) {
    console.error('Erro no upload:', error);
    console.error(JSON.stringify(error, null, 2)); 
    const message = error instanceof Error ? error.message : 'Erro interno ao processar imagem.';
    return NextResponse.json(
      { error: message },
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
        { error: 'URL do arquivo não fornecida.' },
        { status: 400 }
      );
    }

    await deleteFile(decodeURIComponent(fileUrl));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar arquivo físico.' },
      { status: 500 }
    );
  }
}
