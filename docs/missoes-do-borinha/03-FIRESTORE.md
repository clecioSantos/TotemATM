# 03 — Modelo de Dados: Firestore

## 3.1 Estrutura de Colecoes

```
users/{userId}
  gamification/
    profile/{userId}              — GamificationProfile
    missions/{missionId}          — ActiveMission (missoes do periodo)
    inventory/{itemId}            — InventoryItem (cosmeticos possuidos)
    coin_transactions/{txId}      — CoinTransaction
    xp_transactions/{txId}        — XpTransaction
    cupon_resgates/{cupomId}      — GameCupomResgate

mission_definitions/{missionId}   — Pool de missoes configuraveis
shop_items/{itemId}               — Itens da loja
analytics_events/{eventId}        — Eventos de analytics
feature_flags/{flagId}            — Feature flags
ab_experiments/{experimentId}     — Experimentos A/B
ab_assignments/{userId}           — Atribuicoes de experimentos
processed_actions/{idempotencyKey} — Idempotencia (TTL 24h)
```

## 3.2 Documentos Detalhados

### GamificationProfile
```
{
  userId, level, currentXp, totalXp,
  coins, totalCoinsEarned, totalCoinsSpent,
  streakDays, maxStreakDays, lastLoginDate: Timestamp,
  equippedAvatar, equippedFrame, equippedTitle,
  missionsCompleted,
  lastMissionRefreshDaily: Timestamp,
  lastMissionRefreshWeekly: Timestamp,
  monthlyCoinsEarned, monthlyCoinsResetDate: Timestamp,
  achievements: string[],
  createdAt, updatedAt: Timestamp,
  version: number
}
```

### ActiveMission
```
{
  id, missionDefinitionId, type: "daily"|"weekly", userId,
  title, description, category,
  condition: { action, threshold, extraParams? },
  rewards: { xp, coins?, cosmeticId? },
  progress: number,
  status: "active"|"completed"|"claimed"|"expired",
  assignedAt, expiresAt, completedAt?, claimedAt?: Timestamp,
  createdAt, updatedAt: Timestamp
}
```

### InventoryItem
```
{
  id, userId, itemId,
  itemType: "avatar"|"frame"|"title"|"emoji_pack",
  acquiredAt: Timestamp,
  acquiredVia: "shop"|"mission"|"streak"|"level_up"|"event",
  isEquipped: boolean
}
```

### CoinTransaction
```
{
  id, userId,
  type: "earn"|"spend",
  amount: number,
  source: "login_streak"|"mission"|"level_up"|"shop"|"referral"|"event",
  sourceId?, balanceAfter: number,
  createdAt: Timestamp, description
}
```

### XpTransaction
```
{
  id, userId, amount: number,
  source, sourceId?,
  levelAtTransaction, xpBefore, xpAfter,
  leveledUp: boolean, newLevel?,
  createdAt: Timestamp
}
```

### GameCupomResgate
```
{
  id, userId,
  coinsSpent, cupomCode, cupomValue, cupomMinOrder,
  cupomType: "fixed"|"free_shipping",
  status: "active"|"used"|"expired"|"cancelled",
  orderId?, expiresAt, createdAt, usedAt?: Timestamp
}
```

### ShopItem
```
{
  id, name, description,
  type: "avatar"|"frame"|"title"|"emoji_pack"|"cupom",
  price, currency: "coins",
  stock: "unlimited"|number,
  cupomConfig?: { cupomType, value, minOrder, validityDays: 30, prefix: "BORA_" },
  cosmeticId?, imageUrl?,
  requiredLevel?, featured: boolean,
  discount?, enabled: boolean,
  createdAt, updatedAt: Timestamp
}
```

### MissionDefinition — ver secao 2.4 (GDD) para estrutura completa

### AnalyticsEvent
```
{
  id, userId,
  event: string, category: string,
  properties: Record<string, any>,
  clientTimestamp, serverTimestamp: Timestamp,
  sessionId, platform, appVersion
}
```

