# 04 — Arquitetura Tecnica

## 4.1 Estrutura de Pastas

```
app/
  (gamification)/                     # Route group (nao afeta URL)
    missoes/page.tsx                  # Missoes diarias + semanais
    loja/page.tsx                     # Loja de recompensas
    historico/page.tsx                # Historico de atividades
    perfil/page.tsx                   # Perfil do Borinha
  api/gamification/
    profile/route.ts                  # GET perfil
    missions/
      route.ts                        # GET missoes ativas
      refresh/route.ts                # POST forcar refresh (admin/teste)
      [missionId]/complete/route.ts   # POST completar missao
      [missionId]/claim/route.ts      # POST resgatar recompensa
    streak/login/route.ts             # POST registrar login streak
    actions/route.ts                  # POST processar acao generica
    shop/
      route.ts                        # GET itens loja
      purchase/route.ts               # POST comprar item
    inventory/
      route.ts                        # GET inventario
      equip/route.ts                  # POST equipar cosmetico
    xp/route.ts                       # GET historico XP
    coins/route.ts                    # GET historico coins
    cupons/
      route.ts                        # GET cupons resgatados
      validate/route.ts               # POST validar cupom Bora
    analytics/route.ts                # POST registrar evento
    admin/
      missions/route.ts               # CRUD mission_definitions
      shop/route.ts                   # CRUD shop_items
      experiments/route.ts            # CRUD experimentos A/B

src/
  services/gamification/
    gamification.service.ts           # Orquestrador principal
    xp.service.ts                     # Calculo e emissao de XP
    coins.service.ts                  # Calculo e emissao de Bora Coins
    streak.service.ts                 # Logica de login streak
    mission.service.ts                # Atribuicao, progresso, conclusao
    shop.service.ts                   # Loja e resgate
    inventory.service.ts              # Inventario e equipagem
    cupom.service.ts                  # Geracao e validacao de cupons
    analytics.service.ts              # Registro de eventos
    economy.service.ts                # Regras de economia e limites
    feature-flag.service.ts           # Feature flags
    action-dispatcher.ts              # Mapeia eventos -> acoes gamification

  repositories/gamification/
    profile.repository.ts             # CRUD GamificationProfile
    mission.repository.ts             # CRUD ActiveMission
    inventory.repository.ts           # CRUD InventoryItem
    transaction.repository.ts         # XP e Coin transactions
    shop.repository.ts                # Shop items
    mission-definition.repository.ts  # Mission definitions
    analytics.repository.ts           # Analytics events

  hooks/gamification/
    useGamification.ts                # Hook raiz (perfil + missoes + streak)
    useMissions.ts                    # Missoes ativas
    useShop.ts                        # Loja
    useInventory.ts                   # Inventario
    useHistory.ts                     # Historico XP/Coins/Cupons
    useXpBar.ts                       # Barra de XP animada

  contexts/gamification/
    GamificationProvider.tsx           # Provider principal
    GamificationContext.tsx            # Contexto

  components/gamification/
    BorinhaAvatar.tsx                 # Avatar do Borinha
    XpBar.tsx                         # Barra de XP animada
    LevelBadge.tsx                    # Badge de nivel
    LevelUpOverlay.tsx                # Overlay de level up
    CoinsDisplay.tsx                  # Exibicao de Bora Coins
    MissionCard.tsx                   # Card de missao
    MissionList.tsx                   # Lista de missoes
    MissionProgress.tsx               # Barra de progresso
    MissionCompletedToast.tsx         # Toast missao concluida
    StreakBadge.tsx                   # Badge de streak
    StreakCalendar.tsx                # Calendario de streak
    ShopItemCard.tsx                  # Card item loja
    ShopGrid.tsx                      # Grid loja
    InventoryGrid.tsx                 # Grid inventario
    HistoryTimeline.tsx               # Timeline historico
    CoinEarnAnimation.tsx             # Animacao coins ganhas
    XpEarnAnimation.tsx               # Animacao XP ganho
    BorinhaReaction.tsx               # Reacoes do Borinha
    index.ts                          # Barrel export

  lib/gamification/
    levels.ts                         # Tabela de niveis e formulas
    constants.ts                      # Constantes (XP, coins, limites)
    validators.ts                     # Validações Zod
    helpers.ts                        # Funcoes auxiliares
    errors.ts                         # Erros especificos

  types/gamification/
    index.ts                          # Re-export
    profile.ts, mission.ts, shop.ts
    inventory.ts, transactions.ts
    streak.ts, cupom.ts, analytics.ts
    feature-flags.ts, ab-test.ts
    enums.ts
```

## 4.2 Servicos (Server-Side)

