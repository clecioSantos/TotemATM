"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Shield, FileText } from "lucide-react";
import { getActiveDocument, LegalDocument, LEGAL_DOCUMENTS } from "@/src/services/lgpd/legal-documents";

const VERSION = "1.1.0";
const PUBLISH_DATE = "01/03/2026";
const LAST_UPDATE = "10/06/2026";

const sections = [
  {
    icon: Cookie,
    title: "1. O que são Cookies?",
    content:
      "Cookies são pequenos arquivos de texto armazenados no navegador do usuário quando você visita um site ou aplicativo. Eles desempenham funções essenciais para o funcionamento adequado de plataformas digitais, como lembrar preferências, manter sessões ativas e coletar informações anônimas sobre a navegação. No Bora De Delivery, utilizamos cookies e tecnologias similares (localStorage, sessionStorage e índices de banco de dados no navegador) para garantir que a plataforma funcione de forma eficiente, segura e personalizada, sempre respeitando a sua privacidade e as disposições da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).",
  },
  {
    icon: Cookie,
    title: "2. Tipos de Cookies Utilizados",
    content:
      "O Bora De Delivery utiliza as seguintes categorias de cookies: (a) Cookies estritamente necessários: indispensáveis para o funcionamento básico da plataforma, permitindo a navegação e o acesso a áreas seguras. Sem estes cookies, a plataforma não pode funcionar corretamente; (b) Cookies de funcionalidade: permitem que a plataforma lembre escolhas do usuário (como idioma, preferências de exibição e dados de login) para proporcionar uma experiência personalizada; (c) Cookies de desempenho e analytics: coletam informações agregadas e anônimas sobre como os usuários utilizam a plataforma, permitindo identificar páginas mais visitadas, tempo de navegação e possíveis erros, com o objetivo de melhorar continuamente a experiência; (d) Cookies de autenticação e segurança: utilizados para verificar a identidade do usuário, proteger contra atividades fraudulentas e garantir a segurança das transações realizadas na plataforma.",
  },
  {
    icon: Cookie,
    title: "3. Cookies de Sessão",
    content:
      "Utilizamos cookies de sessão para manter o usuário autenticado durante a navegação na plataforma. Esses cookies são temporários e expiram automaticamente quando o navegador é fechado ou quando a sessão é encerrada. Eles são essenciais para: (a) manter o estado de login do usuário entre as páginas da plataforma; (b) preservar os itens adicionados ao carrinho de compras durante a sessão; (c) armazenar temporariamente informações de segurança necessárias para a validação de requisições (CSRF tokens); (d) garantir que as operações de pagamento sejam processadas com o nível adequado de segurança. Os cookies de sessão não armazenam informações pessoais permanentes e são automaticamente removidos ao final da sessão de navegação.",
  },
  {
    icon: Cookie,
    title: "4. Firebase Authentication",
    content:
      "O Bora De Delivery utiliza o Firebase Authentication, serviço de autenticação do Google Firebase, para gerenciar o acesso dos usuários à plataforma. O Firebase Auth armazena tokens de autenticação JWT (JSON Web Tokens) no navegador do usuário para: (a) verificar a identidade do usuário em cada requisição à plataforma; (b) manter a sessão ativa mesmo após o fechamento do navegador (quando a opção 'Lembrar-me' estiver ativada); (c) renovar automaticamente o token de acesso antes do vencimento, evitando interrupções na navegação; (d) proteger as rotas e funcionalidades da plataforma contra acessos não autorizados. O Firebase Auth pode utilizar tanto cookies quanto localStorage para armazenar os tokens, dependendo da configuração do navegador. Os dados de autenticação são processados nos servidores do Google Cloud Platform e estão sujeitos à Política de Privacidade do Google e aos termos de uso do Firebase.",
  },
  {
    icon: Cookie,
    title: "5. 'Lembrar-me' — Persistência de Login",
    content:
      "A funcionalidade 'Lembrar-me' disponível na tela de login da plataforma permite que o usuário opte por manter sua sessão autenticada mesmo após fechar e reabrir o navegador. Quando esta opção é ativada: (a) um cookie persistente é armazenado no navegador do usuário com validade estendida (30 dias); (b) o token de autenticação é mantido no armazenamento local do navegador; (c) o usuário não precisará realizar login novamente ao retornar à plataforma dentro do período de validade do cookie. O usuário pode desativar esta funcionalidade a qualquer momento, seja desmarcando a opção 'Lembrar-me' no próximo login, seja efetuando logout manualmente, o que removerá imediatamente o cookie persistente. Recomenda-se não utilizar esta funcionalidade em dispositivos compartilhados ou públicos.",
  },
  {
    icon: Cookie,
    title: "6. Cookies de Analytics e Melhoria",
    content:
      "O Bora De Delivery utiliza ferramentas de análise de dados para compreender como os usuários interagem com a plataforma e identificar oportunidades de melhoria. Atualmente, utilizamos: (a) Firebase Analytics: coleta dados anônimos e agregados sobre o uso da plataforma, como páginas visitadas, tempo de permanência, taxa de conversão e fluxo de navegação. Nenhum dado pessoal identificável é enviado para esta ferramenta; (b) monitoramento de desempenho: rastreamento de erros, lentidão e falhas na interface para correção proativa. Os dados coletados são anonimizados e não permitem a identificação individual do usuário. O usuário pode optar por não participar da coleta de analytics ajustando as configurações de privacidade do dispositivo ou utilizando extensões de bloqueio de rastreamento no navegador.",
  },
  {
    icon: Cookie,
    title: "7. Cookies de Terceiros",
    content:
      "Alguns cookies presentes na plataforma Bora De Delivery são definidos por terceiros confiáveis, incluindo: (a) Google Firebase: cookies e tokens de autenticação necessários para o funcionamento do serviço de autenticação e banco de dados; (b) processadores de pagamento: cookies estritamente necessários para a realização de transações financeiras, definidos pelos gateways de pagamento parceiros (cada processador possui sua própria política de cookies); (c) Google Analytics (quando aplicável): cookies para coleta de dados anônimos de navegação. O Bora De Delivery não controla diretamente os cookies definidos por terceiros. Recomendamos que o usuário consulte as políticas de privacidade e cookies desses terceiros para obter informações detalhadas sobre suas práticas.",
  },
  {
    icon: Shield,
    title: "8. Como Gerenciar e Desabilitar Cookies",
    content:
      "O usuário pode gerenciar, bloquear ou excluir cookies a qualquer momento por meio das configurações do seu navegador. Abaixo estão os links para as instruções de gerenciamento de cookies nos navegadores mais comuns: Google Chrome: Configurações > Privacidade e segurança > Cookies e outros dados do site; Mozilla Firefox: Opções > Privacidade e segurança > Cookies e dados de sites; Safari: Preferências > Privacidade > Gerenciar dados de websites; Microsoft Edge: Configurações > Cookies e permissões > Gerenciar e excluir cookies. O usuário também pode configurar o navegador para exibir um aviso antes de aceitar cookies ou rejeitar automaticamente cookies de terceiros. Importante: a desabilitação de cookies estritamente necessários pode comprometer o funcionamento adequado da plataforma, impedindo o login, a realização de pedidos e o processamento de pagamentos. A funcionalidade 'Lembrar-me' pode ser desativada diretamente na tela de login da plataforma, sem necessidade de alterar as configurações do navegador.",
  },
  {
    icon: Shield,
    title: "9. Consentimento e Opt-in",
    content:
      "Ao acessar a plataforma Bora De Delivery pela primeira vez, o usuário visualiza um banner informativo sobre o uso de cookies, com as seguintes opções: (a) 'Aceitar todos': autoriza o uso de todos os cookies, incluindo os de analytics e funcionalidade; (b) 'Rejeitar': permite apenas o uso de cookies estritamente necessários para o funcionamento da plataforma; (c) 'Personalizar': exibe opções detalhadas para que o usuário escolha quais categorias de cookies deseja autorizar. O consentimento pode ser revogado a qualquer momento pelo usuário, e a plataforma respeitará a escolha vigente. Menores de 18 anos devem obter autorização dos pais ou responsáveis legais antes de utilizar a plataforma. O histórico de consentimento é armazenado para fins de comprovação regulatória, conforme exigido pela LGPD.",
  },
  {
    icon: FileText,
    title: "10. Atualizações desta Política",
    content:
      "O Bora De Delivery poderá alterar esta Política de Cookies periodicamente para refletir mudanças nos cookies utilizados, na legislação aplicável ou nas práticas do mercado. As alterações serão comunicadas aos usuários com antecedência mínima de 15 (quinze) dias por meio dos canais oficiais de comunicação (e-mail cadastrado e/ou banner na plataforma). O uso continuado da plataforma após a vigência das alterações constitui aceitação expressa da política revisada. Esta Política de Cookies é parte integrante dos Termos de Uso e da Política de Privacidade do Bora De Delivery. Em caso de dúvidas sobre o uso de cookies, o usuário pode contatar nosso DPO pelo e-mail dpo@boradedelivery.com.br.",
  },
  {
    icon: FileText,
    title: "11. Lista de Cookies Utilizados",
    content:
      "Abaixo, a lista detalhada dos principais cookies e tecnologias de armazenamento local utilizados na plataforma Bora De Delivery: (1) firebaseAuthToken: token JWT de autenticação, persistente (até 30 dias com 'Lembrar-me' ativado), essencial; (2) sessionCookie: cookie de sessão do navegador, temporário (expira ao fechar o navegador), essencial; (3) cartItems: itens do carrinho de compras armazenados no localStorage, persistente, funcional; (4) userPreferences: preferências de idioma, tema e exibição, persistente (1 ano), funcional; (5) csrfToken: token de proteção contra falsificação de requisições, temporário, segurança; (6) analyticsId: identificador anônimo para Firebase Analytics, persistente (2 anos), analytics; (7) consentCookie: registro do consentimento do usuário para cookies, persistente (1 ano), essencial; (8) rememberMe: indicador da opção 'Lembrar-me', persistente (30 dias), funcional. Todos os cookies de terceiros (processadores de pagamento, Firebase) são gerenciados exclusivamente pelos respectivos provedores.",
  },
];

