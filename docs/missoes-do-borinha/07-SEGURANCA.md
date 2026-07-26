# 07 — Seguranca e Anti-Fraude

## 7.1 Principio: Never Trust the Client

### XP e Coins
- Cliente **NUNCA** calcula XP ou coins. Sempre envia acao, servidor calcula
- Toda emissao registrada em `xp_transactions` / `coin_transactions` (audit trail)
- Servidor valida caps (diario, mensal) **ANTES** de emitir
- Servidor usa transacoes Firestore para atomicidade (evita race conditions)

### Streak
- Streak **NUNCA** calculado no cliente
- `lastLoginDate` atualizado **SOMENTE** pelo servidor
- Servidor ignora data do cliente; sempre usa `FieldValue.serverTimestamp()`
- Cliente nao pode "pular" dias

### Missoes
- Progresso atualizado **SOMENTE** pelo servidor
- Cliente nao envia `progress` arbitrario; servidor calcula baseado em acoes reais
- Missao so "completed" se `progress >= threshold` validado pelo servidor
- Missao so "claimed" se estava "completed"
- Missao expirada nao pode ser completada nem resgatada

### Cupons
- Codigo gerado no servidor (nunca no cliente)
- Validacao completa no servidor
- Uso unico (controle por `status`)
- Vinculados ao `userId`, nao ao email/nome

### Loja
- Preco lido do Firestore (nunca do request)
- Verificacao de saldo atomica (transacao Firestore)
- Level requirement validado no servidor

## 7.2 Protecao Contra Duplicidade

### Idempotency Keys
Toda acao do usuario inclui `idempotencyKey` (UUID v4):
```
interface ActionRequest {
  action: string;
  params?: any;
  idempotencyKey: string;
}
```
Servidor verifica se ja processada em `processed_actions/{key}` (TTL 24h).

### Controle por Acao
| Acao | Protecao |
|---|---|
| Login streak | Verifica `lastLoginDate` ja e hoje -> ignora |
| Avaliar pedido | Verifica se pedido ja tem avaliacao do usuario |
| Favoritar | Verifica se favorito ja existe (toggle) |
| Completar missao | Verifica `status !== "completed" && status !== "claimed"` |
| Comprar item | Transacao Firestore atomica |
| Resgatar cupom | Transacao: verifica disponibilidade, marca usado |

## 7.3 Rate Limiting

| Rota | Limite | Janela |
|---|---|---|
| /api/gamification/actions | 30 req/min | 60s |
| /api/gamification/shop/purchase | 10 req/min | 60s |
| /api/gamification/cupons/validate | 5 req/min | 60s |
| /api/gamification/streak/login | 10 req/min | 60s |
| /api/gamification/missions/:id/complete | 20 req/min | 60s |

Resposta: HTTP 429 + "Muitas requisicoes. Tente novamente em X segundos."

Implementacao MVP: in-memory via middleware Next.js
Futuro: Redis

## 7.4 Race Conditions

### Transacoes Firestore Atomicas
```
Exemplo: Compra na Loja

db.runTransaction(async (transaction) => {
  // 1. Le perfil e item simultaneamente
  const profile = (await transaction.get(profileRef)).data();
  const item = (await transaction.get(shopItemRef)).data();

  // 2. Valida saldo, level, disponibilidade
  if (profile.coins < item.price) throw new InsufficientCoinsError();
  if (!item.enabled) throw new ItemDisabledError();

  // 3. Atualiza saldo (atomico)
  transaction.update(profileRef, {
    coins: profile.coins - item.price,
    totalCoinsSpent: profile.totalCoinsSpent + item.price,
    updatedAt: serverTimestamp()
  });

  // 4. Cria transacao coins
  transaction.set(coinTxRef, { ... });

  // 5. Adiciona ao inventario OU gera cupom
  transaction.set(inventoryRef, { ... });
});
```

### Optimistic Locking
- `GamificationProfile` tem campo `version`
- Incrementado a cada atualizacao
- Se conflito, transacao rejeitada e retentada

## 7.5 Protecao Contra Manipulacao

### Protecao de Horario
- Todos os timestamps usam `FieldValue.serverTimestamp()`
- Streak, expiracao, validade: tudo baseado no horario do SERVIDOR
- Timezone consistente: UTC-3 (Brasilia)

### Protecao Contra Injecao e Spam
- Todas as entradas validadas com Zod schemas
- Sanitizacao de strings (trim, maxLength)
- `idempotencyKey` validado como UUID v4
- Arrays de parametros limitados a 100 itens

## 7.6 Validacao de Margem no Cupom

```
async function validateCupomEconomy(userId, cupomValue, orderValue, paymentMethod) {
  const marginRate = paymentMethod === "pix" ? 0.07 : 0.04;
  const boraMargin = orderValue * marginRate;
  const effectiveMargin = boraMargin - cupomValue;
  const maxCupomForOrder = Math.floor(boraMargin * 0.5); // 50% da margem

  if (cupomValue > maxCupomForOrder) {
    return { valid: false, reason: "Cupom excede margem de lucro" };
  }

  return { valid: true };
}
```

## 7.7 Cenarios de Fraude Testados

1. **Duplicate Requests:** idempotencyKey -> processa so 1x
2. **Race Condition:** 10 compras simultaneas -> saldo correto
3. **Timestamp Manipulation:** serverTimestamp > client timestamp
4. **Spam de Acoes:** 100 acoes/min -> rate limit 429
5. **Progress Injection:** progress > threshold enviado -> rejeitado
6. **Coin Injection:** awardCoins(9999) -> caps bloqueiam
7. **Cupom Reuse:** mesmo cupom 2x -> rejeitado
8. **Level Skip:** XP falso no request -> servidor calcula XP real
9. **Cross-User Access:** cupom usuario A usado por B -> rejeitado
10. **Injection:** strings maliciosas -> sanitizacao + Zod rejeita

## 7.8 Firestore Security Rules

Ver secao 3.5 (FIRESTORE.md) para rules completas.
Regra de ouro: cliente nunca escreve diretamente em colecoes gamification.
Toda escrita e feita pelo Admin SDK (servidor).
