"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Scale, Shield } from "lucide-react";
import { getActiveDocument, LegalDocument, LEGAL_DOCUMENTS } from "@/src/services/lgpd/legal-documents";

const VERSION = "2.0.0";
const PUBLISH_DATE = "01/03/2026";
const LAST_UPDATE = "15/06/2026";

const sections = [
  {
    icon: FileText,
    title: "1. Descrição da Plataforma",
    content:
      "O Bora De Delivery é uma plataforma digital que conecta consumidores, estabelecimentos comerciais (restaurantes, lanchonetes, padarias, mercados e similares) e entregadores independentes, viabilizando a solicitação, processamento e entrega de pedidos de alimentação e conveniência. A plataforma opera por meio de aplicativo mobile, totem de autoatendimento e painel web, permitindo que o usuário final realize pedidos, o lojista gerencie seu cardápio e operações, e o entregador realize rotas de entrega de forma eficiente.",
  },
  {
    icon: FileText,
    title: "2. Aceitação dos Termos",
    content:
      "Ao acessar ou utilizar a plataforma Bora De Delivery, o usuário declara ter lido, compreendido e aceitado integralmente os presentes Termos de Uso, bem como a Política de Privacidade e a Política de Cookies da plataforma. Caso não concorde com qualquer disposição destes termos, o usuário deverá interromper imediatamente o uso da plataforma. A aceitação é condição indispensável para a criação de conta e utilização dos serviços oferecidos.",
  },
  {
    icon: FileText,
    title: "3. Obrigações do Usuário (Consumidor)",
    content:
      "O usuário consumidor compromete-se a: (a) fornecer dados cadastrais verídicos, atualizados e completos, incluindo nome completo, CPF, endereço, telefone e e-mail; (b) não compartilhar sua senha ou credenciais de acesso com terceiros; (c) utilizar a plataforma exclusivamente para fins lícitos, não praticando atos que possam danificar, sobrecarregar ou prejudicar a infraestrutura do sistema; (d) não realizar pedidos fraudulentos ou com intenção de causar prejuízo aos estabelecimentos ou entregadores; (e) respeitar os horários de funcionamento e as políticas internas de cada estabelecimento parceiro; (f) informar imediatamente ao suporte qualquer uso não autorizado de sua conta.",
  },
  {
    icon: FileText,
    title: "4. Responsabilidades do Lojista (Estabelecimento Parceiro)",
    content:
      "O estabelecimento parceiro declara e garante que: (a) possui toda a documentação sanitária, fiscal e trabalhista exigida pela legislação brasileira para funcionamento regular; (b) é o único responsável pela qualidade, preparo, acondicionamento e segurança dos alimentos e produtos comercializados; (c) manterá seu cardápio, preços e informações sempre atualizados na plataforma; (d) cumprirá os prazos de preparo informados aos consumidores, sob pena de cancelamento do pedido; (e) não comercializará produtos proibidos por lei ou que exijam licenciamento especial não declarado; (f) indenizará a plataforma por quaisquer danos decorrentes do descumprimento de obrigações legais ou contratuais; (g) arcará com as taxas e comissões acordadas contratualmente, podendo o valor ser descontado diretamente dos repasses.",
  },
  {
    icon: FileText,
    title: "5. Termos do Entregador (Parceiro de Entrega)",
    content:
      "O entregador parceiro declara-se expressamente como profissional autônomo e independente, não existindo qualquer vínculo trabalhista, previdenciário ou de subordinação com o Bora De Delivery. São obrigações do entregador: (a) possuir veículo em condições adequadas de segurança e documentação regular; (b) manter cadastro atualizado com CPF, RG, CNH, CNPJ quando aplicável, e comprovante de residência; (c) realizar as entregas no prazo estimado, tratando os produtos com cuidado e respeitando as condições de temperatura e acondicionamento; (d) utilizar equipamentos de proteção individual e coletiva conforme a legislação de trânsito; (e) não subcontratar terceiros para realizar entregas em seu nome; (f) arcar com todos os custos operacionais de sua atividade, incluindo combustível, manutenção do veículo, plano de dados móveis e alimentação; (g) manter conduta cortês e profissional no contato com consumidores e lojistas.",
  },
  {
    icon: FileText,
    title: "6. Processamento de Pagamentos",
    content:
      "O Bora De Delivery utiliza intermediadores de pagamento terceirizados para processar todas as transações financeiras realizadas na plataforma. As formas de pagamento disponíveis incluem cartão de crédito, cartão de débito, PIX e dinheiro (mediante disponibilidade do estabelecimento). O lojista autoriza a plataforma a reter os valores referentes a taxas, comissões e eventuais multas antes do repasse. O consumidor autoriza a cobrança imediata no ato da confirmação do pedido para pagamentos eletrônicos. Cancelamentos e reembolsos seguem a política de cancelamento vigente, sendo o valor integralmente restituído ao consumidor em caso de cancelamento por indisponibilidade do estabelecimento. A plataforma não se responsabiliza por falhas operacionais dos intermediadores de pagamento, limitando-se a mediar a resolução junto ao consumidor.",
  },
  {
    icon: Scale,
    title: "7. Limitação de Responsabilidade",
    content:
      "O Bora De Delivery atua exclusivamente como plataforma de intermediação tecnológica, não se responsabilizando: (a) pela qualidade, validade, preparo ou segurança dos produtos comercializados pelos estabelecimentos parceiros; (b) por atrasos na entrega decorrentes de condições de trânsito, clima adverso, ou fatores alheios ao controle razoável da plataforma; (c) por danos causados por terceiros não vinculados contratualmente à plataforma; (d) por violações de dados decorrentes de falhas de segurança nos dispositivos do usuário ou de interceptação não autorizada em redes de terceiros. A responsabilidade do Bora De Delivery, em qualquer hipótese, limita-se ao valor do pedido realizado, salvo nos casos de dolo ou culpa grave devidamente comprovados judicialmente.",
  },
  {
    icon: Scale,
    title: "8. Propriedade Intelectual",
    content:
      "Todo o conteúdo disponível na plataforma Bora De Delivery, incluindo but not limited to logotipos, marcas, nomes comerciais, layouts, códigos-fonte, algoritmos, designs, interfaces e textos, é de propriedade exclusiva do Bora De Delivery ou de seus licenciadores, sendo protegido pela Lei de Propriedade Industrial (Lei nº 9.279/96) e pela Lei de Direitos Autorais (Lei nº 9.610/98). É expressamente proibida a reprodução, distribuição, modificação, exibição pública ou criação de obras derivadas sem autorização prévia e por escrito da plataforma. O conteúdo inserido pelos lojistas (cardápios, fotos, descrições) permanece sob propriedade do respectivo estabelecimento, sendo concedida à plataforma licença não exclusiva para exibição e distribuição no âmbito dos serviços.",
  },
  {
    icon: Scale,
    title: "9. Cancelamento e Rescisão",
    content:
      "O usuário consumidor poderá cancelar sua conta a qualquer momento por meio das configurações da plataforma, sendo os dados pessoais retidos conforme disposto na Política de Privacidade. O estabelecimento parceiro poderá rescindir o contrato mediante notificação prévia de 30 (trinta) dias, respeitados os pedidos em andamento. A plataforma poderá suspender ou encerrar contas que violem estes Termos de Uso, especialmente nos casos de: (a) fraude ou tentativa de fraude; (b) fornecimento de dados falsos; (c) conduta abusiva ou criminosa; (d) violação reiterada de direitos de terceiros; (e) inadimplemento de obrigações financeiras com a plataforma. O encerramento não afetará os direitos e obrigações já constituídos até a data da rescisão.",
  },
  {
    icon: Scale,
    title: "10. Lei Aplicável e Foro",
    content:
      "Estes Termos de Uso são regidos pela legislação brasileira, em especial pelo Código Civil (Lei nº 10.406/02), pelo Código de Defesa do Consumidor (Lei nº 8.078/90) e pelo Marco Civil da Internet (Lei nº 12.965/14). Fica eleito o foro da comarca do domicílio do consumidor para dirimir quaisquer controvérsias oriundas destes termos, nos termos do Art. 101, inciso I, do Código de Defesa do Consumidor. Para os demais usuários (lojistas e entregadores), fica eleito o foro da cidade de São Paulo, SP, com exclusão de qualquer outro, por mais privilegiado que seja.",
  },
  {
    icon: FileText,
    title: "11. Disposições Gerais",
    content:
      "O Bora De Delivery reserva-se o direito de alterar estes Termos de Uso a qualquer momento, notificando os usuários com antecedência mínima de 15 (quinze) dias por meio dos canais oficiais de comunicação (e-mail cadastrado e/ou notificação na plataforma). O uso continuado da plataforma após a vigência das alterações constitui aceitação expressa dos novos termos. Caso qualquer disposição destes Termos seja considerada inválida ou inexequível por autoridade competente, as demais disposições permanecerão em pleno vigor. Este documento substitui todas as versões anteriores publicadas.",
  },
];

const fallbackContent = sections
  .map((s) => `<h2>${s.title}</h2><p>${s.content}</p>`)
  .join("");

export default function TermosPage() {
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getActiveDocument(LEGAL_DOCUMENTS.TERMOS_USO)
      .then((result) => {
        if (!result) setError(true);
        setDoc(result);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const displayContent = doc?.conteudo || fallbackContent;
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
  const displayVersion = doc ? `v${doc.versao}.0` : `v${VERSION}`;
  const displayDate = doc
    ? new Date(doc.dataAtualizacao?.toMillis()).toLocaleDateString("pt-BR")
    : LAST_UPDATE;
  const displayPubDate = doc
    ? new Date(doc.dataCriacao?.toMillis()).toLocaleDateString("pt-BR")
    : PUBLISH_DATE;

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
        .delay-3 { animation-delay:0.3s }

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
              <FileText size={24} className="text-[#FF6B00]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black">
                Termos de Uso
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
              <p className="text-[#999] text-sm">Não foi possível carregar os Termos de Uso. Tente novamente mais tarde.</p>
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
