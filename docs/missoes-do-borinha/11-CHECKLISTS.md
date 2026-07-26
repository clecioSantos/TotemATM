# 11 — Checklists

## 11.1 Checklist Tecnico

### Infraestrutura
- [ ] Estrutura de pastas criada
- [ ] Path aliases configurados (tsconfig.json)
- [ ] Pacotes npm instalados (vitest, testing-library, playwright, msw, zod)
- [ ] Firebase Emulator configurado
- [ ] Plano Blaze ativado
- [ ] Indices Firestore criados
- [ ] Firestore rules atualizadas

### Tipagem e Validacao
- [ ] Todos os tipos TypeScript definidos e exportados
- [ ] Zod schemas para todas as entidades
- [ ] Interfaces de repositorio definidas
- [ ] Interfaces de servico definidas
- [ ] DTOs para API requests/responses
- [ ] Tipos de erro customizados

### Repositories
- [ ] ProfileRepository (CRUD GamificationProfile)
- [ ] MissionRepository (CRUD ActiveMission)
- [ ] InventoryRepository (CRUD InventoryItem)
- [ ] TransactionRepository (XP e Coin)
- [ ] ShopRepository (ShopItem)
- [ ] MissionDefinitionRepository
- [ ] AnalyticsRepository
- [ ] Testados com Firebase Emulator

### Services
- [ ] GamificationService (orquestrador)
- [ ] XpService
- [ ] CoinsService
- [ ] StreakService
- [ ] MissionService
- [ ] ShopService
- [ ] InventoryService
- [ ] GamificationCupomService
- [ ] EconomyService
- [ ] GamificationAnalyticsService
- [ ] FeatureFlagService
- [ ] ActionDispatcher
- [ ] RateLimiter

### API Routes
- [ ] POST /api/gamification/streak/login
- [ ] GET /api/gamification/profile
- [ ] GET /api/gamification/missions?type=
- [ ] POST /api/gamification/missions/:id/complete
- [ ] POST /api/gamification/missions/:id/claim
- [ ] POST /api/gamification/actions
- [ ] GET /api/gamification/shop
- [ ] POST /api/gamification/shop/purchase
- [ ] POST /api/gamification/inventory/equip
- [ ] GET /api/gamification/xp
- [ ] GET /api/gamification/coins
- [ ] GET /api/gamification/cupons
- [ ] POST /api/gamification/cupons/validate
- [ ] POST /api/gamification/analytics
- [ ] CRUD /api/gamification/admin/missions
- [ ] CRUD /api/gamification/admin/shop
- [ ] CRUD /api/gamification/admin/experiments

### Contextos e Hooks
- [ ] GamificationProvider
- [ ] useGamification
- [ ] useMissions
- [ ] useShop
- [ ] useInventory
- [ ] useHistory
- [ ] useXpBar

### Componentes
- [ ] BorinhaAvatar
- [ ] XpBar
- [ ] LevelBadge
- [ ] LevelUpOverlay
- [ ] CoinsDisplay
- [ ] MissionCard
- [ ] MissionList
- [ ] MissionProgress
- [ ] MissionCompletedToast
- [ ] StreakBadge
- [ ] StreakCalendar
- [ ] ShopItemCard
- [ ] ShopGrid
- [ ] InventoryGrid
- [ ] CosmeticPicker
- [ ] HistoryTimeline
- [ ] BorinhaReaction
- [ ] XpEarnAnimation
- [ ] CoinEarnAnimation
- [ ] Barrel export (index.ts)

### Telas
- [ ] /perfil
- [ ] /missoes
- [ ] /loja
- [ ] /historico
- [ ] /admin/missoes
- [ ] /admin/gamification (dashboard)

### Integracao Sistema Existente
- [ ] GamificationProvider adicionado ao layout.tsx
- [ ] GamificationService.onUserLogin() chamado no login
- [ ] Action Dispatcher integrado com useReviews
- [ ] Action Dispatcher integrado com useFavorites
- [ ] Action Dispatcher integrado com fluxo de pedidos
- [ ] Validacao de cupons Bora no checkout
- [ ] Middleware atualizado com novas rotas
- [ ] Botao/link gamification na navbar/totem

