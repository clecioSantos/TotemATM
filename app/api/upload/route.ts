import { NextRequest, NextResponse } from 'next/server';
import { saveFile, deleteFile } from '../../../src/services/file-manager';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  var formData;
  try {
    console.log('🔍 /api/upload POST - request started');
    console.log('🔍 /api/upload - request headers:', {
      contentType: request.headers.get('content-type'),
      contentLength: request.headers.get('content-length'),
      userAgent: request.headers.get('user-agent')?.slice(0, 100),
    });

    formData = await request.formData();

    // Debug: log presence of relevant environment variables (do not print secrets)
    console.log('🔍 /api/upload - DEBUG env:', {
      hasCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: process.env.CLOUDINARY_API_KEY,
      hasApiSecret: process.env.CLOUDINARY_API_SECRET,
      nodeEnv: process.env.NODE_ENV,
    });

    // Log keys present in the incoming FormData for easier debugging
    try {
      const keys: string[] = [];
      formData.forEach((_, key) => keys.push(key));
      console.log('🔍 /api/upload - FormData keys:', keys);
    } catch (e) {
      console.warn('🔍 /api/upload - Could not iterate FormData keys', e);
    }

    const file = formData.get('image');
    const oldImageUrl = formData.get('oldImageUrl') as string | null;

    // If file exists, log its basic metadata (size/name/type)
    if (file instanceof File) {
      console.log('🔍 /api/upload - received file:', {
        name: file.name,
        size: (file as any).size ?? 'unknown',
        type: (file as any).type ?? 'unknown',
        isFile: file instanceof File,
      });
    }

    if (!(file instanceof File) || !file.name) {
      console.error('⚠️ /api/upload - no valid File received');
      console.error('⚠️ file instanceof File:', file instanceof File);
      console.error('⚠️ file?.name:', (file as any)?.name);
      return NextResponse.json(
        { error: 'Nenhum arquivo de imagem válido foi enviado.' },
        { status: 400 }
      );
    }

    if (oldImageUrl) {
      console.log('🔍 /api/upload - deleting old image:', oldImageUrl);
      await deleteFile(oldImageUrl);
    }

    console.log('🔍 /api/upload - converting file to buffer');
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('🔍 /api/upload - buffer created:', {
      length: buffer.length,
      type: buffer.constructor.name,
    });

    const fileData = {
      buffer,
      originalname: file.name,
    };

    console.log('🔍 /api/upload - calling saveFile');
    const result = await saveFile(fileData);

    console.log('✅ /api/upload - upload finished, returning url');
    return NextResponse.json({ imageUrl: result.imageUrl, publicId: result.publicId });
  } catch (error) {
    console.error('🔥 /api/upload - ERRO:', error);
    if (error instanceof Error) {
      console.error('message:', error.message);
      console.error('stack:', error.stack);
    }
    let safe = null;
    try { safe = JSON.stringify(error, Object.getOwnPropertyNames(error)); } catch(e) { /* ignore */ }
    console.error('raw error:', safe);
    const message = error;
    // Include safe debug flags about env var presence to help diagnose deployment issues
    const debug = {
      hasCloudName: process.env.CLOUDINARY_CLOUD_NAME?.toString(),
      hasApiKey: process.env.CLOUDINARY_API_KEY?.toString(),
      hasApiSecret: process.env.CLOUDINARY_API_SECRET?.toString(),
      nodeEnv: process.env.NODE_ENV ?? null,
      FormData: formData,
      FULLERROR: error,
      MESSAGE: error?.message,
      HTTPCODE: error?.http_code,
      BODY: error?.http_body,

    };

    return NextResponse.json(
      { error: message, debug }, 
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
