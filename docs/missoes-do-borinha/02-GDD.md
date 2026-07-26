# 02 — GDD: Game Design Document

## 2.1 Sistema de XP

### Fórmula de Nível

```
XP_NIVEL(n) = 100 * n * (1 + floor(n / 5) * 0.5)
```

| Nível | XP Necessário (nível) | XP Acumulado |
|---|---|---|
| 1 to 2 | 100 | 100 |
| 2 to 3 | 200 | 300 |
| 3 to 4 | 300 | 600 |
| 4 to 5 | 400 | 1,000 |
| 5 to 6 | 750 | 1,750 |
| 6 to 7 | 900 | 2,650 |
| 7 to 8 | 1,050 | 3,700 |
| 8 to 9 | 1,200 | 4,900 |
| 9 to 10 | 1,500 | 6,400 |
| 10 to 11 | 1,650 | 8,050 |
| ... | ... | ... |
| 15 to 16 | 2,250 | ~19,000 |
| 20 to 21 | 4,500 | ~40,000 |
| 50 to 51 | 17,500 | ~425,000 |

> A cada 5 níveis, o custo aumenta 50%. Sensação de aceleração inicial forte e progressão mais lenta no longo prazo.

### Fontes de XP

| Acao | XP Base | Frequencia Maxima | Observacao |
|---|---|---|---|
| Abrir o app (login streak day) | 10 | 1x/dia | Bonus progressivo no streak |
| Completar missao diaria | 30-80 | 3x/dia | Varia por dificuldade |
| Completar missao semanal | 100-300 | 3x/semana | Varia por dificuldade |
| Fazer pedido | 50 | Sem limite | XP bonus se 1o pedido no restaurante |
| Avaliar pedido | 30 | 1x/pedido | Extra +15 se avaliacao com texto |
| Favoritar restaurante | 20 | 10x/dia | Cap anti-spam |
| Favoritar produto | 10 | 20x/dia | Cap anti-spam |
| Descobrir novo restaurante (1o pedido) | 80 | Sem limite | Maior incentivo |
| Experimentar nova categoria | 40 | 5x/dia | Incentiva diversidade |
| Comprar novamente (3o+ pedido mesmo restaurante) | 60 | 1x/restaurante/dia | Fidelizacao |
| Completar perfil | 100 | 1x (unica) | One-time |
| Convidar amigo (futuro) | 200 | 10x/mes | V2 |

## 2.2 Sistema de Bora Coins

Bora Coins tem valor financeiro real. **1 Bora Coin = R$ 0,10 em desconto.**

**Regra fundamental:** o custo total de Bora Coins emitidas jamais pode ultrapassar 30% da margem bruta do usuario.

### Emissao (Fontes de Coins)

| Acao | Coins | Frequencia Maxima | Custo por Acao |
|---|---|---|---|
| Login streak: 3 dias consecutivos | 5 | 1x/ciclo | R$ 0,50 |
| Login streak: 7 dias consecutivos | 15 | 1x/ciclo | R$ 1,50 |
| Login streak: 30 dias consecutivos | 50 | 1x/ciclo | R$ 5,00 |
| Completar todas missoes diarias | 10 | 1x/dia | R$ 1,00 |
| Completar todas missoes semanais | 40 | 1x/semana | R$ 4,00 |
| Avaliar pedido com foto | 20 | 1x/pedido | R$ 2,00 |
| Subir de nivel | 10 * floor(nivel/5+1) | Por nivel | Variavel |

### Limites e Controles

| Limite | Valor | Justificativa |
|---|---|---|
| Cap emissao mensal de coins | 500 | Protege contra farming |
| Cap diario de coins | 50 | Evita spikes |
| Intervalo minimo entre resgates de cupom | 7 dias | Evita canibalizacao |
| Validade das coins | Nunca expiram | Acumula desejo de gastar |
| Validade dos cupons resgatados | 30 dias | Urgencia saudavel |
| Maximo de coins acumulaveis | 2,000 | Previne inflacao de saldo |
| Pedido minimo para cupom R$ 5 | R$ 30,00 | Garante margem |
| Pedido minimo para cupom R$ 10 | R$ 50,00 | Garante margem |
| Pedido minimo para cupom R$ 20 | R$ 100,00 | Garante margem |
| Cupom de frete gratis maximo | R$ 8,00 | Teto de custo |

### Simulacao: Jogador Extremamente Ativo (30 dias)

Premissas:
- Ticket medio: R$ 60,00
- Margem Bora (PIX): 7% = R$ 4,20/pedido
- Margem Bora (Cartao): 4% = R$ 2,40/pedido
- Mix: 60% PIX, 40% Cartao
- Margem media ponderada: R$ 3,48/pedido

