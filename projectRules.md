# NexOrder — Padrões do Projeto

## Objetivo

O NexOrder é um sistema web de autoatendimento para lancherias/restaurantes, inspirado na experiência dos totens do McDonald's.

O sistema deve priorizar:
- performance
- UX moderna
- visual clean
- organização de código
- escalabilidade
- manutenção simples
- componentes reutilizáveis

---

# Stack Principal

## Frontend
- Next.js 15
- React 19
- TypeScript
- CSS Modules / CSS separado por página
- Firebase Client SDK

## Backend
- Node.js
- NestJS
- Firebase Admin SDK

## Infraestrutura
- Turborepo
- Monorepo
- Firebase
- Firestore
- Firebase Auth
- Firebase Storage

---

# Estrutura do Projeto

```txt
apps/
├── admin/
├── totem/
└── kitchen/

backend/
└── api/

packages/
└── shared/
```

---

# Padrões de Código

## Regras Gerais

- Sempre utilizar TypeScript
- Evitar arquivos gigantes
- Separar lógica de UI
- Componentes reutilizáveis
- Evitar duplicação de código
- Código deve ser legível antes de ser "inteligente"
- Priorizar clareza

---

# Estrutura de Páginas

Cada página deve possuir:

```txt
page.tsx
page.css
```

Exemplo:

```txt
app/dashboard/
├── page.tsx
└── page.css
```

---

# Estrutura de Componentes

```txt
components/
└── Button/
    ├── index.tsx
    ├── styles.css
    └── types.ts
```

---

# Padrões de Nome

## Componentes
PascalCase

```tsx
ProductCard
SidebarMenu
OrderItem
```

---

## Funções
camelCase

```ts
loadProducts()
finishOrder()
calculateTotal()
```

---

## Variáveis
camelCase

```ts
totalPrice
isLoading
selectedProduct
```

---

## Constantes
UPPER_CASE

```ts
MAX_ITEMS
API_TIMEOUT
DEFAULT_LANGUAGE
```

---

# Estilo Visual

## Design System

O visual do sistema deve seguir:

- minimalista
- moderno
- profissional
- clean
- inspirado em:
  - McDonald's Kiosk
  - Stripe Dashboard
  - Linear
  - Notion
  - Vercel

---

# Padrões de UI

## Bordas
Utilizar border-radius elevado:

```css
border-radius: 18px;
```

---

## Sombras
Sombras suaves:

```css
box-shadow: 0 4px 20px rgba(0,0,0,0.04);
```

---

## Espaçamento
Priorizar espaços amplos:

```css
padding: 24px;
gap: 20px;
```

---

## Animações

Sempre suaves:

```css
transition: all 0.2s ease;
```

---

# Sidebar

A sidebar deve:
- ser recolhível
- possuir animação suave
- possuir estado ativo
- funcionar em desktop e mobile

---

# Responsividade

O sistema deve funcionar:
- desktop
- tablets
- totens touchscreen
- telas ultrawide

---

# Performance

## Regras

- Evitar re-renderizações desnecessárias
- Utilizar lazy loading
- Evitar estados globais excessivos
- Componentes grandes devem ser divididos
- Imagens otimizadas
- Evitar consultas Firebase desnecessárias

---

# Firebase

## Estrutura esperada

```txt
companies/
products/
categories/
orders/
users/
settings/
```

---

# Padrão de Pedidos

```ts
{
  id: string;
  items: OrderItem[];
  total: number;
  status:
    | "pending"
    | "preparing"
    | "ready"
    | "finished";
  createdAt: Timestamp;
}
```

---

# Estados do Pedido

## Fluxo

```txt
Pendente
→ Em preparo
→ Pronto
→ Finalizado
```

---

# Regras do Frontend

## Nunca

- misturar regra de negócio com JSX
- colocar CSS inline gigante
- duplicar componentes
- usar any sem necessidade
- criar componentes gigantes

---

# Sempre

- separar CSS
- componentizar
- utilizar tipagem
- manter código limpo
- reutilizar componentes

---

# Estrutura de CSS

## Organização

```css
container
header
content
card
button
badge
modal
sidebar
```

---

# UX do Totem

O totem deve priorizar:
- uso touchscreen
- botões grandes
- leitura fácil
- poucos passos
- navegação intuitiva
- imagens grandes
- alta velocidade

---

# UX Admin

O admin deve priorizar:
- produtividade
- velocidade operacional
- leitura rápida
- dashboard clean
- feedback visual claro

---

# UX Kitchen

A tela da cozinha deve priorizar:
- leitura à distância
- alto contraste
- atualização em tempo real
- pedidos grandes
- poucos elementos distrativos

---

# Convenções do Projeto

## Idioma

Código:
- inglês

Interface:
- português inicialmente

---

# Git

## Branches

```txt
main
develop
feature/*
fix/*
```

---

# Commits

Formato:

```txt
feat:
fix:
refactor:
style:
docs:
```

Exemplo:

```txt
feat: add collapsible admin sidebar
```

---

# Objetivo Técnico

O projeto deve ser preparado para:

- multiempresa
- multiunidade
- delivery
- integração PIX
- impressão automática
- dashboard em tempo real
- suporte offline parcial
- integração com cozinha
- suporte mobile

---

# Filosofia do Projeto

O NexOrder deve parecer:
- rápido
- premium
- moderno
- extremamente simples de usar

O código deve parecer:
- profissional
- organizado
- escalável
- fácil de manter