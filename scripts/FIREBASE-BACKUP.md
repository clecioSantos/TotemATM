# Firebase Project Backup & Restore

Ferramenta completa para backup e restauração de projetos Firebase,
compatível com o plano gratuito **Spark**.

---

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run firebase:backup` | Backup completo do projeto |
| `npm run firebase:restore` | Restaura backup no projeto atual |
| `npm run firebase:restore ./caminho/backup overwrite` | Restaura sobrescrevendo |
| `npm run firebase:restore ./caminho/backup append --dry-run` | Simula restore |

---

## Backup

Gera na pasta `backup/`:

| Arquivo | Descrição |
|---------|-----------|
| `firestore-data.json` | Todos os documentos com tipos preservados |
| `firestore.indexes.json` | Índices compostos e field overrides |
| `firestore.rules` | Regras de segurança do Firestore |
| `storage.rules` | Regras de segurança do Storage |
| `metadata.json` | Metadados do backup |
| `project-config-report.md` | Inventário de configurações do projeto |
| `environment-template.env` | Template com nomes das variáveis de ambiente |

### Executar

```bash
npm run firebase:backup
```

O backup será salvo em `backup/` com todos os arquivos acima.

### O que é exportado

- ✅ Todas as coleções e subcoleções do Firestore
- ✅ IDs dos documentos preservados
- ✅ Timestamps, GeoPoints, DocumentReferences
- ✅ Índices compostos
- ✅ Regras firestore.rules e storage.rules
- ✅ Inventário de configurações

---

## Restore

```bash
# Restaura o backup da pasta backup/ (modo append)
npm run firebase:restore

# Restaura de uma pasta específica
npm run firebase:restore ./backup

# Modo overwrite (substitui documentos)
npm run firebase:restore ./backup overwrite

# Simulação (não escreve nada)
npm run firebase:restore ./backup append --dry-run
```

### Modos

| Modo | Descrição |
|------|-----------|
| `append` (padrão) | Adiciona/altera campos sem remover existentes |
| `overwrite` | Substitui documentos existentes (com confirmação) |

---

## Migrar para outro projeto Firebase

```bash
# 1. Backup do projeto origem
npm run firebase:backup

# 2. Copiar a pasta backup/ para o projeto destino

# 3. No projeto destino, configurar .env.production com as creds corretas
#    (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)

# 4. Restaurar
npm run firebase:restore
```

---

## O que NÃO é restaurado automaticamente

| Item | Motivo |
|------|--------|
| Provedores de autenticação | Configurados manualmente no console Firebase |
| Domínios autorizados | Configurados manualmente no console Firebase |
| Configurações do Hosting | Gerenciadas via firebase.json |
| Variáveis de ambiente reais | Contêm secrets (copie manualmente) |
| Chaves/secrets de API | Mercado Pago, PagBank, Cloudinary, etc. |
| Índices | Copiados mas precisam ser publicados via Firebase CLI |
| Usuários do Authentication | Não fazem parte do Firestore |

---

## Publicar índices e regras via Firebase CLI

Após o restore, para publicar os índices e regras no Firebase:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Publicar índices
firebase deploy --only firestore:indexes

# Publicar regras
firebase deploy --only firestore:rules,storage:rules
```

---

## Como gerar Service Account

1. Acesse [Console Firebase](https://console.firebase.google.com/)
2. ⚙️ Configurações do projeto → Contas de serviço
3. Clique em **Gerar nova chave privada**
4. Configure no `.env.production`:

```
FIREBASE_PROJECT_ID="seu-projeto"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## Limitações do Plano Spark

| Recurso | Limite |
|---------|--------|
| Writes/dia | 20.000 |
| Reads/dia | 50.000 |
| Storage total | 1 GB |
| Transferência | 10 GB/mês |
| Backup Blaze (nativo) | **não disponível** |

Esta ferramenta contorna a limitação de backup usando o Admin SDK diretamente.