const fallbackContent = sections
  .map((s) => `<h2>${s.title}</h2><p>${s.content}</p>`)
  .join("");

export default function CookiesPage() {
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getActiveDocument(LEGAL_DOCUMENTS.POLITICA_COOKIES)
      .then((result) => {
        if (!result) setError(true);
        setDoc(result);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const displayContent = doc?.conteudo || fallbackContent;
  const displayVersion = doc ? `v${doc.versao}.0` : `v${VERSION}`;
  const displayDate = doc
    ? new Date(doc.dataAtualizacao?.toMillis()).toLocaleDateString("pt-BR")
    : LAST_UPDATE;
  const displayPubDate = doc
    ? new Date(doc.dataCriacao?.toMillis()).toLocaleDateString("pt-BR")
    : PUBLISH_DATE;

  const hasHtml = /<[a-z][\s\S]*>/i.test(displayContent);
  const renderContent = hasHtml
    ? displayContent
    : displayContent
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br/>');

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Inter',sans-serif] text-[#1F1F1F]">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-12px) } }
        .animate-fade-up { animation: fadeUp 0.6s ease-out both }
        .animate-fade-in { animation: fadeIn 0.8s ease-out both }
        .delay-1 { animation-delay:0.1s }
        .delay-2 { animation-delay:0.2s }

        .legal-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #1F1F1F;
        }
        .legal-content p {
          font-size: 0.9375rem;
          line-height: 1.75;
          color: #555;
          margin-bottom: 1rem;
          text-align: justify;
        }
        .legal-content strong {
          color: #1F1F1F;
          font-weight: 600;
        }
        .legal-content ul {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .legal-content li {
          font-size: 0.9375rem;
          line-height: 1.75;
          color: #555;
          list-style-type: disc;
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/Logo.png" alt="Bora De Delivery" className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-[#666] hover:text-[#1F1F1F] transition-colors"
            >
              Voltar ao início
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="flex items-center gap-3 mb-6 animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Cookie size={24} className="text-[#FF6B00]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black">
                Política de Cookies
              </h1>
              <p className="text-sm text-[#666] mt-1">
                Bora De Delivery &mdash; Versão {displayVersion}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-[#666] animate-fade-up delay-1">
            <span className="inline-flex items-center gap-1 h-7 px-3 bg-orange-50 border border-orange-200 rounded-full font-medium text-[#FF6B00]">
              Publicado em {displayPubDate}
            </span>
            <span className="inline-flex items-center gap-1 h-7 px-3 bg-orange-50 border border-orange-200 rounded-full font-medium text-[#FF6B00]">
              Última atualização: {displayDate}
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <Shield size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-[#999] text-sm">Não foi possível carregar os documentos. Tente novamente mais tarde.</p>
            </div>
          ) : (
            <div
              className="legal-content bg-white rounded-2xl p-8 md:p-10 border border-[#EAEAEA] border shadow-sm animate-fade-up"
              dangerouslySetInnerHTML={{ __html: renderContent }}
            />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#EAEAEA] bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/Logo.png" alt="Bora De Delivery" className="h-8 w-auto" />
              <span className="text-xs text-[#666]">
                &copy; 2026 Bora De Delivery. Todos os direitos reservados.
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#666]">
              <span>v{displayVersion}</span>
              <Link href="/termos" className="hover:text-[#FF6B00] transition-colors">
                Termos de uso
              </Link>
              <Link
                href="/privacidade"
                className="hover:text-[#FF6B00] transition-colors"
              >
                Privacidade
              </Link>
              <Link
                href="/cookies"
                className="hover:text-[#FF6B00] transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
