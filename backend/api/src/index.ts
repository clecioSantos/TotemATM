import * as express from 'express';
import * as cors from 'cors';
import * as path from 'path';
import { upload } from './config/multer';
import { saveFile, deleteFile } from './file-manager';

const app = express();
const PORT = 3010;

// Habilita CORS para o frontend admin
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(express.json());

// Serve as imagens estáticas para que possam ser visualizadas no browser
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// Rota para Upload de Imagem
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const { oldImageUrl } = req.body;

    // Se houver uma imagem antiga, remove-a do disco para economizar espaço
    if (oldImageUrl) {
      await deleteFile(oldImageUrl);
    }

    // Salva o arquivo no disco
    const fileUrl = await saveFile(req.file);

    return res.json({ imageUrl: fileUrl });
  } catch (error) {
    console.error('Erro no upload:', error);
    return res.status(500).json({ error: 'Erro interno ao processar imagem.' });
  }
});

// Rota para deletar imagem (usada quando o produto é excluído)
app.delete('/api/upload/:fileName', async (req, res) => {
  try {
    await deleteFile(`/uploads/${req.params.fileName}`);
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao deletar arquivo físico.' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`\n\x1b[32m🚀 Servidor de imagens rodando em http://localhost:${PORT}\x1b[0m`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Erro: A porta ${PORT} já está em uso por outro programa.`);
  } else {
    console.error('\n❌ Erro ao iniciar o servidor:', err);
  }
});