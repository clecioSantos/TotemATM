# 10 — Plano de Implementacao e Roadmap

## 10.1 Fases

### Fase 0 — Fundacao (Semanas 1-2)
**Objetivo:** Infraestrutura basica, tipagens, repositorios.

```
[ ] Criar estrutura completa de pastas
[ ] Definir e exportar todos os tipos TypeScript
[ ] Criar Zod schemas de validacao
[ ] Criar constantes (niveis, caps, thresholds)
[ ] Criar helpers e utilitarios
[ ] Criar repositories Firestore
[ ] Criar FeatureFlagService
[ ] Criar AnalyticsService
[ ] Configurar firestore.rules
[ ] Configurar firestore.indexes.json
[ ] Seed inicial: mission_definitions, shop_items
[ ] Configurar vitest + ambiente de testes
[ ] Testes unitarios: levels, helpers, constants, validators (95%)

Entregaveis:
- Tipos completos
- Schemas validando
- Repositories funcionais
- Ambiente de testes configurado
```

### Fase 1 — Core Gamification (Semanas 2-3)
**Objetivo:** XP, niveis, streak e coins funcionando.

```
[ ] XpService com calculos e emissao
[ ] CoinsService com calculos e caps
[ ] StreakService com logica de streak
[ ] EconomyService com regras de margem
[ ] GamificationService (orquestrador)
[ ] API Routes: profile, streak/login, actions
[ ] GamificationProvider (contexto)
[ ] useGamification, useXpBar hooks
[ ] Componentes: BorinhaAvatar, XpBar, LevelBadge, CoinsDisplay
[ ] Componentes: LevelUpOverlay, StreakBadge, StreakCalendar
[ ] Componentes: XpEarnAnimation, CoinEarnAnimation
[ ] Tela: /perfil (avatar + XP + coins + streak)
[ ] Integracao: GamificationService.onUserLogin() no login
[ ] Rate limiting middleware
[ ] Testes unitarios: todos services
[ ] Testes integracao: profile API, streak flow, XP flow
[ ] Testes E2E: perfil basico, streak

Entregaveis:
- Usuario loga -> perfil criado, streak conta
- XP ganho -> barra anima, nivel sobe
- Coins ganhas -> saldo atualiza
- Caps e limites funcionando
- 90% cobertura testes
```

### Fase 2 — Missoes (Semanas 3-5)
**Objetivo:** Missoes diarias e semanais completamente funcionais.

```
[ ] MissionService com atribuicao, progresso, conclusao
[ ] MissionDefinition repository
[ ] API Routes: missions (GET, complete, claim, refresh)
[ ] API Route: actions (processar acao -> atualizar missoes)
[ ] useMissions hook
[ ] Componentes: MissionCard, MissionList, MissionProgress
[ ] Componentes: MissionCompletedToast
[ ] Tela: /missoes
[ ] Action Dispatcher: integrar com hooks existentes (reviews, favorites, orders)
[ ] Admin: CRUD de mission_definitions
[ ] Admin: tela /admin/missoes
[ ] Testes unitarios: MissionService
[ ] Testes integracao: fluxo missao completo
[ ] Testes E2E: completar missao, resgatar recompensa
[ ] Testes regressao: validacao automatica de novas missoes

Entregaveis:
- 3 missoes diarias + 3 semanais atribuidas
- Progresso atualizado via acoes do usuario
- Completar e resgatar funcionando
- Admin pode criar/editar/desativar missoes sem deploy
```

### Fase 3 — Loja e Recompensas (Semanas 5-6)
**Objetivo:** Loja de recompensas e sistema de cupons.

```
[ ] ShopService com compra e validacao
[ ] InventoryService com equipagem
[ ] CupomService com geracao e validacao
[ ] API Routes: shop (GET, purchase), inventory (GET, equip)
[ ] API Routes: cupons (GET, validate)
[ ] useShop, useInventory hooks
[ ] Componentes: ShopItemCard, ShopGrid, InventoryGrid
[ ] Componentes: CosmeticPicker (selecao de cosmeticos)
[ ] Tela: /loja
[ ] Integracao cupons Bora no checkout existente
[ ] Admin: CRUD shop_items, tela administracao
[ ] Testes unitarios: ShopService, InventoryService, CupomService
[ ] Testes integracao: compra loja, validacao cupom
[ ] Testes E2E: comprar item, equipar, resgatar cupom, aplicar no pedido

Entregaveis:
- Loja funcional (cosmeticos + cupons)
- Compra com transacao atomica
- Cupons Bora integrados ao checkout
- Inventario e equipagem funcionais
```

### Fase 4 — Historico e Analytics (Semanas 6-7)
**Objetivo:** Historico de atividades e eventos de analytics.

```
[ ] useHistory hook com paginacao infinita
[ ] Componentes: HistoryTimeline
[ ] Tela: /historico
[ ] AnalyticsService completo com todos os eventos
[ ] API Route: analytics (POST)
[ ] Integracao eventos em todos os fluxos
[ ] Admin: Dashboard basico /admin/gamification
[ ] Testes E2E: historico, dashboard admin

Entregaveis:
- Timeline de atividades (XP, coins, cupons)
- Eventos analytics registrados em todos os fluxos
- Dashboard admin basico (metricas principais)
```

### Fase 5 — Polimento e Lancamento (Semanas 7-8)
**Objetivo:** Feature flags, A/B testing, otimizacoes e lancamento.

```
[ ] FeatureFlagService completo com cache
[ ] AbExperimentService com atribuicao
[ ] Integracao feature flags em todo o modulo
[ ] Admin: CRUD feature flags e experimentos
[ ] Testes de performance (Firestore queries)
[ ] Testes anti-fraude (10 cenarios)
[ ] Otimizacao de leituras Firestore
[ ] Configuracao de indices Firestore
[ ] Revisao de seguranca completa
[ ] Documentacao final
[ ] Plano de rollback
[ ] Deploy gradual (10% -> 50% -> 100%)
```

## 10.2 Cronograma Estimado

| Fase | Semanas | Equipe |
|---|---|---|
| Fase 0 — Fundacao | 1-2 | 2 devs |
| Fase 1 — Core | 2-3 | 2 devs |
| Fase 2 — Missoes | 3-5 | 2 devs + 1 QA |
| Fase 3 — Loja | 5-6 | 2 devs + 1 QA |
| Fase 4 — Historico/Analytics | 6-7 | 2 devs |
| Fase 5 — Polimento | 7-8 | 2 devs + 1 QA |
| **Total** | **8 semanas** | **3 pessoas** |

## 10.3 Marcos (Milestones)

| Semana | Marco |
|---|---|
| 2 | Infraestrutura pronta, testes configurados, tipagens completas |
| 3 | Perfil + XP + Streak funcionando (demo interno) |
| 5 | Missoes diarias e semanais funcionando (beta fechado) |
| 6 | Loja + cupons funcionando (beta expandido) |
| 7 | Historico + analytics completos |
| 8 | Lancamento gradual 10% usuarios |

## 10.4 Dependencias Externas

| Dependencia | Status | Bloqueia |
|---|---|---|
| Plano Blaze Firestore | Necessario (20k writes/dia insuficiente) | Fase 3+ |
| Firebase Emulator | Necessario para testes | Fase 0 |
| Configuracao indices Firestore | Necessario para queries | Fase 1 |
| Integracao com hooks existentes | Modificar useReviews, useFavorites, etc. | Fase 2 |
| Integracao checkout (cupons Bora) | Validacao no fluxo de pedido | Fase 3 |
