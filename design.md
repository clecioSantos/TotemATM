# BORA DE DELIVERY - DESIGN SYSTEM

## Slogan

> **Se a fome chama, Bora de Delivery.**

---

# Visão da Marca

O Bora de Delivery é uma plataforma moderna de pedidos online criada para conectar clientes aos melhores restaurantes da cidade através de uma experiência rápida, intuitiva e agradável.

A marca deve transmitir movimento, praticidade e proximidade, tornando-se a primeira escolha quando o usuário pensar em pedir comida.

---

# Objetivo

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
* Energia
* Conveniência

## Arquétipos

### Principal

Companheiro

Uma marca próxima, amigável e presente no dia a dia do usuário.

### Secundário

Herói

Resolve rapidamente um problema imediato: a fome.

---

## Tom de Voz

Características:

* Brasileiro
* Conversacional
* Simples
* Amigável
* Direto
* Moderno

Exemplos:

* Bateu a fome?
* Bora pedir?
* Seu pedido está chegando.
* A fome chamou. A gente respondeu.
* Seu restaurante favorito está aqui.

---

## Conceito do Logo

O símbolo da marca deve unir:

* Letra B
* Sacola de delivery
* Seta de movimento

Representando:

* Pedido
* Rapidez
* Entrega
* Movimento
* Facilidade

O ícone deve funcionar perfeitamente como favicon, ícone mobile e avatar de redes sociais.

---

# Estilo Visual

Visual limpo com bastante espaço em branco.

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
* Fotos grandes de alimentos

---

# Paleta de Cores

## Cor Principal

### Laranja Bora

```css
#FF6B00
```

Uso:

* CTA principal
* Elementos ativos
* Promoções
* Botões
* Destaques

---

## Cor Secundária

### Laranja Escuro

```css
#E65C00
```

Uso:

* Hover
* Estados pressionados
* Elementos de destaque

---

## Neutros

Background:

```css
#FAFAFA
```

Cards:

```css
#FFFFFF
```

Texto principal:

```css
#1F1F1F
```

Texto secundário:

```css
#666666
```

Bordas:

```css
#EAEAEA
```

---

## Status

Sucesso:

```css
#22C55E
```

Alerta:

```css
#FFB800
```

Erro:

```css
#FF4D4F
```

---

# Tipografia

## Principal

Poppins

Pesos:

* 700 Bold
* 600 SemiBold
* 500 Medium
* 400 Regular

## Alternativas

* Inter
* SF Pro
* Roboto

---

## Hierarquia

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

## Hero Principal

Título:

**Bateu a fome?**

Subtítulo:

**Peça nos melhores restaurantes da cidade.**

CTA:

**Bora Pedir**

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

**Promoções para você**

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

* Imagem de capa
* Logo
* Nome
* Categoria
* Nota
* Tempo de entrega
* Taxa de entrega

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

Menu sticky durante rolagem.

---

## Produto

Cada card contém:

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

CTA fixo:

**Adicionar ao carrinho**

---

# Carrinho

Layout simples.

Itens:

* Produto
* Quantidade
* Observações
* Valor

Resumo:

* Subtotal
* Entrega
* Cupom
* Total

CTA:

**Continuar**

---

# Checkout

Fluxo:

1. Endereço
2. Forma de entrega
3. Pagamento PIX
4. Confirmação

Nunca mostrar mais de uma etapa simultaneamente.

---

# Tela de Pagamento PIX

Exibir:

* QR Code grande
* Código copia e cola
* Valor
* Tempo limite

CTA:

**Já realizei o pagamento**

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

CTA principal utiliza sempre a cor #FF6B00.

---

## Cards

Raio:

16px

Padding:

16px

Sombras suaves:

```css
box-shadow: 0 4px 12px rgba(0,0,0,0.08);
```

---

## Inputs

Altura:

48px

Raio:

12px

Placeholder discreto.

---

# Microinterações

Adicionar:

* Skeleton Loading
* Feedback instantâneo
* Animações suaves
* Vibração em ações importantes no mobile

Duração máxima:

200ms

---

# Mascote (Opcional)

## Borinha

Uma sacola de delivery simpática com uma seta formando um sorriso.

Pode aparecer em:

* Campanhas promocionais
* Loading
* Empty states
* Notificações

---

# UX

## Regras

Usuário deve conseguir:

* Encontrar restaurante em menos de 10 segundos
* Adicionar produto em menos de 2 cliques
* Finalizar pedido em menos de 60 segundos

