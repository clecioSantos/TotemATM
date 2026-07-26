# 09 — KPIs, Analytics, Feature Flags e A/B Testing

## 9.1 KPIs — Metricas de Negocio

### Engajamento
| Metrica | Frequencia |
|---|---|
| DAU (gamification) | Diario |
| WAU | Semanal |
| MAU | Mensal |
| Streak medio | Semanal |
| % usuarios streak 7+ | Semanal |
| Missoes completadas/dia | Diario |
| Taxa de conclusao (completadas/atribuidas) | Semanal |
| Tempo medio ate completar | Semanal |

### Economia
| Metrica | Frequencia |
|---|---|
| Coins emitidas | Diario |
| Coins gastas | Diario |
| Saldo total circulacao | Semanal |
| Cupons resgatados | Diario |
| Cupons utilizados | Diario |
| Taxa utilizacao (usados/resgatados) | Semanal |
| Custo total cupons | Diario |
| ROI gamification | Mensal |

### Retencao
| Metrica |
|---|
| Retencao D1 |
| Retencao D7 |
| Retencao D30 |
| D7 grupo gamification vs controle (A/B) |

### Conversao
| Metrica |
|---|
| Missao -> Pedido |
| Loja -> Compra |
| Cupom -> Pedido |
| XP -> Nivel (tempo medio entre niveis) |

## 9.2 Eventos de Analytics

### Lista Completa
```
profile_created          profile_viewed
xp_earned                player_level_up
streak_login             streak_milestone_reached
streak_broken
missions_viewed          mission_assigned
mission_progress_updated mission_completed
mission_claimed          mission_expired
shop_viewed              shop_item_viewed
shop_purchase            shop_purchase_failed
inventory_viewed         item_equipped
item_unequipped
coins_earned             coins_spent
cupom_generated          cupom_validated
cupom_applied            cupom_rejected
cupom_expired
history_viewed
restaurant_discovered    order_reviewed
favorite_added           new_category_tried
repurchase               profile_completed
feature_flag_checked
ab_experiment_assigned   ab_experiment_conversion
```

### Propriedades Comuns
```
userId, sessionId, platform, appVersion,
screenName, clientTimestamp, serverTimestamp
```

### Propriedades Especificas (por evento)
```
xpAmount, xpSource, levelNumber, levelTier,
coinsAmount, coinsSource, coinsBalance,
streakDays, missionId, missionType, missionCategory,
shopItemId, shopItemType, shopItemPrice,
cupomCode, cupomValue, orderValue, paymentMethod,
abExperimentId, abVariantId, featureFlagName
```

## 9.3 Dashboards Futuros

1. **Visao Geral:** DAU/WAU/MAU, novos vs retornantes, streak medio, taxa conclusao
2. **Economia:** Coins emitidas vs gastas, saldo circulacao, cupons gerados vs usados, custo vs receita
3. **Missoes:** Ranking missoes mais/menos completadas, tempo medio por tipo, distribuicao dificuldade
4. **Conversao:** Funil missao atribuida->iniciada->completada->resgatada, funil loja, funil cupom
5. **A/B Tests:** Comparacao variantes, significancia estatistica, impacto metricas

## 9.4 Feature Flags

### Implementacao
Armazenadas no Firestore (`feature_flags`), cacheadas em memoria (5 min TTL).
Hash deterministico do userId para rollout gradual:
```
hash = hashUserId(userId)
enabled = (hash % 100) < flag.rollOutPercentage
```

### Flags Planejadas
| Flag | Rollout Inicial |
|---|---|
| `gamification_enabled` | 10% -> 50% -> 100% |
| `missions_enabled` | 100% |
| `streak_enabled` | 100% |
| `shop_enabled` | 100% |
| `cupons_enabled` | 50% -> 100% |
| `analytics_enabled` | 100% |
| `notifications_enabled` | 0% (V2) |
| `cosmetics_enabled` | 100% |
| `daily_missions_count` | 3 |
| `weekly_missions_count` | 3 |
| `xp_multiplier` | 1.0 |
| `coins_multiplier` | 1.0 |
| `monthly_coins_cap` | 500 |
| `daily_coins_cap` | 50 |
| `cupom_cooldown_days` | 7 |

## 9.5 A/B Testing

### Atribuicao
No primeiro acesso ao modulo, usuario atribuido deterministicamente a uma variante baseado em hash(userId + experimentId).

### Experimentos Planejados
| Experimento | Variantes | Metrica Primaria |
|---|---|---|
| Qtd moedas por acao | A: 1x / B: 1.5x / C: 2x | Retencao D7, Custo/receita |
| Qtd missoes diarias | A: 2 / B: 3 / C: 4 | Taxa conclusao, Engajamento |
| Valor cupons | A: R$5/10/20 / B: R$3/7/15 | Taxa utilizacao, Ticket medio |
| Tipos recompensa | A: So cupons / B: Cupons+Cosmeticos / C: Mais Cosmeticos | Engajamento, Custo |
| Dificuldade missoes | A: Mais faceis / B: Balanceado / C: Mais dificeis | Tempo completar, Retencao |
| Pedido minimo cupom | A: 2x valor / B: 3x / C: 4x | Taxa utilizacao, Margem |

### Analise de Resultados
- Metricas por variante via `analytics_events`
- Significancia estatistica (p < 0.05, tamanho efeito > 5%)
- Dashboard dedicado com comparacao lado a lado
