# 05 — Componentes e Telas

## 5.1 Componentes React

### BorinhaAvatar
```
Props: avatarId, frameId, size ("sm"|"md"|"lg"|"xl"), animated, mood
Estados: Loading (skeleton circular), Erro (avatar default), Normal (avatar + moldura)
Comportamento:
  - Animacao de bounce no level up
  - Transicao suave ao trocar avatar
  - Moldura com gradiente baseado no tipo
  - Tamanhos: sm=32px, md=48px, lg=64px, xl=96px
```

### XpBar
```
Props: currentXp, xpForNextLevel, level, showLabel, variant ("compact"|"full")
Estados: Loading (shimmer), Normal (barra preenchida), Full (level up: barra completa -> reset)
Comportamento:
  - Animacao de preenchimento via framer-motion
  - Efeito de brilho (shimmer) ao ganhar XP
  - Label: "120 / 300 XP" ou "Nivel 5"
  - Cor: gradiente brand.primary -> brand.primaryHover
```

### LevelBadge
```
Props: level, size
Estados: Normal (circulo com numero), Glowing (niveis milestone: 5, 10, 25, 50)
Comportamento: Cor muda por tier (1-10 bronze, 11-25 prata, 26-50 ouro, 51+ diamante)
```

### LevelUpOverlay
```
Props: newLevel, rewards: { xp, coins }, onDismiss
Estados: Animating (overlay com fade+scale), Dismissed (fade out)
Comportamento:
  - Overlay fullscreen com blur background
  - Animacao de confete/Particles via framer-motion
  - Borinha pulando e comemorando
  - "Parabens! Voce subiu para o Nivel X!"
  - Lista de recompensas do nivel
  - Botao "Continuar" + auto-dismiss 5 segundos
```

### CoinsDisplay
```
Props: amount, showIcon, size
Comportamento: Icone de moeda animado, animacao de incremento (contador sobe), brilho ao ganhar
```

### MissionCard
```
Props: mission: ActiveMission, onComplete, onClaim
Estados:
  - Active: card com barra de progresso
  - Completed: destaque verde + botao "Resgatar"
  - Claimed: cinza, marcado como concluido
  - Expired: vermelho claro, "Expirada"
Comportamento:
  - Card com icone da categoria, titulo, descricao
  - Barra de progresso (MissionProgress)
  - Recompensa exibida (XP + coins)
  - Botao "Resgatar" visivel apenas quando completed
  - Animacao de conclusao (scale + glow verde)
```

### MissionProgress
```
Props: current, target, label
Comportamento: Barra de progresso compacta, label "2/3 restaurantes", checkmark animado quando completo
```

### MissionCompletedToast
```
Props: mission, xpEarned, coinsEarned
Estados: Visible (slide from right), Dismissed (slide right)
Comportamento: Toast com icone de sucesso, "+X XP" e "+Y Bora Coins", auto-dismiss 4 segundos
```

### StreakBadge
```
Props: streakDays, size
Estados:
  - 0-2 dias: icone de fogo cinza
  - 3-6 dias: fogo laranja
  - 7-13 dias: fogo com flame animation
  - 14-29 dias: fogo azul
  - 30+: fogo roxo com glow
```

### StreakCalendar
```
Props: streakDays, lastLoginDate
Estados: Loading (skeleton 7 circulos), Normal (7 circulos ultima semana), Empty (streak 0)
Comportamento:
  - 7 circulos em linha (dias da semana)
  - Dias com login: circulo laranja preenchido
  - Hoje: circulo com borda pulsante
  - Dias futuros: circulo vazio
```

### ShopItemCard
```
Props: item: ShopItem, canAfford, canPurchase, onPurchase
Estados:
  - Available: card normal com preco
  - CannotAfford: preco cinza, botao desabilitado
  - Owned: badge "Adquirido"
  - Purchasing: botao loading spinner
Comportamento: Imagem, nome, descricao, preco em coins, tag "Exclusivo" (itens de nivel), badge "Equipado"
```

### ShopGrid
```
Props: items, category ("cosmetics"|"cupons")
Comportamento:
  - Grid responsivo (2 colunas mobile, 3 tablet, 4 desktop)
  - Tabs: "Cosmeticos", "Cupons"
  - Secao "Destaques" no topo
```

### InventoryGrid
```
Props: items, equippedIds
Comportamento: Grid por categorias (Avatares, Molduras, Titulos, Emojis), badge "Equipado", botao "Equipar", preview
```

### HistoryTimeline
```
Props: transactions[], loading, hasMore, onLoadMore
Estados: Loading (skeleton timeline), Empty (ilustracao "Nenhuma atividade"), Error, Data
Comportamento:
  - Timeline vertical com icones por tipo
  - Agrupado por data
  - XP: estrela laranja, Coins: moeda dourada, Cupom: ticket verde
  - Infinite scroll
```

### BorinhaReaction
```
Props: mood ("happy"|"idle"|"excited"|"sad"), size
Comportamento: Animacao facial do Borinha baseada no mood
```

## 5.2 Telas

### Tela de Perfil do Borinha — Rota: `/perfil`