Priorizar sempre:

* Velocidade
* Clareza
* Conversão

Evitar:

* Popups excessivos
* Telas intermediárias desnecessárias
* Confirmações duplicadas

---

# Objetivo Final

O sistema deve transmitir:

> "Se a fome chama, Bora de Delivery."

Toda decisão visual deve favorecer:

* Conversão
* Simplicidade
* Rapidez
* Confiança
* Facilidade de uso

A experiência deve fazer o usuário sentir que pedir comida leva apenas alguns segundos.

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

* Energia
* Conveniência

## Arquétipos

### Principal

Companheiro

Uma marca próxima, amigável e presente no dia a dia do usuário.

### Secundário

Herói

Resolve rapidamente um problema imediato: a fome.

---

## Tom de Voz

Características:

* Brasileiro
* Conversacional
* Simples
* Amigável
* Direto
* Moderno

Exemplos:

* Bateu a fome?
* Bora pedir?
* Seu pedido está chegando.
* A fome chamou. A gente respondeu.
* Seu restaurante favorito está aqui.

---

## Conceito do Logo

O símbolo da marca deve unir:

* Letra B
* Sacola de delivery
* Seta de movimento

Representando:

* Pedido
* Rapidez
* Entrega
* Movimento
* Facilidade

O ícone deve funcionar perfeitamente como favicon, ícone mobile e avatar de redes sociais.

---

# Estilo Visual

Visual limpo com bastante espaço em branco.

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
* Fotos grandes de alimentos

---

# Paleta de Cores

## Cor Principal

### Laranja Bora

```css
#FF6B00
```

Uso:

* CTA principal
* Elementos ativos
* Promoções
* Botões
* Destaques

---

## Cor Secundária

### Laranja Escuro

```css
#E65C00
```

Uso:

* Hover
* Estados pressionados
* Elementos de destaque

---

## Neutros

Background:

```css
#FAFAFA
```

Cards:

```css
#FFFFFF
```

Texto principal:

```css
#1F1F1F
```

Texto secundário:

```css
#666666
```

Bordas:

```css
#EAEAEA
```

---

## Status

Sucesso:

```css
#22C55E
```

Alerta:

```css
#FFB800
```

Erro:

```css
#FF4D4F
```

---

# Tipografia

## Principal

Poppins

Pesos:

* 700 Bold
* 600 SemiBold
* 500 Medium
* 400 Regular

## Alternativas

* Inter
* SF Pro
* Roboto

---

## Hierarquia

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

## Hero Principal

Título:

**Bateu a fome?**

Subtítulo:

**Peça nos melhores restaurantes da cidade.**

CTA:

**Bora Pedir**

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

**Promoções para você**

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

* Imagem de capa
* Logo
* Nome
* Categoria
* Nota
* Tempo de entrega
* Taxa de entrega

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

Menu sticky durante rolagem.

---

## Produto

Cada card contém:

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

CTA fixo:

**Adicionar ao carrinho**

---

# Carrinho

Layout simples.

Itens:

* Produto
* Quantidade
* Observações
* Valor

Resumo:

* Subtotal
* Entrega
* Cupom
* Total

CTA:

**Continuar**

---

# Checkout

Fluxo:

1. Endereço
2. Forma de entrega
3. Pagamento PIX
4. Confirmação

Nunca mostrar mais de uma etapa simultaneamente.

---

# Tela de Pagamento PIX

Exibir:

* QR Code grande
* Código copia e cola
* Valor
* Tempo limite

CTA:

**Já realizei o pagamento**

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

CTA principal utiliza sempre a cor #FF6B00.
---

## Cards

Raio:

16px

Padding:

16px

Sombras suaves:

```css
box-shadow: 0 4px 12px rgba(0,0,0,0.08);
```

---

## Inputs

Altura:

48px

Raio:

12px

Placeholder discreto.

---

# Microinterações

Adicionar:

* Skeleton Loading
* Feedback instantâneo
* Animações suaves
* Vibração em ações importantes no mobile

Duração máxima:

200ms

---

# Mascote (Opcional)

## Borinha

Uma sacola de delivery simpática com uma seta formando um sorriso.

Pode aparecer em:

* Campanhas promocionais
* Loading
* Empty states
* Notificações

---

# UX

## Regras

Usuário deve conseguir:

* Encontrar restaurante em menos de 10 segundos
* Adicionar produto em menos de 2 cliques
* Finalizar pedido em menos de 60 segundos

