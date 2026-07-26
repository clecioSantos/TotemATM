# 12 — Riscos, Melhorias e Versoes Futuras

## 12.1 Riscos e Mitigacoes

### Risco 1: Canibalizacao de Margem
**Descricao:** Cupons emitidos pelo sistema reduzem a margem do Bora alem do aceitavel.
**Probabilidade:** Media
**Impacto:** Alto (financeiro direto)
**Mitigacao:**
- Caps rigidos de emissao (500 coins/mes, 1 cupom/semana)
- Validacao de margem em tempo real (max 50% da margem por cupom)
- Dashboard de monitoramento com alertas
- Feature flag para ajustar caps sem deploy
- Kill switch: `cupons_enabled = false`

### Risco 2: Fraude e Abuso
**Descricao:** Usuarios tentam farmar coins ou burlar o sistema.
**Probabilidade:** Alta
**Impacto:** Medio
**Mitigacao:**
- Idempotency keys
- Todas as regras validadas no servidor
- Rate limiting
- Firestore transactions atomicas
- Audit trail completo
- Testes anti-fraude automatizados

### Risco 3: Custo Firestore
**Descricao:** Volume de leituras/escritas excede o estimado, gerando custos elevados.
**Probabilidade:** Media
**Impacto:** Medio (financeiro)
**Mitigacao:**
- Auditoria de reads/writes por operacao
- Cache agressivo (loja 5min, definicoes 1h)
- Paginacao em todas as listas
- Monitoramento de custo diario
- Otimizacao de queries (indices compostos)

### Risco 4: Baixo Engajamento
**Descricao:** Usuarios ignoram o sistema de gamificacao.
**Probabilidade:** Media
**Impacto:** Alto (investimento sem retorno)
**Mitigacao:**
- Lancamento gradual (10% -> 50% -> 100%)
- A/B testing constante
- Onboarding visivel na primeira experiencia
- Notificacoes push (V2) para lembrar missoes
- Iteracao baseada em dados

### Risco 5: Complexidade Tecnica
**Descricao:** Sistema muito complexo, dificil de manter e evoluir.
**Probabilidade:** Baixa
**Impacto:** Medio
**Mitigacao:**
- Arquitetura modular (services separados)
- Repository pattern (abstracao do Firestore)
- Testes automatizados (90%+ cobertura)
- Documentacao completa
- Tipagem forte (TypeScript)

### Risco 6: Vazamento de Dados
**Descricao:** Dados de gamificacao (coins, nivel) expostos a outros usuarios.
**Probabilidade:** Baixa
**Impacto:** Alto (LGPD)
**Mitigacao:**
- Firestore rules: userId == request.auth.uid
- Admin SDK para todas as escritas
- Nenhum dado de gamificacao em respostas publicas
- Validacao de ownership em todas as queries

### Risco 7: Regressao ao Adicionar Missoes
**Descricao:** Novas missoes quebram economia ou introduzem bugs.
**Probabilidade:** Media
**Impacto:** Medio
**Mitigacao:**
- Testes de regressao automaticos para novas missoes
- Validacao Zod de todas as mission_definitions
- Ambiente de staging para testar antes de producao
- Feature flag para desativar missoes individuais

## 12.2 Dividas Tecnicas Previstas

1. **Rate limiter in-memory:** MVP usa memoria. Migrar para Redis no futuro.
2. **Cache de feature flags:** MVP usa Map em memoria (reseta no deploy frio). Migrar para camada de cache persistente.
3. **Firebase Emulator para testes:** Configuracao inicial simples. Aprimorar com dados realistas.
4. **Dashboard admin basico:** MVP usa recharts simples. V2 pode usar ferramenta dedicada (Metabase, Grafana).
5. **Seed de dados:** MVP usa script manual. Automatizar com fabricacao de dados realistas.
6. **Logs de analytics:** MVP grava no Firestore. Para escala, migrar para BigQuery ou similar.
7. **Notificacoes push:** MVP nao inclui. V2 adiciona notificacoes para streak e missoes.
8. **Internacionalizacao (i18n):** MVP apenas PT-BR. Estrutura preparada para multi-idioma.

## 12.3 Melhorias Pos-MVP (Quick Wins)