### GamificationService (Orquestrador)
```
class GamificationService {
  async onUserLogin(userId): Promise<LoginResult>
  async onAppOpen(userId): Promise<void>
  async processAction(userId, action: UserAction): Promise<ActionResult>
  async getPlayerState(userId): Promise<PlayerState>
}
```

### XpService
```
class XpService {
  calculateXpForAction(action, params?): number
  calculateLevel(totalXp): number
  calculateXpForNextLevel(currentLevel): number
  calculateXpProgress(currentLevel, currentXp): XpProgress
  async awardXp(userId, amount, source, sourceId?): Promise<AwardXpResult>
  async getXpHistory(userId, limit?, cursor?): Promise<PaginatedResult>
}
```

### CoinsService
```
class CoinsService {
  calculateCoinsForAction(action, params?): number
  async canEarnCoins(userId, amount): Promise<boolean>
  async awardCoins(userId, amount, source, sourceId?): Promise<AwardCoinsResult>
  async spendCoins(userId, amount, itemId): Promise<SpendCoinsResult>
  async getCoinHistory(userId, limit?, cursor?): Promise<PaginatedResult>
  async getMonthlyCoinsEarned(userId): Promise<number>
}
```

### StreakService
```
class StreakService {
  async processLogin(userId): Promise<StreakResult>
  async getStreak(userId): Promise<StreakInfo>
  async checkStreakReward(userId, streakDays): Promise<StreakReward|null>
}
```

### MissionService
```
class MissionService {
  async assignDailyMissions(userId): Promise<ActiveMission[]>
  async assignWeeklyMissions(userId): Promise<ActiveMission[]>
  async getActiveMissions(userId, type): Promise<ActiveMission[]>
  async updateProgress(userId, action, amount?): Promise<MissionProgressResult[]>
  async completeMission(userId, missionId): Promise<CompleteMissionResult>
  async claimMissionReward(userId, missionId): Promise<ClaimRewardResult>
  async checkExpiredMissions(userId): Promise<ActiveMission[]>
}
```

### ShopService
```
class ShopService {
  async getItems(): Promise<ShopItem[]>
  async getItem(itemId): Promise<ShopItem>
  async purchaseItem(userId, itemId): Promise<PurchaseResult>
  async canPurchase(userId, itemId): Promise<ValidationResult>
}
```

### InventoryService
```
class InventoryService {
  async getInventory(userId): Promise<InventoryItem[]>
  async addItem(userId, itemId, acquiredVia): Promise<InventoryItem>
  async equipItem(userId, itemId): Promise<void>
  async unequipItem(userId, itemId): Promise<void>
  async getEquippedCosmetics(userId): Promise<EquippedCosmetics>
}
```

### CupomService
```
class GamificationCupomService {
  async generateCupom(userId, shopItemId): Promise<string>
  async validateCupom(userId, code, orderValue, orderId): Promise<ValidationResult>
  async applyCupom(userId, code, orderId): Promise<void>
  async getUserCupons(userId): Promise<GameCupomResgate[]>
  async getLastCupomResgate(userId): Promise<Date|null>
  async expireCupons(): Promise<void>
}
```

### EconomyService
```
class EconomyService {
  async canEarnCoins(userId, amount): Promise<boolean>
  async canRedeemCupom(userId): Promise<boolean>
  getMonthlyCoinsCap(): number
  getDailyCoinsCap(): number
  getMaxCoinBalance(): number
  getMinDaysBetweenCupons(): number
  calculateMinOrderForCupom(cupomValue): number
  validateCupomEconomy(userId, cupomValue, orderValue, paymentMethod): Promise<boolean>
}
```

## 4.3 Hooks (Client-Side)

### useGamification
```
{
  profile, loading, error, refresh,
  streak: StreakInfo,
  processLoginStreak: () => Promise<StreakResult>,
  handleAction: (action: UserAction) => Promise<ActionResult>,
  showLevelUp, levelUpData, dismissLevelUp,
  showCoinEarn, coinEarnData, dismissCoinEarn
}
```

### useMissions
```
{
  dailyMissions: ActiveMission[],
  weeklyMissions: ActiveMission[],
  loading,
  completeMission, claimReward,
  isMissionClaimable,
  timeUntilRefresh: { daily, weekly }
}
```

### useShop
```
{
  items: ShopItem[],
  loading,
  purchase: (itemId) => Promise<PurchaseResult>,
  canAfford: (item) => boolean,
  canPurchase: (item) => boolean,
  userCoins: number
}
```

### useInventory
```
{
  items: InventoryItem[],
  equipItem, unequipItem,
  isEquipped: (itemId) => boolean,
  equippedCosmetics: EquippedCosmetics
}
```