Priorizar sempre:

* Velocidade
* Clareza
* Conversão

Evitar:

* Popups excessivos
* Telas intermediárias desnecessárias
* Confirmações duplicadas

---

# Objetivo Final

O sistema deve transmitir:

> "Se a fome chama, Bora de Delivery."

Toda decisão visual deve favorecer:

* Conversão
* Simplicidade
* Rapidez
* Confiança
* Facilidade de uso

A experiência deve fazer o usuário sentir que pedir comida leva apenas alguns segundos.


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
* Fotos grandes de alimentos

---

# Paleta de Cores

## Cor Principal

### Laranja Bora

```css
#FF6B00
```

Uso:

* CTA principal
* Elementos ativos
* Promoções
* Botões
* Destaques

---

## Cor Secundária

### Laranja Escuro

```css
#E65C00
```

Uso:

* Hover
* Estados pressionados
* Elementos de destaque

---

## Neutros

Background:

```css
#FAFAFA
```

Cards:

```css
#FFFFFF
```

Texto principal:

```css
#1F1F1F
```

Texto secundário:

```css
#666666
```

Bordas:

```css
#EAEAEA
```

---

## Status

Sucesso:

```css
#22C55E
```

Alerta:

```css
#FFB800
```

Erro:

```css
#FF4D4F
```

---

# Tipografia

## Principal

Poppins

Pesos:

* 700 Bold
* 600 SemiBold
* 500 Medium
* 400 Regular

## Alternativas

* Inter
* SF Pro
* Roboto

---

## Hierarquia

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

## Hero Principal

Título:

**Bateu a fome?**

Subtítulo:

**Peça nos melhores restaurantes da cidade.**

CTA:

**Bora Pedir**

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

**Promoções para você**

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

* Imagem de capa
* Logo
* Nome
* Categoria
* Nota
* Tempo de entrega
* Taxa de entrega

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

Menu sticky durante rolagem.

---

## Produto

Cada card contém:

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

CTA fixo:

**Adicionar ao carrinho**

---

# Carrinho

Layout simples.

Itens:

* Produto
* Quantidade
* Observações
* Valor

Resumo:

* Subtotal
* Entrega
* Cupom
* Total

CTA:

**Continuar**

---

# Checkout

Fluxo:

1. Endereço
2. Forma de entrega
3. Pagamento PIX
4. Confirmação

Nunca mostrar mais de uma etapa simultaneamente.

---

# Tela de Pagamento PIX

Exibir:

* QR Code grande
* Código copia e cola
* Valor
* Tempo limite

CTA:

**Já realizei o pagamento**

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

CTA principal utiliza sempre a cor #FF6B00.

---

## Cards

Raio:

16px

Padding:

16px

Sombras suaves:

```css
box-shadow: 0 4px 12px rgba(0,0,0,0.08);
```

---

## Inputs

Altura:

48px

Raio:

12px

Placeholder discreto.

---

# Microinterações

Adicionar:

* Skeleton Loading
* Feedback instantâneo
* Animações suaves
* Vibração em ações importantes no mobile

Duração máxima:

200ms

---

# Mascote (Opcional)

## Borinha

Uma sacola de delivery simpática com uma seta formando um sorriso.

Pode aparecer em:

* Campanhas promocionais
* Loading
* Empty states
* Notificações

---

# UX

## Regras

Usuário deve conseguir:

* Encontrar restaurante em menos de 10 segundos
* Adicionar produto em menos de 2 cliques
* Finalizar pedido em menos de 60 segundos

Priorizar sempre:

* Velocidade
* Clareza
* Conversão

Evitar:

* Popups excessivos
* Telas intermediárias desnecessárias
* Confirmações duplicadas

---

# Objetivo Final

O sistema deve transmitir:

> "Se a fome chama, Bora de Delivery."

Toda decisão visual deve favorecer:

* Conversão
* Simplicidade
* Rapidez
* Confiança
* Facilidade de uso

A experiência deve fazer o usuário sentir que pedir comida leva apenas alguns segundos.


---

# Paleta de Cores

## Primária

Cor principal da marca.

Uso:

* Botões CTA
* Destaques
* Promoções
* Elementos ativos

---

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

---

## Hierarquia

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

# Microinterações

Adicionar:

* Skeleton Loading
* Feedback instantâneo
* Animações suaves
* Vibração em ações importantes no mobile

Duração máxima:

200ms

---

# Mascote (Opcional)

## Borinha

Uma sacola de delivery simpática com uma seta formando um sorriso.