| Acao | Qtd (30d) | Coins Ganhas | Custo |
|---|---|---|---|
| Streak 30d bonus | 1 | 50 | R$ 5,00 |
| Streak 7d bonus | 4 | 60 | R$ 6,00 |
| Streak 3d bonus | 10 | 50 | R$ 5,00 |
| Todas missoes diarias | 30 | 300 | R$ 30,00 |
| Todas missoes semanais | 4 | 160 | R$ 16,00 |
| Avaliacao com foto | 15 | 300 | R$ 30,00 |
| Subiu ~5 niveis | 5 | 50 | R$ 5,00 |
| **Total (sem caps)** | | **970** | **R$ 97,00** |

Receita do jogador (30d): 15 pedidos x R$ 60,00 = R$ 900,00
Margem Bora: 15 x R$ 3,48 = R$ 52,20
Resultado sem caps: Deficit de R$ 44,80

**Com protecoes ativadas:**
- Cap mensal: 500 coins (R$ 50,00)
- Maximo 4 cupons (1/semana)
- Cenario agressivo: 4 cupons de R$ 10,00 = R$ 40,00 desconto
- Margem: R$ 52,20 - R$ 40,00 = **R$ 12,20 positivo**
- **Jogador extremamente ativo ainda gera lucro.**

## 2.3 Login Streak

### Regras
- Contagem comeca em 1 no primeiro login do dia
- Incrementa +1 a cada dia consecutivo com login
- Reseta para 1 se pular um dia
- Login contado quando usuario abre o app com sessao ativa

### Recompensas de Streak

| Streak | Recompensa |
|---|---|
| 3 dias | 5 Bora Coins |
| 7 dias | 15 Bora Coins + badge "Frequente" |
| 14 dias | 30 Bora Coins |
| 30 dias | 50 Bora Coins + badge "Inabalavel" + moldura especial |
| 60 dias | 100 Bora Coins + titulo "Bora Todo Dia" |
| 90 dias | 150 Bora Coins + avatar exclusivo |
| 180 dias | 300 Bora Coins + titulo "Lenda" |
| 365 dias | 500 Bora Coins + avatar lendario + moldura diamante |

### Protecao de Streak
- Calculado no servidor (nunca no cliente)
- Baseado em `lastLoginDate` no Firestore
- So conta 1x por dia (UTC-3, horario de Brasilia)
- Se `lastLoginDate` for ontem -> incrementa streak
- Se `lastLoginDate` for hoje -> ignora (ja contou)
- Se `lastLoginDate` for anteontem ou antes -> reseta streak
- Usa `FieldValue.serverTimestamp()` sempre

## 2.4 Missoes

### Missoes Diarias (Pool - Sistema seleciona 3/dia)

| Missao | Tipo | Condicao | XP | Dificuldade |
|---|---|---|---|---|
| Abrir o app | login | Fazer login no dia | 30 | Facil |
| Descobrir restaurante | discovery | Visitar pagina de 3 restaurantes novos | 60 | Media |
| Favoritar restaurante | engagement | Favoritar 1 restaurante | 40 | Facil |
| Avaliar pedido | review | Avaliar 1 pedido do dia | 60 | Media |
| Favoritar produto comprado | engagement | Favoritar 1 produto de pedido recente | 40 | Facil |
| Experimentar categoria nova | discovery | Pedir de categoria nunca pedida | 80 | Dificil |
| Comprar novamente | loyalty | Pedir de restaurante ja pedido 2+ vezes | 80 | Dificil |
| Ver cardapio completo | discovery | Scrollar ate o fim do cardapio | 30 | Facil |
| Compartilhar restaurante | social | Compartilhar link de restaurante | 50 | Media |
| Pedido acima de R$ 50 | order | Fazer pedido com valor > R$ 50 | 70 | Media |

### Missoes Semanais (Pool - Sistema seleciona 3/semana)

| Missao | Tipo | Condicao | XP | Coins |
|---|---|---|---|---|
| Semana do Explorador | discovery | Pedir de 3 restaurantes diferentes | 200 | 20 |
| Critico da Semana | review | Avaliar 3 pedidos | 200 | 20 |
| Colecionador de Favoritos | engagement | Favoritar 5 restaurantes | 150 | 15 |
| Maratona de Pedidos | order | Fazer 4 pedidos | 300 | 30 |
| Experimentador | discovery | Pedir de 2 categorias novas | 250 | 25 |
| Fregues Fiel | loyalty | 3 pedidos no mesmo restaurante | 200 | 20 |
| Rei do PIX | payment | 3 pedidos pagos com PIX | 180 | 15 |
| Madrugador | behavior | 2 pedidos antes das 11h | 200 | 20 |
| Noite de Delivery | behavior | 2 pedidos apos 20h | 200 | 20 |
| Socialite | social | Compartilhar 3 restaurantes | 150 | 15 |