### useHistory
```
{
  xpTransactions, coinTransactions, cuponResgates,
  loading, hasMore: { xp, coins, cupons },
  loadMore: (type) => Promise<void>
}
```

### useXpBar
```
{
  currentLevel, currentXp,
  xpForCurrentLevel, xpForNextLevel,
  progressPercent, xpToNextLevel
}
```

## 4.4 API Routes

| Metodo | Rota | Descricao |
|---|---|---|
| POST | /api/gamification/streak/login | Processa login streak |
| GET | /api/gamification/profile | Retorna GamificationProfile |
| GET | /api/gamification/missions?type=daily|weekly | Missoes ativas |
| POST | /api/gamification/missions/:id/complete | Completar missao |
| POST | /api/gamification/missions/:id/claim | Resgatar recompensa |
| POST | /api/gamification/actions | Processar acao (XP + progresso missoes) |
| GET | /api/gamification/shop | Itens da loja |
| POST | /api/gamification/shop/purchase | Comprar item |
| POST | /api/gamification/inventory/equip | Equipar cosmetico |
| GET | /api/gamification/xp | Historico XP |
| GET | /api/gamification/coins | Historico coins |
| POST | /api/gamification/cupons/validate | Validar cupom Bora |
| GET | /api/gamification/cupons | Cupons resgatados |
| POST | /api/gamification/analytics | Registrar evento |
| GET/POST/PUT/DELETE | /api/gamification/admin/missions | CRUD missoes |
| GET/POST/PUT/DELETE | /api/gamification/admin/shop | CRUD loja |
| GET/POST/PUT/DELETE | /api/gamification/admin/experiments | CRUD experimentos |

## 4.5 Rate Limiting

| Rota | Limite | Janela |
|---|---|---|
| /api/gamification/actions | 30 req/min | 1 min |
| /api/gamification/shop/purchase | 10 req/min | 1 min |
| /api/gamification/cupons/validate | 5 req/min | 1 min |
| /api/gamification/streak/login | 10 req/min | 1 min |
| /api/gamification/missions/:id/complete | 20 req/min | 1 min |

Implementacao MVP: rate limiter in-memory no middleware Next.js.
Futuro: migrar para Redis.

## 4.6 Integracao com Sistema Existente

### Provider Hierarchy (app/layout.tsx)
```
ErrorBoundary > AuthProvider > CapacitorInit > ConfirmProvider >
GamificationProvider > children
PushTokenRegistrar (sibling)
```

### Action Dispatcher — Integracao com Hooks Existentes
```
src/services/gamification/action-dispatcher.ts

const ACTION_MAP = {
  "order:created":           { action: "order_placed", xp: 50 },
  "order:first_restaurant":  { action: "discover_restaurant", xp: 80 },
  "review:submitted":        { action: "reviewed", xp: 30 },
  "review:with_photo":       { action: "reviewed_with_photo", xp: 45 },
  "favorite:restaurant":     { action: "favorited_restaurant", xp: 20 },
  "favorite:product":        { action: "favorited_product", xp: 10 },
  "category:new":            { action: "new_category", xp: 40 },
  "repurchase":              { action: "bought_again", xp: 60 },
};
```

Hooks existentes (`useReviews`, `useFavorites`, etc.) devem chamar `dispatchAction` apos operacoes bem-sucedidas.

### Fluxo de Acao do Usuario
```
Usuario faz acao (favoritar, avaliar, pedir...)
  |
  v
Componente/Hook existente processa acao
  |
  v
Apos sucesso, chama POST /api/gamification/actions { idempotencyKey }
  |
  v
GamificationService.processAction():
  1. Verifica idempotencia
  2. Award XP (XpService)
  3. Update mission progress (MissionService)
  4. Check mission completion -> award coins (CoinsService)
  5. Track analytics event (AnalyticsService)
  6. Return { xpEarned, missionsUpdated, coinsEarned, leveledUp }
  |
  v
Cliente exibe animacoes (XP ganho, coins, missao concluida, level up)
  |
  v
Atualiza perfil via onSnapshot (Firestore real-time)
```

## 4.7 Middleware (Autenticacao)

- Rotas `/api/gamification/admin/*` exigem role `admin` ou `owner`
- Todas as rotas `/api/gamification/*` exigem sessao valida (exceto admin que verifica role)
- Middleware existente (`middleware.ts`) deve ser atualizado com as novas rotas

## 4.8 Path Aliases (tsconfig.json)

Adicionar:
```
"@gamification/*": ["./src/services/gamification/*"],
"@gamification-hooks/*": ["./src/hooks/gamification/*"],
"@gamification-components/*": ["./src/components/gamification/*"],
"@gamification-types/*": ["./src/types/gamification/*"]
```
