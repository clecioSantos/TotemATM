# DESIGN SYSTEM - DELIVERY APP

## Objetivo

Criar uma experiência de delivery moderna, rápida e intuitiva, inspirada nas melhores práticas do mercado brasileiro.

Princípios:

* Menos cliques para finalizar pedidos
* Destaque para promoções e ofertas
* Navegação simples
* Interface amigável para celular
* Velocidade percebida alta
* Foco em conversão

---

# Identidade Visual

## Personalidade

A marca deve transmitir:

* Rapidez
* Praticidade
* Confiança
* Modernidade
* Proximidade

## Estilo

Visual limpo, com bastante espaço em branco.

Evitar:

* Bordas pesadas
* Gradientes exagerados
* Muitas cores simultaneamente
* Layouts carregados

Preferir:

* Cartões simples
* Cantos arredondados
* Sombras suaves
* Ícones minimalistas

---

# Paleta de Cores

## Primária

Cor principal da marca.

Uso:

* Botões CTA
* Destaques
* Promoções
* Elementos ativos

## Neutros

Background:
#F7F7F7

Cards:
#FFFFFF

Texto principal:
#202020

Texto secundário:
#666666

Bordas:
#EAEAEA

Status sucesso:
#00A650

Status alerta:
#FFB800

Status erro:
#FF4D4F

---

# Tipografia

Fonte:

* Inter
* SF Pro
* Roboto

Hierarquia:

H1: 32px Bold

H2: 24px Bold

H3: 20px SemiBold

Body: 16px Regular

Small: 14px Regular

Caption: 12px Regular

---

# Estrutura da Home

## Header

Fixo no topo.

Elementos:

* Endereço atual
* Campo de busca
* Perfil
* Carrinho

A busca deve ser o principal elemento visual.

---

## Banner Promocional

Carousel horizontal.

Objetivos:

* Cupons
* Frete grátis
* Campanhas sazonais

Altura aproximada:
180px

---

## Categorias

Scroll horizontal.

Exemplos:

🍔 Lanches

🍕 Pizza

🍣 Japonês

🥩 Churrasco

🍰 Sobremesas

🛒 Mercado

💊 Farmácia

🐶 Pet Shop

Cada categoria:

* Ícone
* Nome
* Fundo neutro

---

## Restaurantes em Destaque

Cards horizontais.

Cada card contém:

* Imagem grande
* Nome
* Nota
* Tempo de entrega
* Taxa de entrega
* Distância
* Categoria

---

## Seção de Promoções

Título:

"Promoções para você"

Cards maiores.

Destacar:

* Desconto
* Cupom
* Frete grátis

---

## Restaurantes Próximos

Lista vertical.

Informações:

* Logo
* Nome
* Categoria
* Avaliação
* Tempo estimado

---

# Página do Restaurante

## Header

Imagem de capa

Logo

Nome

Categoria

Nota

Tempo de entrega

Taxa de entrega

---

## Informações

* Horário
* Distância
* Pedido mínimo
* Avaliações

---

## Cardápio

Categorias fixas:

* Mais pedidos
* Lanches
* Combos
* Bebidas
* Sobremesas

Menu sticky ao rolar.

---

## Produto

Card contendo:

* Foto
* Nome
* Descrição curta
* Preço
* Botão adicionar

Ao clicar:

Abrir modal.

---

# Modal do Produto

Elementos:

* Foto grande
* Descrição
* Complementos
* Observações
* Quantidade
* Preço atualizado em tempo real

CTA:

"Adicionar ao carrinho"

Botão sempre visível.

---

# Carrinho

Layout simples.

Itens:

* Produto
* Quantidade
* Observações
* Valor

Resumo:

Subtotal

Entrega

Cupom

Total

CTA:

"Continuar"

---

# Checkout

Fluxo:

1. Endereço
2. Forma de entrega
3. Pagamento PIX
4. Confirmação

Nunca mostrar mais de uma etapa por vez.

---

# Tela de Pagamento PIX

Exibir:

* QR Code grande
* Código copia e cola
* Valor
* Tempo limite

Botão:

"Já realizei o pagamento"

Atualização automática via webhook.

---

# Rastreamento do Pedido

Timeline:

✅ Pedido recebido

✅ Em preparação

✅ Saiu para entrega

✅ Entregue

Mostrar:

* Tempo estimado
* Atualizações em tempo real

---

# Mobile First

Prioridade absoluta:

375px a 430px

Breakpoints:

Mobile:
320-768

Tablet:
768-1024

Desktop:
1024+

---

# Componentes

## Botões

Altura:
48px

Raio:
12px

Estados:

* Normal
* Hover
* Loading
* Disabled

---

## Cards

Raio:
16px

Sombra leve

Padding:
16px

---

## Inputs

Altura:
48px

Raio:
12px

Placeholder discreto

---

# UX

## Regras

Reduzir fricção.

Usuário deve conseguir:

* Encontrar restaurante em menos de 10 segundos
* Adicionar produto em menos de 2 cliques
* Finalizar pedido em menos de 60 segundos

Sempre priorizar:

* Velocidade
* Clareza
* Conversão

Evitar:

* Popups excessivos
* Telas intermediárias desnecessárias
* Confirmações duplicadas

---

# Microinterações

Adicionar:

* Skeleton loading
* Animações suaves
* Feedback instantâneo
* Vibração em ações importantes no mobile

Duração máxima:

200ms

---

# Objetivo Final

O sistema deve transmitir:

"Escolha rápido, peça rápido, pague rápido."

Toda decisão visual deve favorecer conversão, simplicidade e velocidade.