### Seguranca
- [ ] Rate Limiting ativo em todas as rotas
- [ ] Idempotency keys implementadas
- [ ] Transacoes Firestore atomicas para saldo
- [ ] Server-side validation (Zod) em todas as rotas
- [ ] Cliente nunca calcula XP/coins
- [ ] Streak usa serverTimestamp exclusivamente
- [ ] Caps validados no servidor
- [ ] Validacao de margem nos cupons
- [ ] Firestore rules: cliente nunca escreve direto
- [ ] Sanitizacao de inputs

### Feature Flags
- [ ] FeatureFlagService implementado
- [ ] Cache em memoria (5 min TTL)
- [ ] Hash deterministico para rollout
- [ ] Flags criadas: gamification_enabled, missions_enabled, etc.
- [ ] Integradas em todos os componentes/telas

### A/B Testing
- [ ] AbExperimentService implementado
- [ ] Atribuicao deterministica (hash userId)
- [ ] Eventos de atribuicao e conversao
- [ ] CRUD admin para experimentos

---

## 11.2 Checklist Funcional

### Perfil
- [ ] Usuario novo: perfil criado automaticamente (nivel 1)
- [ ] Avatar + moldura + titulo exibidos corretamente
- [ ] XP e nivel exibidos
- [ ] Barra de XP com animacao
- [ ] Nivel sobe ao atingir XP necessario
- [ ] LevelUpOverlay exibido com recompensas
- [ ] Bora Coins exibidas
- [ ] Streak exibido com badge
- [ ] Conquistas listadas
- [ ] Link para inventario
- [ ] Link para historico

### Streak
- [ ] Login dia 1: streak 1
- [ ] Login consecutivo: streak incrementa
- [ ] Login mesmo dia: nao conta 2x
- [ ] Pulou dia: reseta para 1
- [ ] Milestone 3 dias: 5 coins
- [ ] Milestone 7 dias: 15 coins + badge
- [ ] Milestone 30 dias: 50 coins + moldura
- [ ] Badge visual muda por faixa

### Missoes Diarias
- [ ] 3 missoes atribuidas diariamente
- [ ] Respeita minLevel/maxLevel
- [ ] Respeita segmento (new/returning/power)
- [ ] Respeita pesos (weight)
- [ ] Progresso atualiza com acoes do usuario
- [ ] Missao completada ao atingir threshold
- [ ] Botao Resgatar visivel
- [ ] Recompensa resgatada (XP + coins)
- [ ] Missao expira ao final do dia
- [ ] Refresh automatico na virada do dia

### Missoes Semanais
- [ ] 3 missoes atribuidas semanalmente
- [ ] Progresso acumula durante a semana
- [ ] Expira ao final da semana
- [ ] Refresh automatico na segunda 00:00

### Loja
- [ ] Itens listados com precos
- [ ] Filtro cosmeticos vs cupons
- [ ] Secao destaques
- [ ] Saldo insuficiente: botao desabilitado
- [ ] Compra bem sucedida: saldo atualizado
- [ ] Cosmetico: adicionado ao inventario
- [ ] Cupom: codigo gerado e exibido
- [ ] Cant purchase if already owned

### Inventario
- [ ] Itens possuidos listados por categoria
- [ ] Equipar/alternar cosmeticos
- [ ] Preview ao vivo do Borinha
- [ ] Apenas 1 equipado por tipo (avatar, frame, title)

### Historico
- [ ] Timeline ordenada por data
- [ ] Filtro XP / Coins / Cupons / Todos
- [ ] Infinite scroll (10 itens por pagina)
- [ ] Agrupamento por data
- [ ] Icones corretos por tipo