### Configuracao de Missoes (100% via Firestore, sem deploy)

Cada missao e um documento na colecao `mission_definitions`:

```
MissionDefinition {
  id, type: "daily"|"weekly",
  category: "login"|"discovery"|"engagement"|"review"|"order"|"loyalty"|"social"|"payment"|"behavior",
  title, description,
  condition: { action, threshold, extraParams? },
  rewards: { xp, coins?, cosmeticId? },
  difficulty: "easy"|"medium"|"hard",
  enabled: boolean,
  minLevel?, maxLevel?,
  targetUserSegment?: "new"|"returning"|"power"|"all",
  activeFrom?, activeUntil?,
  weight: number (1-10),
  maxCompletionsPerPeriod: number
}
```

### Algoritmo de Selecao de Missoes
1. Buscar todas `mission_definitions` com `enabled: true` e tipo do periodo
2. Filtrar por `minLevel`/`maxLevel` do usuario
3. Filtrar por `targetUserSegment`
4. Filtrar por `activeFrom`/`activeUntil`
5. Ponderar por `weight`
6. Selecionar 3 aleatoriamente respeitando pesos
7. Salvar em `user_missions/{userId}` com data de expiracao
8. Cachear ate expirar (00:00 diarias, segunda 00:00 semanais)

## 2.5 Recompensas Cosméticas

### Avatares
- `borinha_default` — Padrao
- `borinha_chef` — Borinha Chef (30 coins)
- `borinha_pizza` — Borinha Pizza (30 coins)
- `borinha_sushi` — Borinha Sushi (40 coins)
- `borinha_burger` — Borinha Burger (40 coins)

### Molduras
- `frame_default` — Sem moldura
- `frame_bronze` — Bronze (50 coins ou nivel 10)
- `frame_prata` — Prata (100 coins ou nivel 25)
- `frame_ouro` — Ouro (200 coins ou nivel 50)
- `frame_diamante` — Diamante (streak 365 dias)

### Titulos
- `title_explorador` — "Explorador" (40 coins)
- `title_critico` — "Critico Gastronomico" (60 coins)
- `title_fiel` — "Fregues Fiel" (50 coins)
- `title_lenda` — "Lenda" (streak 180 dias)
- `title_boratododia` — "Bora Todo Dia" (streak 60 dias)

### Emojis
- `emoji_pack_1` — Pack Basico (25 coins)
- `emoji_pack_2` — Pack Premium (50 coins)

## 2.6 Loja — Itens

| Item | Custo (Coins) | Tipo |
|---|---|---|
| Cupom R$ 5,00 (pedido min. R$ 30,00) | 50 | Real |
| Cupom R$ 10,00 (pedido min. R$ 50,00) | 100 | Real |
| Cupom R$ 20,00 (pedido min. R$ 100,00) | 200 | Real |
| Cupom Frete Gratis (pedido min. R$ 40,00) | 80 | Real |
| Avatar "Borinha Chef" | 30 | Cosmetico |
| Avatar "Borinha Pizza" | 30 | Cosmetico |
| Moldura Bronze | 50 | Cosmetico |
| Moldura Prata | 100 | Cosmetico |
| Moldura Ouro | 200 | Cosmetico |
| Titulo "Explorador" | 40 | Cosmetico |
| Titulo "Critico Gastronomico" | 60 | Cosmetico |
| Emoji Pack 1 | 25 | Cosmetico |

## 2.7 Cupons — Regras de Validacao (Server-Side)

1. Verificar se cupom existe e nao foi usado
2. Verificar se usuario e o dono do cupom
3. Verificar validade (30 dias)
4. Verificar pedido minimo
5. Verificar se ja existe outro cupom no pedido -> **rejeitar**
6. Verificar se pedido tem promocao ativa -> **rejeitar**
7. Verificar se usuario nao resgatou cupom nos ultimos 7 dias
8. Aplicar desconto
9. Marcar cupom como usado
10. Registrar analytics

Validacao de margem:
```
effectiveMargin = (orderValue * marginRate) - cupomValue
maxCupomForOrder = floor(boraMargin * 0.5)  // Maximo 50% da margem
```