### FeatureFlag
```
{
  id, name, description,
  enabled: boolean,
  rollOutPercentage: number (0-100),
  targetUserSegments?: string[],
  targetLevelMin?, targetLevelMax?,
  createdAt, updatedAt: Timestamp
}
```

### AbExperiment
```
{
  id, name, description,
  status: "draft"|"running"|"paused"|"completed",
  variants: [{ id, name, weight, config }],
  metrics: string[],
  startedAt?, endedAt?,
  createdAt, updatedAt: Timestamp
}
```

## 3.3 Indices Compostos

| Colecao | Campos | Tipo | Motivo |
|---|---|---|---|
| `gamification/xp_transactions` | userId ASC, createdAt DESC | Composto | Historico XP |
| `gamification/coin_transactions` | userId ASC, createdAt DESC | Composto | Historico coins |
| `gamification/missions` | userId ASC, type ASC, status ASC | Composto | Missoes ativas |
| `gamification/missions` | userId ASC, expiresAt ASC | Composto | Limpeza expiradas |
| `gamification/cupon_resgates` | userId ASC, status ASC | Composto | Cupons ativos |
| `gamification/cupon_resgates` | cupomCode ASC | Simples | Validacao |
| `analytics_events` | userId ASC, serverTimestamp DESC | Composto | Analytics |
| `analytics_events` | event ASC, serverTimestamp DESC | Composto | Dashboards |
| `mission_definitions` | type ASC, enabled ASC | Composto | Selecao diaria |
| `mission_definitions` | enabled ASC, weight DESC | Composto | Selecao ponderada |

## 3.4 Escalabilidade

### Estimativa de Carga (10.000 usuarios ativos / dia)

| Operacao | Writes/dia |
|---|---|
| Login (streak update) | 10.000 |
| Missao completada | 15.000 |
| XP ganho | 50.000 |
| Coin ganha | 15.000 |
| Compra na loja | 500 |
| **Total writes/dia** | **~90.500** |

Firestore free tier: 20.000 writes/dia -> plano Blaze necessario.
Custo estimado em escritas: ~US$ 0,16/dia -> ~US$ 5/mes.

### Leituras por Acao do Usuario

| Acao | Reads | Writes |
|---|---|---|
| onUserLogin (streak) | 1 | 1 |
| processAction | 2 | 1-4 |
| assignDailyMissions | 1 | 3 |
| claimMissionReward | 2 | 3-5 |
| purchaseShopItem | 3 | 2-3 |
| validateCupom | 2 | 0-1 |
| loadMissionsScreen | 2 | 0 |
| loadShopScreen | 1 | 0 |

### Estrategia de Cache
1. **Perfil gamification:** Zustand store + onSnapshot (tempo real)
2. **Missoes ativas:** carregadas 1x e cacheadas ate expiracao
3. **Loja:** cache 5 minutos (stale-while-revalidate)
4. **Historico:** paginacao infinita (10 itens/pagina)
5. **Definicoes de missoes:** cache 1 hora (mudam raramente)

## 3.5 Regras Firestore (Security Rules)

```javascript
// Adicionar ao firestore.rules existente:

match /users/{userId}/gamification/{subcollection}/{docId} {
  allow read: if request.auth.uid == userId;
  allow write: if false; // SOMENTE Admin SDK (servidor)
}

match /mission_definitions/{missionId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.role in ["admin", "owner"];
}

match /shop_items/{itemId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.role in ["admin", "owner"];
}

match /feature_flags/{flagId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.role in ["admin", "owner"];
}

match /ab_experiments/{experimentId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.role in ["admin", "owner"];
}

match /analytics_events/{eventId} {
  allow read: if request.auth.token.role in ["admin", "owner"];
  allow create: if request.auth != null;
  allow update, delete: if false;
}
```