```
+----------------------------------+
|  <- Voltar                       |
|         +-----------+            |
|         |  Borinha  |            |
|         |  Avatar   |            |
|         | + Moldura |            |
|         +-----------+            |
|     Nome do Usuario              |
|     "Titulo Equipado"            |
|  +----------------------------+  |
|  | Nivel 12                   |  |
|  | [===========        ] 65%  |  |
|  | 650 / 1000 XP              |  |
|  +----------------------------+  |
|  +------------+ +-------------+  |
|  | Fogo 15    | | Moeda 320  |  |
|  | Streak     | | Bora Coins |  |
|  +------------+ +-------------+  |
|  +----------------------------+  |
|  | Conquistas (3)          >  |  |
|  | Inventario (12 itens)   >  |  |
|  | Historico de Atividades >  |  |
|  +----------------------------+  |
|          [ Ir para Loja ]       |
|  ======== Bottom Nav =========  |
+----------------------------------+
```

### Tela de Missoes — Rota: `/missoes`

```
+----------------------------------+
|  Missoes do Borinha              |
|  +----------------------------+  |
|  | Fogo Streak: 15 dias       |  |
|  | Prox recompensa: 30d=50cp  |  |
|  | [=========         ] 50%   |  |
|  +----------------------------+  |
|  [ Diarias ] [ Semanais ]       |
|  Diarias — Atualiza em 4h 30m  |
|  +----------------------------+  |
|  | M Descobrir 3 restaurantes |  |
|  | [=======       ] 2/3       |  |
|  | Recompensa: 60 XP          |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | * Avaliar 1 pedido         |  |
|  | [==========] 1/1      OK   |  |
|  | Recompensa: 60 XP          |  |
|  | [ Resgatar ]                |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | <3 Favoritar 1 restaurante |  |
|  | [          ] 0/1           |  |
|  | Recompensa: 40 XP          |  |
|  +----------------------------+  |
|  ======== Bottom Nav =========  |
+----------------------------------+
```

### Tela da Loja — Rota: `/loja`

```
+----------------------------------+
|  Loja do Borinha                 |
|  Moeda 320 Bora Coins           |
|  [ Cosmeticos ] [ Cupons ]      |
|  +----------------------------+  |
|  |        Destaques           |  |
|  | +--------+ +--------+     |  |
|  | | Cupom  | | Avatar |     |  |
|  | | R$10   | | Chef   |     |  |
|  | | 100 cp | | 30 cp  |     |  |
|  | +--------+ +--------+     |  |
|  +----------------------------+  |
|  Cupons                         |
|  +----------------------------+  |
|  | Cupom R$ 5,00              |  |
|  | Pedido min. R$ 30,00       |  |
|  | Validade: 30 dias          |  |
|  |       50 Moedas             |  |
|  |      [Comprar]              |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Cupom R$ 10,00             |  |
|  | Pedido min. R$ 50,00       |  |
|  |      100 Moedas             |  |
|  | [Saldo insuficiente]        |  |
|  +----------------------------+  |
|  ======== Bottom Nav =========  |
+----------------------------------+
```

### Tela de Historico — Rota: `/historico`

```
+----------------------------------+
|  Historico de Atividades         |
|  [Todos] [XP] [Coins] [Cupons]  |
|  == Hoje ==                      |
|  +----------------------------+  |
|  | * +60 XP                   |  |
|  | Missao: Avaliar pedido     |  |
|  | 14:30                      |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Moeda +10 Bora Coins      |  |
|  | Todas missoes diarias      |  |
|  | 14:30                      |  |
|  +----------------------------+  |
|  == Ontem ==                    |
|  +----------------------------+  |
|  | * +40 XP                   |  |
|  | Login streak: 15 dias      |  |
|  | 09:15                      |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Cupom R$ 10,00             |  |
|  | Resgatado na loja          |  |
|  | Usado: Pedido #1234        |  |
|  +----------------------------+  |
|  ---- Carregar mais ----        |
|  ======== Bottom Nav =========  |
+----------------------------------+
```

### Admin — Gerenciamento de Missoes — Rota: `/admin/missoes`

```
+----------------------------------+
|  Admin > Missoes                 |
|  [+ Nova Missao]                |
|  Filtros: [Todas][Diarias]      |
|          [Semanais][Inativas]   |
|  +----------------------------+  |
|  | OK Descobrir restaurante   |  |
|  | Diaria . Discovery         |  |
|  | 3 restaurantes . 60 XP     |  |
|  | Peso: 7                    |  |
|  | [Editar] [Desativar]       |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | OK Avaliar pedido          |  |
|  | Diaria . Review            |  |
|  | 1 avaliacao . 60 XP        |  |
|  | Peso: 8                    |  |
|  | [Editar] [Desativar]       |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | -- Experimentar categoria  |  |
|  | Semanal . Discovery        |  |
|  | 2 categorias . 250 XP      |  |
|  | [Ativar] [Editar]          |  |
|  +----------------------------+  |
+----------------------------------+
```

### Admin — Dashboard de Analytics — Rota: `/admin/gamification`

```
+----------------------------------+
|  Admin > Gamification Dashboard  |
|  +------++------++------+       |
|  | DAU  || WAU  || MAU  |       |
|  | 2450 || 8900 ||22000 |       |
|  +------++------++------+       |
|  +----------------------------+  |
|  | Missoes Completadas        |  |
|  | (grafico de barras 7 dias) |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Coins Emitidas vs Gastas   |  |
|  | (grafico de linha 30 dias) |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Cupons Resgatados          |  |
|  | Total: 450 . Usados: 320   |  |
|  +----------------------------+  |
+----------------------------------+
```
