# Firestore Backup & Restore

Sistema de exportação e importação de dados do Firestore compatível com o plano gratuito **Spark**.

Não utiliza os comandos nativos de export/import do Google Cloud (que exigem plano Blaze).  
Gera um único arquivo JSON com toda a estrutura do banco.

---

## Pré-requisitos

- Node.js 18+
- Projeto Firebase com **Service Account** configurada
- As variáveis de ambiente do Firebase no `.env`

---

## Como gerar uma Service Account

1. Acesse [Console Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto → ⚙️ **Configurações do projeto** → **Contas de serviço**
3. Clique em **Gerar nova chave privada**
4. O download salva um arquivo JSON como `projeto-firebase-adminsdk-xxxxx.json`

**Opção A — Usar via variáveis de ambiente (recomendado):**

As variáveis `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` já estão no `.env`.

**Opção B — Usar via arquivo JSON:**

```bash
export FIREBASE_SERVICE_ACCOUNT_PATH="./service-account.json"
```

---

## Exportar dados

Exporta todas as coleções e subcoleções do Firestore para um arquivo JSON:

```bash
npm run firestore:export
```

Para salvar em um local específico:

```bash
npx tsx scripts/firestore-export.ts ./meu-backup.json
```

### O que é exportado

- ✅ Todas as coleções raiz
- ✅ Todas as subcoleções (recursivamente)
- ✅ Timestamps
- ✅ GeoPoints
- ✅ DocumentReferences
- ✅ Arrays e Maps
- ❌ Arquivos do Storage (não faz parte do Firestore)
- ❌ Regras de segurança
- ❌ Autenticação (usuários)

### Estatísticas geradas

Ao final da exportação:
- Quantidade de coleções
- Quantidade de documentos por coleção
- Quantidade de subcoleções
- Tamanho total do arquivo
- Tempo de execução

---

## Importar dados

Restaura os dados a partir de um arquivo JSON gerado pela exportação:

```bash
npm run firestore:import ./backup.json
```

### Modos de importação

| Modo | Descrição |
|------|-----------|
| `append` (padrão) | Adiciona documentos sem substituir existentes |
| `overwrite` | Substitui documentos existentes (com confirmação) |

Exemplos:

```bash
# Modo append (padrão)
npm run firestore:import ./backup.json

# Modo overwrite (com confirmação de 5s)
npm run firestore:import ./backup.json overwrite

# Dry run (apenas simula, não escreve nada)
npm run firestore:import ./backup.json append --dry-run
```

### O que é restaurado

- ✅ Mesmos IDs dos documentos
- ✅ Mesma estrutura de dados
- ✅ Timestamps, GeoPoints, References
- ✅ Subcoleções
- ✅ Arrays e Maps

---

## Migrar dados entre projetos Firebase

Para copiar dados de um projeto para outro:

1. **Exportar do projeto origem:**
   ```bash
   # No projeto origem
   npm run firestore:export ./backup-origem.json
   ```

2. **Trocar as credenciais** no `.env` para o projeto destino

3. **Importar no projeto destino:**
   ```bash
   # No projeto destino
   npm run firestore:import ./backup-origem.json append
   ```

> ⚠️ O arquivo de backup é independente do projeto — pode ser restaurado em qualquer projeto Firebase.

---

## Comandos npm

| Comando | Descrição |
|---------|-----------|
| `npm run firestore:export` | Exporta todas as coleções para JSON |
| `npm run firestore:import <arquivo>` | Importa dados de um JSON |

---

## Limitações conhecidas

- **Plano Spark**: limites de 20k writes/dia e 50k reads/dia. Para backups muito grandes, divida em etapas.
- **Tamanho do JSON**: arquivos muito grandes (>500MB) podem exigir ajustes de memória Node.js (`node --max-old-space-size=4096`).
- **Coleções vazias**: não são exportadas (Firestore não lista coleções sem documentos).
- **Storage**: arquivos (imagens, etc.) **não** são copiados — apenas as referências (URLs) no Firestore.
- **Auth**: usuários e senhas não são exportados/importados.

---

## Estrutura do arquivo de backup

```json
{
  "version": 1,
  "exportedAt": "2026-06-17T00:00:00.000Z",
  "sourceProject": "meu-projeto",
  "stats": {
    "collections": 5,
    "documents": 150,
    "subcollections": 3,
    "totalDocuments": 153,
    "sizeBytes": 1024000,
    "durationMs": 3200
  },
  "collections": [
    {
      "name": "products",
      "documents": [
        {
          "id": "abc123",
          "path": "products/abc123",
          "data": {
            "name": "Produto X",
            "price": 29.90,
            "createdAt": {
              "__type": "timestamp",
              "seconds": 1718600000,
              "nanoseconds": 0
            }
          },
          "subcollections": []
        }
      ]
    }
  ]
}
```
