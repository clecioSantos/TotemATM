"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, FileText, Scale } from "lucide-react";
import { getActiveDocument, LegalDocument, LEGAL_DOCUMENTS } from "@/src/services/lgpd/legal-documents";

const VERSION = "2.0.0";
const PUBLISH_DATE = "01/03/2026";
const LAST_UPDATE = "15/06/2026";

const sections = [
  {
    icon: Shield,
    title: "1. Controlador de Dados",
    content:
      "O Bora De Delivery, pessoa jurídica de direito privado, inscrita sob CNPJ 00.000.000/0001-00, com sede na Avenida Paulista, 1000, Bela Vista, São Paulo, SP, CEP 01310-100, é a controladora responsável pelo tratamento dos dados pessoais coletados por meio da plataforma. Para assuntos relacionados à proteção de dados, o encarregado (Data Protection Officer — DPO) pode ser contatado exclusivamente pelo e-mail dpo@boradedelivery.com.br. A plataforma adota as melhores práticas de governança de dados, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD), garantindo transparência, segurança e privacidade no tratamento das informações dos usuários.",
  },
  {
    icon: Shield,
    title: "2. Dados Pessoais Coletados",
    content:
      "Durante o uso da plataforma Bora De Delivery, poderão ser coletados os seguintes dados pessoais: (a) dados de identificação: nome completo, CPF, RG, data de nascimento e gênero; (b) dados de contato: endereço de e-mail, número de telefone celular e telefone fixo; (c) dados de endereço: logradouro, número, complemento, bairro, cidade, estado e CEP, essenciais para a realização das entregas; (d) dados de pagamento: informações de cartão de crédito (bandeira, últimos 4 dígitos, nome do titular, data de validade), chave PIX e dados bancários para repasse aos lojistas e entregadores; (e) dados de localização: coordenadas geográficas em tempo real para rastreamento de entregas e cálculo de rotas; (f) dados de uso: histórico de pedidos, preferências alimentares, avaliações, tempo de navegação e interações com a plataforma; (g) dados de dispositivo: modelo do aparelho, sistema operacional, identificadores únicos (ID do dispositivo), endereço IP e tipo de navegador.",
  },
  {
    icon: Shield,
    title: "3. Base Legal para o Tratamento (Art. 7º LGPD)",
    content:
      "O tratamento de dados pessoais realizado pelo Bora De Delivery fundamenta-se nas seguintes bases legais, nos termos do Art. 7º da LGPD: (a) mediante consentimento do titular (Art. 7º, I) — para fins de marketing, comunicação personalizada e compartilhamento com parceiros publicitários; (b) para execução de contrato (Art. 7º, V) — essencial para o processamento de pedidos, cobranças, entregas e funcionamento da plataforma; (c) para cumprimento de obrigação legal ou regulatória (Art. 7º, II) — como retenção de dados fiscais e contábeis, comunicação a órgãos de fiscalização e cumprimento de ordens judiciais; (d) para exercício regular de direitos (Art. 7º, VI) — em processos judiciais, administrativos ou arbitrais; (e) para proteção ao crédito (Art. 7º, X) — em verificações de solvência e análise de risco; (f) legítimo interesse (Art. 7º, IX) — para melhoria dos serviços, prevenção a fraudes e segurança da plataforma, desde que respeitadas as legítimas expectativas dos titulares.",
  },
  {
    icon: Shield,
    title: "4. Finalidades do Tratamento",
    content:
      "Os dados pessoais coletados são utilizados para as seguintes finalidades: (a) viabilizar o cadastro e a autenticação de usuários na plataforma; (b) processar e gerenciar pedidos, incluindo comunicação entre consumidores, lojistas e entregadores; (c) realizar cobranças, processar pagamentos e efetuar repasses financeiros; (d) calcular rotas de entrega e fornecer rastreamento em tempo real; (e) enviar notificações operacionais sobre status de pedidos, promoções e comunicados oficiais; (f) oferecer suporte ao usuário e mediar conflitos; (g) prevenir, detectar e investigar atividades fraudulentas ou abusivas; (h) cumprir obrigações legais, regulatórias e ordens judiciais; (i) realizar análises estatísticas e de comportamento para melhoria contínua dos serviços; (j) personalizar a experiência do usuário com recomendações baseadas em histórico e preferências.",
  },
  {
    icon: FileText,
    title: "5. Compartilhamento de Dados",
    content:
      "O Bora De Delivery poderá compartilhar dados pessoais com as seguintes categorias de terceiros: (a) provedores de infraestrutura tecnológica: Google Firebase (autenticação, banco de dados Firestore, armazenamento, hospedagem e funções serverless), Google Cloud Platform e serviços de CDN; (b) processadores de pagamento: operadoras de cartão de crédito (bandeiras), intermediadores de pagamento (gateways como Stripe, PagSeguro, Mercado Pago ou similares) e instituições financeiras parceiras; (c) parceiros de entrega: entregadores autônomos cadastrados na plataforma, que recebem dados limitados de localização e contato do consumidor exclusivamente para viabilizar a entrega; (d) estabelecimentos parceiros: os lojistas recebem os dados do pedido (itens, valor, endereço de entrega e instruções especiais) para preparo do produto; (e) autoridades competentes: quando exigido por lei, ordem judicial ou solicitação de órgão regulador; (f) prestadores de serviços de marketing e auditoria, mediante consentimento específico do titular. Em todos os casos, o compartilhamento é limitado ao mínimo necessário para a finalidade pretendida, e os terceiros estão contratualmente obrigados a respeitar os mesmos padrões de proteção de dados adotados pela plataforma.",
  },
  {
    icon: FileText,
    title: "6. Transferência Internacional de Dados",
    content:
      "Alguns dados pessoais coletados pelo Bora De Delivery poderão ser transferidos para servidores localizados fora do território brasileiro, especialmente para os Estados Unidos, onde estão sediados os provedores de infraestrutura em nuvem (Google Cloud Platform / Firebase) e os processadores de pagamento. Essas transferências são realizadas em conformidade com o Art. 33 da LGPD, utilizando os seguintes mecanismos de adequação: (a) cláusulas contratuais padronizadas aprovadas pela Autoridade Nacional de Proteção de Dados (ANPD); (b) compromisso contratual de adoção de nível de proteção equivalente ao previsto na legislação brasileira; (c) verificação periódica das certificações e práticas de segurança dos destinatários (SOC 2, ISO 27001). O titular poderá solicitar informações detalhadas sobre os mecanismos de transferência aplicados por meio do canal do DPO.",
  },
  {
    icon: Shield,
    title: "7. Direitos do Titular (Art. 18 LGPD)",
    content:
      "Nos termos do Art. 18 da Lei Geral de Proteção de Dados Pessoais (LGPD), o titular dos dados pessoais possui os seguintes direitos, exercíveis a qualquer momento mediante solicitação ao encarregado (DPO): (a) confirmação da existência de tratamento de dados pessoais; (b) acesso aos dados tratados pela plataforma; (c) correção de dados incompletos, inexatos ou desatualizados; (d) anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD; (e) portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa, observados os segredos comercial e industrial; (f) eliminação dos dados pessoais tratados com o consentimento do titular, exceto nas hipóteses de conservação legalmente autorizadas; (g) informação das entidades públicas e privadas com as quais o controlador realizou uso compartilhado de dados; (h) informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa; (i) revogação do consentimento a qualquer tempo, mediante manifestação expressa. As solicitações serão respondidas em até 15 (quinze) dias, conforme previsto no Art. 19 da LGPD.",
  },
  {
    icon: Scale,
    title: "8. Período de Retenção de Dados",
    content:
      "O Bora De Delivery armazena os dados pessoais pelo período necessário ao cumprimento das finalidades para as quais foram coletados, observados os seguintes prazos mínimos de retenção: (a) dados cadastrais e de uso: retidos enquanto a conta do usuário estiver ativa e por até 6 (seis) meses após o encerramento da conta, para cumprimento de obrigações legais e resolução de eventuais litígios; (b) dados fiscais e de pagamento: retidos pelo prazo mínimo de 5 (cinco) anos, conforme exigido pela legislação tributária brasileira (Art. 173 do Código Tributário Nacional); (c) dados de logs de acesso: retidos pelo prazo mínimo de 6 (seis) meses, conforme Art. 15 do Marco Civil da Internet (Lei nº 12.965/14); (d) dados de consentimento: retidos enquanto vigente o consentimento e por até 2 (dois) anos após sua revogação, para fins de comprovação regulatória. Após o término do prazo de retenção, os dados serão definitivamente eliminados ou anonimizados, salvo se houver determinação legal em contrário.",
  },
  {
    icon: Scale,
    title: "9. Segurança dos Dados",
    content:
      "O Bora De Delivery emprega medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acessos não autorizados, destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito. As medidas incluem: (a) criptografia em trânsito (protocolo TLS 1.3) e em repouso (AES-256); (b) controles de acesso baseados no princípio do menor privilégio; (c) autenticação multifator (MFA) para acesso administrativo; (d) monitoramento contínuo de segurança com detecção de anomalias; (e) testes periódicos de penetração e varredura de vulnerabilidades; (f) políticas internas de segurança da informação e plano de resposta a incidentes; (g) treinamento regular da equipe em boas práticas de proteção de dados. Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, o Bora De Delivery comunicará o fato à ANPD e ao titular afetado no prazo legal de até 72 horas, conforme Art. 48 da LGPD.",
  },
  {
    icon: Shield,
    title: "10. Cookies e Tecnologias Semelhantes",
    content:
      "O Bora De Delivery utiliza cookies e tecnologias de rastreamento para garantir o funcionamento adequado da plataforma, melhorar a experiência do usuário e analisar padrões de uso. As informações detalhadas sobre os tipos de cookies utilizados, suas finalidades e como gerenciá-los estão disponíveis na Política de Cookies da plataforma, que constitui parte integrante desta Política de Privacidade.",
  },
  {
    icon: Scale,
    title: "11. Disposições Finais",
    content:
      "O Bora De Delivery reserva-se o direito de alterar esta Política de Privacidade a qualquer momento para refletir mudanças legais, regulatórias ou operacionais. As alterações serão comunicadas aos usuários com antecedência mínima de 15 (quinze) dias por meio do e-mail cadastrado ou notificação na plataforma. Caso o usuário não concorde com as alterações, poderá encerrar sua conta no prazo de vigência da versão anterior. Esta Política de Privacidade é regida pela legislação brasileira, em especial pela Lei nº 13.709/2018 (LGPD), pelo Marco Civil da Internet (Lei nº 12.965/14) e pelo Código de Defesa do Consumidor (Lei nº 8.078/90). Fica eleito o foro da comarca do domicílio do titular para dirimir dúvidas ou controvérsias relacionadas a esta política.",
  },
];

const fallbackContent = sections
  .map((s) => `<h2>${s.title}</h2><p>${s.content}</p>`)
  .join("");

export default function PrivacidadePage() {
  const router = useRouter();
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getActiveDocument(LEGAL_DOCUMENTS.POLITICA_PRIVACIDADE)
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
            <button onClick={() => router.back()}
              className="text-sm font-medium text-[#666] hover:text-[#1F1F1F] transition-colors"
            >
              Voltar
            </button>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="flex items-center gap-3 mb-6 animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Shield size={24} className="text-[#FF6B00]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black">
                Política de Privacidade
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