### Cupons Bora
- [ ] Geracao com prefixo BORA_
- [ ] Validacao completa (12 regras)
- [ ] Aplicacao no checkout
- [ ] Rejeicoes com mensagens claras
- [ ] Uso unico
- [ ] Expiracao automatica (30 dias)

### Admin — Missoes
- [ ] Listar todas missoes
- [ ] Criar nova missao
- [ ] Editar missao existente
- [ ] Ativar/desativar missao
- [ ] Filtrar por tipo/status
- [ ] Mudancas em tempo real (sem deploy)

### Admin — Loja
- [ ] Listar itens
- [ ] Criar novo item
- [ ] Editar item
- [ ] Ativar/desativar item

### Admin — Dashboard
- [ ] Metricas principais (DAU, WAU, MAU)
- [ ] Grafico missoes completadas
- [ ] Grafico coins emitidas vs gastas
- [ ] Tabela cupons resgatados

---

## 11.3 Checklist de QA

### Geral
- [ ] Todas as telas renderizam sem erros
- [ ] Navegacao entre telas funciona
- [ ] Estados de loading exibidos corretamente
- [ ] Estados vazios exibidos corretamente
- [ ] Estados de erro exibidos com retry
- [ ] Responsivo (mobile 375px, tablet, desktop)
- [ ] Modo escuro (se suportado)
- [ ] Acessibilidade basica (teclado, screen reader)

### Animações
- [ ] Respeitam prefers-reduced-motion
- [ ] Nao causam layout shift
- [ ] Performance 60fps
- [ ] Corretas em todas as resolucoes

### Edge Cases
- [ ] Usuario sem nenhuma atividade
- [ ] Usuario nivel maximo (50+)
- [ ] Usuario com coins no cap maximo (2000)
- [ ] Usuario com streak > 365 dias
- [ ] Missao com threshold 0 (nao deve existir)
- [ ] Muitos itens no inventario (100+)
- [ ] Muitas transacoes no historico (paginacao)

---

## 11.4 Checklist de Seguranca

- [ ] Review de todas as validacoes server-side
- [ ] Review de rate limiting
- [ ] Review de idempotencia
- [ ] Review de transacoes atomicas
- [ ] Teste de todas as regras Firestore
- [ ] Penetration test basico (10 cenarios anti-fraude)
- [ ] Verificacao de logs (sem dados sensiveis)
- [ ] Review de permissoes admin

---

## 11.5 Checklist de Deploy

- [ ] Variaveis de ambiente configuradas
- [ ] Indices Firestore criados no ambiente de producao
- [ ] Firestore rules atualizadas
- [ ] Plano Blaze ativo
- [ ] Feature flag `gamification_enabled` em 0% inicialmente
- [ ] Smoke tests no ambiente de staging
- [ ] Rollout gradual: 10% -> 50% -> 100%
- [ ] Monitoramento de erros ativo
- [ ] Plano de rollback documentado

---

## 11.6 Checklist de Observabilidade

- [ ] Logs estruturados em todos os servicos
- [ ] Erros registrados com stack trace
- [ ] Metricas de performance (tempo de resposta APIs)
- [ ] Metricas de Firestore (reads/writes/deletes)
- [ ] Alertas configurados (erro rate > 1%, latencia > 1s)
- [ ] Dashboard de saude do modulo

---

## 11.7 Checklist de Metricas (Pos-Lancamento)

### 7 dias
- [ ] DAU gamification registrado
- [ ] Missoes atribuidas vs completadas
- [ ] 0 erros de integridade (saldo negativo, duplicado)
- [ ] Custo cupons < 30% margem

### 30 dias
- [ ] Retencao D7 comparada (gamification vs controle)
- [ ] Retencao D30 comparada
- [ ] ROI gamification calculado
- [ ] A/B tests com resultados preliminares
- [ ] Ajustes de balanceamento baseado em dados

### 90 dias
- [ ] Report completo de impacto no negocio
- [ ] Decisoes sobre V2 baseadas em dados
- [ ] Otimizacoes de custo Firestore