Pode aparecer em:

* Campanhas promocionais
* Loading
* Empty states
* Notificações

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

# Objetivo Final

O sistema deve transmitir:

"Escolha rápido, peça rápido, pague rápido."

Toda decisão visual deve favorecer conversão, simplicidade e velocidade.



## Neutros

Background:

```css
#FAFAFA
```

Cards:

```css
#FFFFFF
```

Texto principal:

```css
#1F1F1F
```

Texto secundário:

```css
#666666
```

Bordas:

```css
#EAEAEA
```

---

## Status

Sucesso:

```css
#22C55E
```

Alerta:

```css
#FFB800
```

Erro:

```css
#FF4D4F
```

---

# Tipografia

## Principal

Poppins

Pesos:

* 700 Bold
* 600 SemiBold
* 500 Medium
* 400 Regular

## Alternativas

* Inter
* SF Pro
* Roboto

---

## Hierarquia

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

## Hero Principal

Título:

**Bateu a fome?**

Subtítulo:

**Peça nos melhores restaurantes da cidade.**

CTA:

**Bora Pedir**

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

**Promoções para você**

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

* Imagem de capa
* Logo
* Nome
* Categoria
* Nota
* Tempo de entrega
* Taxa de entrega

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

Menu sticky durante rolagem.

---

## Produto

Cada card contém:

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

CTA fixo:

**Adicionar ao carrinho**

---

# Carrinho

Layout simples.

Itens:

* Produto
* Quantidade
* Observações
* Valor

Resumo:

* Subtotal
* Entrega
* Cupom
* Total

CTA:

**Continuar**

---

# Checkout

Fluxo:

1. Endereço
2. Forma de entrega
3. Pagamento PIX
4. Confirmação

Nunca mostrar mais de uma etapa simultaneamente.

---

# Tela de Pagamento PIX

Exibir:

* QR Code grande
* Código copia e cola
* Valor
* Tempo limite

CTA:

**Já realizei o pagamento**

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

CTA principal utiliza sempre a cor #FF6B00.

---

## Cards

Raio:

16px

Padding:

16px

Sombras suaves:

```css
box-shadow: 0 4px 12px rgba(0,0,0,0.08);
```

---

## Inputs

Altura:

48px

Raio:

12px

Placeholder discreto.

---

# Microinterações

Adicionar:

* Skeleton Loading
* Feedback instantâneo
* Animações suaves
* Vibração em ações importantes no mobile

Duração máxima:

200ms

---

# Mascote (Opcional)

## Borinha

Uma sacola de delivery simpática com uma seta formando um sorriso.

Pode aparecer em:

* Campanhas promocionais
* Loading
* Empty states
* Notificações

---

# UX

## Regras

Usuário deve conseguir:

* Encontrar restaurante em menos de 10 segundos
* Adicionar produto em menos de 2 cliques
* Finalizar pedido em menos de 60 segundos

Priorizar sempre:

* Velocidade
* Clareza
* Conversão

Evitar:

* Popups excessivos
* Telas intermediárias desnecessárias
* Confirmações duplicadas

---

# Objetivo Final

O sistema deve transmitir:

> "Se a fome chama, Bora de Delivery."

Toda decisão visual deve favorecer:

* Conversão
* Simplicidade
* Rapidez
* Confiança
* Facilidade de uso

A experiência deve fazer o usuário sentir que pedir comida leva apenas alguns segundos.


---

# Tipografia


* Inter
* SF Pro
* Roboto


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


---

## Produto


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


---

# Carrinho

Layout simples.

Itens:

* Produto
* Quantidade
* Observações
* Valor

Resumo:


---

# Checkout

Fluxo:

1. Endereço
2. Forma de entrega
3. Pagamento PIX
4. Confirmação


---

# Tela de Pagamento PIX

Exibir:

* QR Code grande
* Código copia e cola
* Valor
* Tempo limite


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
12px

Estados:

* Normal
* Hover
* Loading
* Disabled

---

## Cards

Raio:
---

## Inputs

Altura:

---

# UX

## Regras

Usuário deve conseguir:

* Encontrar restaurante em menos de 10 segundos
* Adicionar produto em menos de 2 cliques
* Finalizar pedido em menos de 60 segundos


* Velocidade
* Clareza
* Conversão

Evitar:

* Popups excessivos
* Telas intermediárias desnecessárias
* Confirmações duplicadas

---

# Objetivo Final

O sistema deve transmitir:

