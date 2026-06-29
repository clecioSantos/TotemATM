// Este script usa o Firebase Client SDK já configurado no projeto
// Execute com: npx ts-node -r dotenv/config scripts/seed-legal-documents.ts
// Alternativa: crie um arquivo .env.local com as variáveis do Firebase ou rode diretamente no navegador via console do admin

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const documents = [
  {
    id: "termos_uso",
    titulo: "Termos de Uso",
    versao: 1,
    conteudo: `# Termos de Uso - Bora De Delivery

## 1. Aceitação dos Termos
Ao criar uma conta e utilizar a plataforma Bora De Delivery, o usuário declara ter lido, compreendido e aceitado todos os termos e condições deste documento.

## 2. Descrição do Serviço
O Bora De Delivery é uma plataforma digital que conecta clientes a estabelecimentos comerciais para pedidos e entregas de alimentos e produtos.

## 3. Cadastro e Conta
Para utilizar a plataforma, o usuário deve criar uma conta fornecendo dados verídicos. O usuário é responsável pela confidencialidade de suas credenciais.

## 4. Obrigações do Cliente
- Fornecer dados cadastrais corretos
- Não utilizar a plataforma para fins ilícitos
- Respeitar os prazos e condições dos estabelecimentos

## 5. Obrigações do Lojista
- Manter cardápio e preços atualizados
- Cumprir os prazos de entrega informados
- Responsabilizar-se pela qualidade dos produtos

## 6. Pagamentos
Os pagamentos são processados por terceiros (Mercado Pago). A plataforma não armazena dados de cartão de crédito.

## 7. Privacidade
Os dados pessoais são tratados conforme nossa Política de Privacidade, em conformidade com a LGPD.

## 8. Responsabilidades
A plataforma atua como intermediária, não se responsabilizando por problemas entre cliente e estabelecimento.

## 9. Propriedade Intelectual
Todo o conteúdo da plataforma é protegido por direitos autorais.

## 10. Disposições Gerais
Estes termos são regidos pela legislação brasileira. Qualquer controvérsia será resolvida no foro da comarca do cliente.`,
  },
  {
    id: "politica_privacidade",
    titulo: "Política de Privacidade",
    versao: 1,
    conteudo: `# Política de Privacidade - Bora De Delivery

## 1. Controlador dos Dados
O Bora De Delivery é o controlador dos dados pessoais tratados nesta plataforma.

## 2. Dados Coletados
- Nome completo
- Endereço de e-mail
- Número de telefone
- CPF (opcional)
- Data de nascimento (opcional)
- Endereço de entrega
- Dados de localização
- Histórico de pedidos

## 3. Base Legal (LGPD)
- Consentimento do titular (Art. 7, I)
- Execução de contrato (Art. 7, V)
- Exercício regular de direitos (Art. 7, VI)

## 4. Finalidade do Tratamento
- Processamento de pedidos e entregas
- Comunicação sobre o serviço
- Melhoria da plataforma
- Cumprimento de obrigações legais

## 5. Compartilhamento de Dados
- Firebase (Google) - autenticação e armazenamento
- Mercado Pago - processamento de pagamentos
- Estabelecimentos parceiros - para realização de entregas

## 6. Direitos do Titular (LGPD - Art. 18)
- Confirmação da existência de tratamento
- Acesso aos dados
- Correção de dados incompletos ou inexatos
- Anonimização, bloqueio ou eliminação
- Portabilidade dos dados
- Eliminação dos dados tratados com consentimento
- Informação sobre compartilhamento
- Revogação do consentimento

## 7. Segurança
Adotamos medidas técnicas e organizacionais para proteger os dados pessoais.

## 8. Retenção
Os dados são mantidos enquanto a conta estiver ativa ou pelo período exigido por lei.

## 9. Encarregado (DPO)
Contato: dpo@boradedelivery.com

## 10. Disposições Gerais
Esta política pode ser atualizada. Alterações serão comunicadas aos usuários.`,
  },
  {
    id: "politica_cookies",
    titulo: "Política de Cookies",
    versao: 1,
    conteudo: `# Política de Cookies - Bora De Delivery

## 1. O que são Cookies
Cookies são pequenos arquivos de texto armazenados no navegador para melhorar a experiência do usuário.

## 2. Cookies Utilizados
- Sessão: Mantém o usuário logado durante a navegação
- Firebase Auth: Gerencia a autenticação do usuário
- Lembrar-me: Mantém o email do usuário na tela de login

## 3. Cookies de Terceiros
- Firebase (Google) - autenticação e banco de dados
- Mercado Pago - processamento de pagamentos

## 4. Gerenciamento
O usuário pode gerenciar ou desabilitar cookies nas configurações do navegador.

## 5. Consentimento
Ao utilizar a plataforma, o usuário consente com o uso de cookies conforme esta política.`,
  },
];

async function seed() {
  for (const doc of documents) {
    const ref = collection(db, "legal_documents", doc.id, "versions");
    await addDoc(ref, {
      titulo: doc.titulo,
      conteudo: doc.conteudo,
      versao: doc.versao,
      dataCriacao: Timestamp.now(),
      ativo: true,
    });
    console.log(`Documento "${doc.titulo}" (v${doc.versao}) criado.`);
  }
  console.log("Seed concluído!");
}

seed().catch((err) => {
  console.error("Erro ao executar seed:", err);
  process.exit(1);
});
