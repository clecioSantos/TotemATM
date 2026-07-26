# 08 — Estrategia de Testes

## 8.1 Configuracao

### Frameworks (adicionar ao package.json)
```
"devDependencies": {
  "vitest": "^2.x",
  "@testing-library/react": "^16.x",
  "@testing-library/jest-dom": "^6.x",
  "@testing-library/user-event": "^14.x",
  "playwright": "^1.x",
  "msw": "^2.x",
  "@firebase/rules-unit-testing": "^3.x",
  "jsdom": "^25.x"
}
```

### Scripts
```
"test": "vitest",
"test:coverage": "vitest --coverage",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:regression": "vitest --config vitest.regression.config.ts"
```

### Cobertura Minima
| Categoria | Cobertura |
|---|---|
| Services (gamification) | 95% |
| Utilitarios (levels, helpers, validators) | 95% |
| Hooks (gamification) | 90% |
| Componentes UI (gamification) | 85% |
| Repository | 80% |
| API Routes | 90% |
| **Regras de negocio em geral** | **90%** |

## 8.2 Testes Unitarios

### XpService (15+ testes)
- calculateXpForAction: XP correto por acao
- calculateXpForAction: 0 para acao invalida
- calculateLevel: nivel correto para cada faixa de XP
- calculateXpForNextLevel: valor correto
- calculateXpProgress: percentual correto, nunca >100% ou <0%
- awardXp: atualiza currentXp, totalXp
- awardXp: sobe de nivel quando XP suficiente
- awardXp: sobe multiplos niveis se XP grande
- awardXp: registra transacao XpTransaction
- awardXp: retorna booleano leveledUp

### CoinsService (12+ testes)
- calculateCoinsForAction: coins corretos por acao
- canEarnCoins: abaixo do cap diario = true
- canEarnCoins: acima do cap diario = false
- canEarnCoins: abaixo do cap mensal = true
- canEarnCoins: acima do cap mensal = false
- awardCoins: incrementa saldo, registra transacao, atualiza monthlyCoinsEarned
- spendCoins: decrementa saldo, bloqueia saldo insuficiente
- getMonthlyCoinsEarned: reseta no novo mes

### StreakService (12+ testes)
- processLogin: primeiro login -> streak 1
- processLogin: login consecutivo -> streak +1
- processLogin: mesmo dia -> streak mantido
- processLogin: pulou 1 dia -> reset para 1
- processLogin: pulou 2+ dias -> reset para 1
- processLogin: atinge milestones (3, 7, 30, 365 dias) -> recompensas corretas
- processLogin: usa serverTimestamp, ignora client timestamp
- checkStreakReward: null para dias sem milestone

### MissionService (15+ testes)
- assignDailyMissions: retorna 3 missoes do tipo correto
- assignDailyMissions: respeita minLevel/maxLevel/segment
- assignDailyMissions: nao repete missao ja completada
- assignDailyMissions: respeita pesos (weight)
- updateProgress: incrementa progresso, nao excede threshold
- updateProgress: marca completed ao atingir threshold
- updateProgress: nao atualiza missao ja completed/expirada
- completeMission: so funciona se progress >= threshold
- claimMissionReward: emite XP, coins, cosmetico
- claimMissionReward: nao permite re-claim

### EconomyService (10+ testes)
- canEarnCoins: verifica caps diario/mensal
- canRedeemCupom: verifica intervalo 7 dias
- calculateMinOrderForCupom: R$5->R$30, R$10->R$50, R$20->R$100
- validateCupomEconomy: rejeita cupom que zeraria margem
- validateCupomEconomy: max 50% da margem
- calculateMargin: PIX 7%, Cartao 4%

### Levels (10+ testes)
- XP_NIVEL(1)=100, (2)=200, (5)=750, (10)=2100, (20)=9000, (50)=17500
- totalXpForLevel: valores acumulados corretos
- getLevel: mapeamento correto
- getLevel(0): 1 (nivel minimo)
- getLevel(1e9): nao estoura

### Helpers (8+ testes)
- formatXP, formatCoins, formatStreakDays
- getTimeUntilRefresh: calculo correto
- getLevelTier: bronze/prata/ouro/diamante
- getStreakBadgeColor: cores por faixa
- generateIdempotencyKey: UUID valido
- isSameDay: timezone UTC-3

### Validators — Zod Schemas (10+ testes)
- GamificationProfile, ActiveMission, ShopItem, ActionRequest, AnalyticsEvent
- Validar campos obrigatorios, tipos, ranges, enums

## 8.3 Testes de Integracao

