# Simulador Financeiro (CMV / Markup / Precificação) — PRD v0

> Versão 0: define escopo e trilha do MVP. Sem persistência, sem autenticação, sem backend próprio — 100% client-side.

> **Nota de desatualização**: este documento descreve o escopo original (3 abas separadas, Markup só com fórmula DF+DV+ML, CMV só modo revenda). A implementação evoluiu além disso — ver [BACKLOG.md](BACKLOG.md) pra o estado atual e o que foi entregue (Markup fundido em Precificação com modo Markup/Margem, CMV com modo Revenda/Produção, Ponto de Equilíbrio, export CSV/XLSX/PDF). Este arquivo fica como registro histórico do racional original, não como fonte da verdade do estado atual.

## 1. Objetivo

Ferramenta web responsiva para simular três indicadores financeiros de um negócio que compra, estoca e revende mercadoria:

1. **CMV** — Custo da Mercadoria Vendida
2. **Markup** — índice de formação de preço sobre o custo
3. **Precificação** — decisão de preço final, com composição de custos, margem de contribuição e simulação reversa

Escopo **setor-agnóstico** — não é voltado para nicho de alimentação especificamente, apesar de a fórmula ser popularmente associada a food service.

## 2. Fora de escopo (v0)

- Banco de dados / persistência remota
- Autenticação / contas de usuário
- Cadastro de ingredientes, produtos ou receitas
- Histórico de simulações entre sessões (fica pra uma v1, se fizer sentido — via `localStorage` no máximo)
- Integração com IA (não é necessária para os cálculos, que são fórmula fechada)
- App nativo — é web, responsivo para mobile

## 3. Blocos funcionais

### 3.1 Bloco CMV

**Inputs**
- Estoque Inicial (R$)
- Compras (R$)
- Estoque Final (R$)
- Receita Bruta (R$)
- CMV ideal (%) — campo opcional, definido pelo próprio usuário (sem faixa fixa pré-definida, pra não amarrar o produto a um setor)

**Cálculo**
```
CMV (R$) = Estoque Inicial + Compras - Estoque Final
CMV (%)  = (CMV / Receita Bruta) × 100
```

**Output**
- CMV em R$ e em %
- Indicador visual comparando CMV% com o "CMV ideal" informado (se preenchido)

### 3.2 Bloco Markup

**Inputs**
- Despesas Fixas — DF (%)
- Despesas Variáveis — DV (%)
- Margem de Lucro desejada — ML (%)
- Custo do Produto (R$)

**Cálculo**
```
Índice de Markup = 100 ÷ [100 − (DF + DV + ML)]
Preço Sugerido    = Custo do Produto × Índice de Markup
```

**Output**
- Índice de markup
- Preço sugerido de venda

**Ponte com o Bloco 3**: o preço sugerido e os valores de DF/DV/ML/Custo alimentam o Bloco de Precificação como ponto de partida (editável).

### 3.3 Bloco Precificação

**Inputs** (herdados do Bloco 2, editáveis) +:
- Taxa de canal de venda (%) — campo livre, sem opções pré-definidas (marketplace, cartão, comissão etc.)
- Preço de venda desejado (R$) — usado no modo reverso

**Cálculos**
```
Composição do preço = Custo (R$/%) + DF (R$/%) + DV (R$/%) + ML (R$/%) = Preço final
Margem de Contribuição (%) = (Preço − Custo Variável Total) / Preço × 100
```

**Modo reverso**: usuário informa o preço de venda desejado → sistema devolve a margem de contribuição resultante (em vez de partir de DF/DV/ML para chegar no preço).

**Output**
- Composição visual do preço (R$ e %)
- Markup vs. Margem de Contribuição lado a lado (evitar a confusão comum entre os dois)
- Resultado do modo reverso

## 4. Stack proposta

| Camada | Escolha | Observação |
|---|---|---|
| Framework | React + Vite | SPA simples, sem necessidade de SSR/rotas complexas |
| Estilo | Tailwind CSS | Mobile-first, responsividade rápida |
| Componentes | shadcn/ui + [shadcn-ui-expansions](https://github.com/hsuanyi-chou/shadcn-ui-expansions) | Componentes copy-paste (não é dependência de pacote — o código entra no projeto). A expansions adiciona Dual Range Slider, Floating Label Input, Progress With Value, Responsive Modal, entre outros — úteis pra inputs de %/R$ e pro layout responsivo |
| Primitivas | [Radix UI Primitives](https://github.com/radix-ui/primitives) | Já é a base do shadcn/ui — acessibilidade (tabs, tooltip, slider) pronta, sem estilo próprio pra não conflitar com o Tailwind |
| Estado | `useState`/`useReducer` local | Pouco estado, não precisa de Zustand/Redux |
| Persistência (opcional, pós-v0) | `localStorage` | Só se decidir manter o que foi digitado entre sessões — sem virar "banco de dados" |
| Deploy | Vercel / Netlify / Cloudflare Pages | Build estático, sem servidor próprio |

> Nota: o shadcn-ui-expansions é um repo Next.js de demonstração, mas os componentes são copy-paste (mesmo modelo do shadcn/ui) — dá pra portar direto pra um projeto Vite sem carregar o Next junto.

## 5. Estrutura de tela (proposta)

- Uma página única, três seções em abas (Radix `Tabs`): **CMV / Markup / Precificação**
- Cálculo reativo — sem botão "calcular", recalcula a cada mudança de input
- Preço sugerido do Bloco 2 pré-preenche o Bloco 3 automaticamente (editável)
- Indicadores visuais (cor/ícone) quando CMV% foge da meta informada

## 6. Setup inicial (checklist para o VS Code)

- [ ] `npm create vite@latest . -- --template react-ts`
- [ ] Instalar Tailwind CSS
- [ ] Inicializar shadcn/ui (`npx shadcn@latest init`)
- [ ] Adicionar componentes base do shadcn/ui necessários (input, tabs, card, tooltip)
- [ ] Copiar componentes desejados do shadcn-ui-expansions (ex.: Floating Label Input, Dual Range Slider, Progress With Value)
- [ ] Estruturar pastas: `components/cmv`, `components/markup`, `components/precificacao`, `lib/calculos.ts`
- [ ] Implementar `lib/calculos.ts` com as três funções de cálculo (puras, testáveis, sem estado)
- [ ] Montar as três seções/abas consumindo `lib/calculos.ts`

## 7. Próximos passos (fora da v0)

- Implementation Plan detalhado (se quiser formalizar por bloco)
- Task List granular
- Decisão sobre persistência local (v1)
- Decisão sobre se vira lead magnet de algo maior