1. **Notificacoes push de streak:** "Seu streak de 15 dias esta correndo perigo! Abra o app hoje."
2. **Notificacoes push de missoes:** "Faltam 2 avaliacoes para completar a missao semanal!"
3. **Aniversario do usuario:** Bonus de coins no aniversario
4. **Eventos sazonais:** Missoes tematicas (Copa, Natal, Black Friday)
5. **Indicacao de amigos:** "Convide um amigo, ganhe 200 XP + 20 coins"
6. **Borinha reage a pedidos:** Animacao do Borinha comemorando apos cada pedido
7. **Sons e vibracao:** Feedback sonoro e haptico no level up (mobile)
8. **Tutorial interativo:** Primeira experiencia guiada para novos usuarios
9. **Badges no perfil do Borinha:** Exibicao visual das conquistas

## 12.4 Versoes Futuras

### V2 — Cidade do Borinha
- Mapa visual onde o Borinha evolui
- Cada novo nivel/restaurante descoberto expande a cidade
- Elementos visuais colecionaveis
- Minijogos simples integrados a cidade

### V2 — Temporadas
- Temporadas de 3 meses com tema
- Missoes exclusivas da temporada
- Recompensas limitadas (FOMO saudavel)
- Reset parcial de progresso (apenas ranking)

### V2 — Passe do Borinha
- Passe gratuito e premium
- Premium: R$ 9,90/mes (receita adicional)
- Recompensas exclusivas: cosmeticos lendarios, coins bonus, cupons melhores
- Sem pay-to-win (apenas cosmeticos e conveniencia)

### V2 — Ranking e Leaderboard
- Ranking semanal de XP ganho
- Ranking de missoes completadas
- Badges de top 10, top 100
- Competicao saudavel (anonimizada, opcional)

### V2 — Eventos ao Vivo
- Eventos de tempo limitado (24h, 48h, fim de semana)
- Missoes com multiplicadores de XP/coins
- Colaboracao com restaurantes parceiros (missoes patrocinadas)
- Drop de itens raros

### V2 — Colecionaveis e Skins
- Sistema de raridade (comum, raro, epico, lendario)
- Skins para o Borinha com animacoes unicas
- Colecao de itens tematicos por restaurante
- Trading simples entre usuarios? (avaliar)

### V2 — Social Features
- Visitar perfil do Borinha de amigos
- Presentear coins (limitado)
- Missoes cooperativas (2+ usuarios)
- Compartilhar conquistas nas redes sociais

### V3 — IA e Personalizacao
- Missoes personalizadas por perfil de consumo
- ML para prever risco de churn e oferecer missoes de retencao
- Recomendacao de restaurantes baseada em missoes
- Borinha com dialogos gerados (IA conversacional)

## 12.5 Expansao para Restaurantes (B2B)

### Loja do Restaurante (V2)
- Restaurantes podem criar missoes patrocinadas
- "Peca 3x na Pizzaria X, ganhe 50 Bora Coins extras"
- Custo para o restaurante: % do valor da missao
- Nova fonte de receita para o Bora

### Fidelidade por Restaurante (V2)
- Alem do Borinha, restaurantes tem seu proprio "mascote"
- Progresso por restaurante (pedidos, avaliacoes)
- Cupons exclusivos do restaurante
- Cross-selling entre restaurantes parceiros

## 12.6 Principios para Expansao

1. **Nunca P2W:** Jogadores gratuitos sempre podem obter tudo (mesmo que mais lento)
2. **Sustentabilidade financeira:** Cada feature paga deve gerar ROI positivo
3. **Valor triplo:** Cliente, Restaurante e Bora ganham com cada feature
4. **Modularidade:** Cada expansao e um modulo plugavel, sem reescrever o core
5. **Dados primeiro:** Toda decisao de V2+ baseada em dados do MVP

---

## 12.7 Resumo do Investimento Total

| Item | Estimativa |
|---|---|
| Tempo desenvolvimento (8 semanas) | 3 pessoas x 320h = 960h |
| Custo Firestore mensal (pos-MVP) | ~US$ 10-20/mes |
| Custo cupons (estimado 30 dias) | R$ 40-50 por usuario ativo/mes max |
| Receita incremental esperada | +10% LTV em 90 dias |
| Break-even estimado | 3-4 meses |