### Firestore Integration (Firebase Emulator)
- ProfileRepository: create, get, update, concurrent updates
- MissionRepository: assign, progress, complete, claim
- InventoryRepository: add, equip, unequip
- TransactionRepository: XP e Coin paginados
- MissionDefinitionRepository: CRUD
- ShopRepository: purchase com transacao atomica
- CupomRepository: generate e validate

### API Integration (Firebase Emulator + MSW)
- Todas as 16 API routes com cenarios de sucesso e erro
- Rate limiting: 429 apos exceder limite
- Auth: 401 sem token, 403 sem role admin

### Fluxo Completo: Missao Diaria
1. Criar usuario (Auth Emulator)
2. Inicializar GamificationProfile
3. Atribuir missoes diarias
4. Simular acao "favorite_restaurant"
5. Verificar progresso incrementou
6. Atingir threshold -> completed
7. Resgatar -> XP e coins adicionados
8. Verificar transacoes registradas

### Fluxo Completo: Compra Loja
1. Usuario com 200 coins
2. Listar loja
3. Comprar item 50 coins -> saldo 150
4. Item no inventario
5. Transacao registrada
6. Tentar item 200 coins -> erro
7. Saldo mantido 150

## 8.4 Testes End-to-End (Playwright)

### Cenario 1: Novo Jogador
Login primeiro acesso -> perfil nivel 1, 0 XP, streak 1 -> 3 missoes diarias -> toast boas-vindas

### Cenario 2: Completar Missao + Level Up
Login nivel 1 (90 XP) -> avaliar pedido +60 XP -> toast XP -> barra 50% (subiu nivel 2) -> LevelUpOverlay -> missao completed -> resgatar -> mais XP+coins

### Cenario 3: Streak
Dia 1: streak 1 -> Dia 2: streak 2 -> Dia 3: streak 3 + "5 Coins!" -> Pular dia 4 -> Dia 5: streak 1 (reset)

### Cenario 4: Loja + Cupom
150 coins -> comprar cupom R$5 (50 coins) -> codigo BORA_ -> pedido R$35 -> aplicar cupom -> desconto R$5 -> reusar cupom -> erro "ja utilizado"

### Cenario 5: Historico
Navegar /historico -> timeline ordenada -> filtrar XP/Coins/Cupons -> infinite scroll

### Cenario 6: Protecoes
Saldo insuficiente -> botao desabilitado
2 cupons em 7 dias -> erro
Pedido abaixo do minimo -> rejeitado
Pedido com promocao -> conflito rejeitado

### Cenario 7: Admin CRUD Missoes
Login admin -> /admin/missoes -> criar missao -> editar XP -> desativar -> missao some das atribuicoes

## 8.5 Testes de Regressao

Suite dedicada (`vitest.regression.config.ts`) executada em CI a cada PR e nightly.

### Regressao de Niveis
- Snapshot de todos os thresholds de nivel (1-100)
- Qualquer mudanca na formula = falha intencional (requer revisao)

### Regressao de Economia
- Simulacao usuario extremamente ativo 30 dias -> snapshot
- Margem negativa = falha
- Mudanca nos caps = falha intencional

### Regressao de Missoes
- Dado seed fixo, verificar missoes atribuidas
- Snapshot da selecao por tipo de usuario

### Teste Automatico para Novas Missoes
Quando nova missao adicionada ao `mission_definitions`:
1. Validar estrutura (Zod)
2. Verificar rewards nao excedem caps
3. Verificar condition.threshold > 0
4. Verificar weight 1-10
5. Simular atribuicao e completacao
6. Registrar snapshot

## 8.6 Testes de Performance

| Cenario | Meta (p50) | Meta (p99) |
|---|---|---|
| GET /api/gamification/profile | < 200ms | < 500ms |
| assignDailyMissions (50 definicoes) | < 300ms | - |
| processAction (3 missoes ativas) | < 150ms | - |
| GET /api/gamification/shop (30 itens) | < 100ms | - |
| purchaseItem (transacao Firestore) | < 500ms | - |

### Auditoria de Firestore Reads/Writes por Operacao
```
Operacao                  Reads  Writes
onUserLogin (streak)       1      1
processAction              2      1-4
assignDailyMissions        1      3
claimMissionReward         2      3-5
purchaseShopItem           3      2-3
validateCupom              2      0-1
loadMissionsScreen         2      0
loadShopScreen             1      0
```
Meta: <= 5 reads + 5 writes por acao.

## 8.7 Testes Anti-Fraude

10 cenarios de ataque simulados:
1. Requisicoes duplicadas (idempotencia)
2. Race condition (10 compras simultaneas)
3. Manipulacao de timestamp
4. Spam (rate limiting)
5. Injecao de progresso
6. Injecao de coins
7. Reuso de cupom
8. Skip de nivel
9. Acesso cross-user
10. Injecao de strings maliciosas
