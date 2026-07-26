# 01 — PRD: Product Requirements Document

## 1.1 Visão Geral

**Missões do Borinha** é o módulo de gamificação do Bora de Delivery. O Borinha, mascote da plataforma, acompanha o usuário em sua jornada de evolução. O sistema não é um jogo separado — é uma extensão natural do uso do Bora, transformando ações cotidianas (descobrir restaurantes, favoritar, avaliar) em progresso tangível.

## 1.2 Objetivos de Negócio

| Objetivo | Métrica Alvo | Justificativa |
|---|---|---|
| Aumentar retenção D7 | +15% | Usuários que acumulam progresso voltam para continuar |
| Aumentar retenção D30 | +20% | Login streak + missões semanais criam hábito |
| Aumentar frequência de abertura | +25% | Missões diárias incentivam abrir o app todo dia |
| Aumentar quantidade de avaliações | +40% | Missões de avaliação geram conteúdo para restaurantes |
| Aumentar quantidade de favoritos | +35% | Favoritar é ação de baixo atrito com recompensa |
| Aumentar descoberta de restaurantes | +30% | Missões de descoberta reduzem concentração em top sellers |
| Aumentar LTV | +10% | Recorrência + cupons estratégicos aumentam ticket médio |
| Preservar margem (7% PIX / 4% Cartão) | Inalterada | Cupons emitidos nunca podem reduzir margem abaixo disso |

## 1.3 Personas

### Persona 1: Maria, 28 anos — Usuária Recorrente
- Pede delivery 3-4x por semana, sempre nos mesmos 2-3 restaurantes
- Nunca avaliou um pedido, não usa favoritos
- **Objetivo:** fazer Maria avaliar, favoritar e descobrir novos restaurantes

### Persona 2: João, 22 anos — Usuário Novo
- Baixou o app, fez 1 pedido, não voltou
- **Objetivo:** criar hábito de abertura diária, engajar com streak

### Persona 3: Ana, 35 anos — Usuária Sensível a Preço
- Pede delivery 1x por semana, sempre busca cupons
- **Objetivo:** converter engajamento em Bora Coins que viram desconto real, sem canibalizar margem

## 1.4 Escopo MVP

| Funcionalidade | Incluído? | Complexidade |
|---|---|---|
| Barra de XP e Nível | Sim | Baixa |
| Perfil do Borinha (avatar, nível, XP) | Sim | Média |
| Login Streak | Sim | Baixa |
| Missões Diárias | Sim | Alta |
| Missões Semanais | Sim | Alta |
| Bora Coins | Sim | Média |
| Loja de Recompensas | Sim | Alta |
| Histórico de Atividades | Sim | Baixa |
| Sistema de Cupons integrado | Sim | Média |
| Cosméticos (avatar, moldura, título) | Sim | Média |
| Cidade do Borinha | Não (V2) | — |
| Minijogos | Não (V2) | — |
| Ranking / Leaderboard | Não (V2) | — |
| Temporadas | Não (V2) | — |
| Passe do Borinha | Não (V2) | — |
| Skins e Colecionáveis | Não (V2) | — |
| Eventos temáticos | Não (V2) | — |

## 1.5 Filosofia do Sistema

> O usuário não acumula descontos. O usuário evolui. O progresso é o foco. Os descontos são consequência.

- **XP deve ser abundante.** Jogador ativo sobe de nível visivelmente nas primeiras semanas.
- **Bora Coins devem ser controladas.** Cada coin tem custo real para o negócio.
- **Nunca desenvolver algo "divertido" sem valor de negócio.**
- **Toda funcionalidade gera valor para cliente, restaurante e Bora Delivery.**

## 1.6 Restrições Técnicas e de Negócio

- Margem Bora: 7% PIX, 4% Cartão — toda funcionalidade deve preservar
- Stack existente: Next.js App Router + Firestore + Firebase Auth + TailwindCSS
- Sem novos serviços externos no MVP (sem Redis, sem Cloud Functions adicionais)
- Mobile-first (375-430px) via Capacitor
- Todas as operações financeiras (coins, cupons) devem ser server-side
- Firestore transactions para atomicidade em operações de saldo

## 1.7 Métricas de Sucesso do MVP (30 dias pós-lançamento)

- 30% dos usuários ativos com streak >= 3 dias
- 40% dos usuários completam pelo menos 1 missão por semana
- 20% dos usuários compram na loja
- 5% dos usuários resgatam cupom
- Custo total de cupons < 30% da margem incremental
- Retenção D7 do grupo gamification > retenção D7 do grupo controle
