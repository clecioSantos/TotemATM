import { NextRequest, NextResponse } from 'next/server';
import { saveFile, deleteFile } from '@/src/services/file-manager';

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
    const file = formData.get('image') as File;
    const oldImageUrl = formData.get('oldImageUrl') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    // Se houver uma imagem antiga, remove-a do disco
    if (oldImageUrl) {
      await deleteFile(oldImageUrl);
    }

    // Converter File para buffer
    const buffer = await file.arrayBuffer();
    const fileData = {
      buffer: Buffer.from(buffer),
      originalname: file.name,
    };

    // Salvar o arquivo
    const fileUrl = await saveFile(fileData);

    return NextResponse.json({ imageUrl: fileUrl });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar imagem.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'Nome do arquivo não fornecido.' },
        { status: 400 }
      );
    }

    await deleteFile(`/uploads/${fileName}`);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar arquivo físico.' },
      { status: 500 }
    );
  }
}
