export interface HelpArticle {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  topics: string[];
  tips: string[];
  keywords: string[];
}

const helpContent: HelpArticle[] = [
  {
    id: "mercadopago",
    title: "Como conectar Mercado Pago",
    shortDescription: "Configurações de recebimento e pagamentos.",
    content:
      "Conecte uma conta Mercado Pago para receber pagamentos e utilizar o split automático de pagamentos. A conexão é feita via OAuth, onde o dono da loja autoriza a plataforma a processar pagamentos em sua conta.",
    topics: [
      "Acesse a página Financeiro no menu lateral",
      "Clique em 'Conectar Mercado Pago'",
      "Você será redirecionado ao Mercado Pago",
      "Faça login e autorize a conexão",
      "Após autorizar, você será redirecionado de volta",
    ],
    tips: [
      "A conexão é segura e utiliza OAuth 2.0",
      "Você pode desconectar a qualquer momento",
      "Cada loja precisa de sua própria conexão",
    ],
    keywords: ["mercado pago", "conexão", "oauth", "pagamento", "gateway", "mp"],
  },
  {
    id: "split",
    title: "Como funciona o Split",
    shortDescription:
      "Divide automaticamente o valor entre plataforma e loja.",
    content:
      "O split permite dividir automaticamente os valores recebidos. Quando um cliente realiza um pagamento, o Mercado Pago processa a transação, a taxa da plataforma é descontada automaticamente, e o valor restante é repassado para a loja.",
    topics: [
      "Cliente realiza pagamento via PIX ou cartão",
      "Mercado Pago processa a transação",
      "Taxa da plataforma é descontada",
      "Valor restante vai para a loja",
    ],
    tips: [
      "A taxa é configurada no cadastro da loja",
      "O split só funciona com Mercado Pago conectado",
      "O repasse é automático e transparente",
    ],
    keywords: ["split", "divisão", "taxa", "comissão", "repartição", "rateio", "application fee"],
  },
  {
    id: "promocoes",
    title: "Como criar Promoções",
    shortDescription: "Ofertas exibidas para os clientes.",
    content:
      "Promoções podem ser vinculadas a eventos ou ao evento permanente 'Promoções'. Crie descontos percentuais, preços fixos ou descontos em valor para atrair mais clientes.",
    topics: [
      "Acesse a página Promoções no menu lateral",
      "Clique em 'Nova Promoção'",
      "Escolha o tipo: desconto percentual, preço fixo ou desconto em valor",
      "Selecione os produtos participantes",
      "Defina o período da promoção",
      "Vincule a um evento ou deixe como promoção permanente",
    ],
    tips: [
      "Promoções com estoque limitado criam urgência",
      "É possível limitar a quantidade por cliente",
      "Acompanhe o desempenho nos relatórios",
    ],
    keywords: ["promoção", "desconto", "oferta", "preço promocional", "liquidação"],
  },
  {
    id: "eventos",
    title: "Como criar Eventos",
    shortDescription: "Organizam promoções em campanhas.",
    content:
      "Eventos organizam promoções em campanhas temáticas. Apenas administradores podem criar eventos. Os eventos podem ter data de início e fim, e as promoções vinculadas a eles são exibidas durante o período do evento.",
    topics: [
      "Acesse a página Promoções",
      "Vá para a seção de Eventos",
      "Clique em 'Novo Evento'",
      "Defina nome, data e descrição",
      "Vincule promoções ao evento",
    ],
    tips: [
      "Eventos sazonais aumentam o engajamento",
      "Use banners personalizados para cada evento",
      "Eventos podem ser permanentes",
    ],
    keywords: ["evento", "campanha", "sazonal", "temático", "promoção"],
  },
  {
    id: "entregas",
    title: "Como configurar Entregas",
    shortDescription: "Configurações de frete e entrega.",
    content:
      "O frete é calculado conforme o bairro configurado. Administradores podem definir cidades atendidas, bairros disponíveis e preços de entrega por bairro. Também é possível habilitar a retirada na loja.",
    topics: [
      "Acesse a página Endereços no menu lateral",
      "Cadastre as cidades atendidas",
      "Cadastre os bairros de cada cidade",
      "Defina o preço de entrega por bairro",
      "Ative ou desative a entrega por região",
    ],
    tips: [
      "Bairros desativados não aparecem para o cliente",
      "A retirada na loja é configurada separadamente",
      "Preços podem variar por bairro",
    ],
    keywords: ["entrega", "frete", "endereço", "bairro", "cidade", "delivery", "região"],
  },
  {
    id: "taxas",
    title: "Como configurar Taxas",
    shortDescription: "Configuração da taxa da plataforma.",
    content:
      "A taxa da plataforma é descontada automaticamente de cada venda antes do repasse para a loja. O percentual é configurado por loja e pode ser alterado a qualquer momento.",
    topics: [
      "Acesse a página Financeiro",
      "Localize a seção 'Taxa da Plataforma'",
      "Defina o percentual desejado",
      "Salve as alterações",
    ],
    tips: [
      "A taxa é aplicada automaticamente no split",
      "Consulte os relatórios para acompanhar os valores",
      "A taxa pode ser diferente para cada loja",
    ],
    keywords: ["taxa", "comissão", "percentual", "split", "financeiro"],
  },
  {
    id: "avaliacoes",
    title: "Como funcionam as Avaliações",
    shortDescription: "Avaliações realizadas pelos clientes.",
    content:
      "As avaliações ajudam a medir a satisfação dos clientes. Após receber o pedido, o cliente pode avaliar a loja com notas e comentários, contribuindo para a melhoria contínua do serviço.",
    topics: [
      "Cliente recebe o pedido",
      "É convidado a avaliar a experiência",
      "Nota e comentário são registrados",
      "Avaliações ficam visíveis na página da loja",
    ],
    tips: [
      "Responda às avaliações para engajar clientes",
      "Avaliações positivas atraem mais pedidos",
      "Monitore avaliações regularmente",
    ],
    keywords: ["avaliação", "review", "nota", "comentário", "feedback", "satisfação"],
  },
  {
    id: "lojas",
    title: "Como gerenciar Lojas",
    shortDescription: "Gerenciamento das lojas cadastradas.",
    content:
      "Administradores podem criar, editar, bloquear e configurar lojas. Cada loja possui suas próprias configurações de entrega, horário de funcionamento, taxas e integrações.",
    topics: [
      "Acesse o painel do proprietário",
      "Visualize todas as lojas cadastradas",
      "Edite dados como nome, endereço e horários",
      "Configure taxas e métodos de pagamento",
      "Ative ou desative lojas",
    ],
    tips: [
      "Lojas desativadas não aparecem para clientes",
      "Cada loja tem sua própria conta Mercado Pago",
      "Horários de funcionamento são configuráveis por dia",
    ],
    keywords: ["loja", "empresa", "unidade", "franquia", "gerenciamento"],
  },
  {
    id: "usuarios",
    title: "Como funcionam os Usuários",
    shortDescription: "Gerenciamento de usuários do sistema.",
    content:
      "Os usuários podem ter diferentes papéis no sistema: administrador, proprietário, colaborador e cliente. Cada papel possui permissões específicas.",
    topics: [
      "Administradores: controle total do sistema",
      "Proprietários: gerenciam suas lojas",
      "Colaboradores: operação diária",
      "Clientes: realizam pedidos",
    ],
    tips: [
      "Permissões podem ser customizadas por loja",
      "Colaboradores têm acesso limitado",
      "Mantenha os perfis atualizados",
    ],
    keywords: ["usuário", "perfil", "papel", "role", "permissão", "colaborador"],
  },
  {
    id: "totem",
    title: "Como funciona o Totem",
    shortDescription: "Autoatendimento para clientes.",
    content:
      "O Totem é o sistema de autoatendimento onde os clientes fazem seus pedidos. Basta compartilhar o link do totem com os clientes ou abrir em tablets para que eles possam montar seus pedidos.",
    topics: [
      "Compartilhe o link do totem com os clientes",
      "Cliente acessa e monta o pedido",
      "Escolhe a forma de pagamento",
      "Pedido é enviado para a cozinha",
    ],
    tips: [
      "O link do totem está disponível nas configurações",
      "Funciona em qualquer dispositivo com internet",
      "Ideal para tablets e quiosques",
    ],
    keywords: ["totem", "autoatendimento", "self-service", "quiosque", "tablet"],
  },
  {
    id: "habilitar-pix",
    title: "Habilitar PIX",
    shortDescription: "Saiba como habilitar pagamentos via PIX na sua loja.",
    content: `
<p>Para habilitar o PIX na sua loja basta ter a conta <strong>Mercado Pago</strong> configurada no menu <strong>Financeiro</strong> e possuir uma <strong>chave PIX</strong> configurada na sua conta Mercado Pago.</p>

<h3>Passo a passo</h3>
<ol>
  <li>Acesse o menu <strong>Financeiro</strong> no painel administrativo.</li>
  <li>Clique em <strong>Conectar Mercado Pago</strong> e siga as instruções para autorizar a integração.</li>
  <li>Após conectar, verifique se o status exibe <strong>"Conectado"</strong>.</li>
  <li>Acesse sua conta no <a href="https://www.mercadopago.com.br" target="_blank" rel="noopener">Mercado Pago</a> e cadastre uma <strong>chave PIX</strong> (pode ser CPF, CNPJ, e-mail, celular ou chave aleatória).</li>
  <li>Pronto! O PIX estará disponível para seus clientes no checkout.</li>
</ol>

<h3>Dica</h3>
<p>Recomendamos utilizar uma chave PIX do tipo <strong>CNPJ</strong> ou <strong>e-mail</strong> para facilitar a identificação dos pagamentos recebidos.</p>
    `.trim(),
    topics: ["Mercado Pago", "PIX", "Financeiro", "Pagamentos"],
    tips: [
      "A chave PIX deve ser cadastrada diretamente no Mercado Pago, não no sistema.",
      "Utilize o CNPJ da loja como chave PIX para facilitar a conciliação.",
      "Após configurar, teste fazendo um pedido de R$ 1,00 para confirmar que o QR Code está sendo gerado.",
    ],
    keywords: ["pix", "pagamento", "mercado pago", "financeiro", "chave pix", "habilitar pix", "qr code"],
  },
];

export default helpContent;

export function searchHelp(query: string): HelpArticle[] {
  const q = query.toLowerCase().trim();
  if (!q) return helpContent;
  return helpContent.filter(
    (article) =>
      article.title.toLowerCase().includes(q) ||
      article.shortDescription.toLowerCase().includes(q) ||
      article.content.toLowerCase().includes(q) ||
      article.keywords.some((kw) => kw.includes(q))
  );
}

export function getArticleById(id: string): HelpArticle | undefined {
  return helpContent.find((a) => a.id === id);
}

export function getShortHelp(id: string): string | undefined {
  return helpContent.find((a) => a.id === id)?.shortDescription;
}