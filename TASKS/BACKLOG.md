# Backlog — Próximas tasks

> Referência de comparação: app Genka (custo/receita/ingrediente para food service, com persistência e IA). Ver contexto completo na conversa — aqui só a lista de tasks derivada dela.

Critério de corte: tudo que exige cadastro reutilizável (ingrediente, receita salva) ou IA fica em **v1 — fora de escopo por enquanto**, conforme decisão do usuário de continuar sem persistência até validar o nível de uso / viabilidade comercial. As tasks "Agora" cabem na arquitetura atual (client-side, sem estado salvo, `useState` local).

## Agora (v0 — sem persistência)

- [x] **T1 — Custo unitário por conversão automática**: no bloco Precificação, ao lado do campo "Custo Unitário (R$)", adicionar um modo alternativo de preenchimento: `Valor de Compra (R$) + Quantidade Comprada + Unidade` → calcula o custo unitário automaticamente (ex.: R$ 200 / 350 g = R$ 0,57/g). Alternável com o modo atual (digitar o custo unitário direto), sem exigir cadastro — é só uma calculadora auxiliar de conversão, o resultado vira o valor do campo existente.
- [x] **T2 — Resumo compacto do resultado**: reorganizar a saída do bloco Precificação (Custo Total | Preço | Lucro em R$ | Margem % | Taxa de Custo %) numa barra/faixa horizontal única, em vez de cards separados — inspirado no resumo do rodapé do Genka. Objetivo: leitura mais rápida do resultado final.
- [x] **T3 — Exportar resultado (CSV + XLSX + PDF)**: no bloco Precificação, botões pra exportar a simulação atual (inputs + resultado) em CSV, XLSX e PDF. Geração 100% client-side no clique — nada salvo no app, não é histórico. `xlsx`/`jspdf` carregados via `import()` dinâmico pra não pesar o bundle principal.
- [x] **T4 — Revisão de copy multi-setorial**: conferido via `grep -i` em `src/` por termos de alimentação/insumo/receita culinária/padaria/açougue etc. — nenhuma ocorrência, copy segue setor-agnóstica.
- [x] **T5 — Ponto de Equilíbrio** (origem: notas de Garrison/Noreen/Brewer, Cap. 5): novo campo opcional "Despesas Fixas Totais (R$/mês)" no bloco Precificação (separado do DF%, que continua servindo só pra formar o preço) + card mostrando `PE (R$) = DF Totais ÷ Índice MC` e `PE (unidades) = DF Totais ÷ Margem de Contribuição por unidade`. Só aparece quando o campo é preenchido.
- [x] **T6 — Nota explicativa markup BR vs. Garrison**: ícone `Info` + `Tooltip` (shadcn/Radix, já instalado mas nunca usado) no card "Preço sugerido" do Markup, explicando a diferença entre markup sobre preço de venda (BR, usado aqui) e markup sobre custo (Garrison/livros americanos).
- [x] **T7 — Custo-meta (target costing)**: novo campo "Lucro desejado (R$)" no card "Modo reverso" da Precificação — quando preenchido junto do preço desejado, calcula `Custo-meta = Preço − Lucro desejado` (`calcularCustoMeta` em `calculos.ts`).
- [x] **T8 — Bloco CMV: modo Revenda vs Produção (matéria-prima)**: toggle "Revenda" (fórmula original, sem mudança) / "Produção" (fluxo de 3 estágios: Consumo de Matéria-Prima → Custo de Produção do Período (+ Mão de Obra Direta + Custos Indiretos de Fabricação) → CPV via Produtos em Elaboração opcional + Produtos Acabados). Cobre negócio que transforma matéria-prima em produto, não só quem revende pronto. `SegmentedToggle` extraído pra `src/components/ui/segmented-toggle.tsx` e reusado no Markup.
- [x] **T9 — Correção de bugs encontrados em revisão geral**:
  - `toNumber` não reconhecia separador de milhar BR (`1.234,56` virava `NaN`→`0` silenciosamente) — corrigido pra remover pontos antes de trocar vírgula por ponto, só quando há vírgula na string.
  - Bug de falsy check na sincronização Markup→Precificação: margem calculada em exatamente 0% não atualizava o campo (tratava `0` como "sem valor"). Trocado pra checar se `custoUnitario` foi preenchido, não o valor da margem.
  - Avisos de validação novos: Markup (modo Margem) avisa se a margem ≥ 100%; Precificação avisa se DF+DV+ML+Taxa de canal somam ≥ 100% — antes os dois casos geravam preço negativo/zero silenciosamente.
  - [TASKS/VERSION0.md](VERSION0.md) ganhou nota apontando que está desatualizado em relação à implementação atual, com link pra este backlog.
- [x] **T10 — Testes automatizados pro `calculos.ts`**: Vitest instalado (`npm run test`), 24 testes cobrindo todas as funções de cálculo (CMV, CPV, Markup, Precificação, Ponto de Equilíbrio, Modo Reverso, Custo-meta, `toNumber` incluindo os casos de separador de milhar). Roda em ambiente `node` puro, sem jsdom — são só funções puras. Confirmado que o arquivo de teste não vaza pro bundle de produção.
- [x] **T11 — Export consistente no Bloco CMV**: mesmos três botões (CSV/XLSX/PDF) já usados em Precificação, agora também no card "Resultado" do CMV — cobre os campos certos conforme o modo atual (Revenda ou Produção).

## v1 — fora de escopo por enquanto (persistência)

- [ ] Cadastro de ingredientes (nome, preço de compra, unidade, conversão) reutilizável entre simulações
- [ ] Cadastro de receitas/produtos — composição por múltiplos ingredientes com quantidade, custo total somado automaticamente
- [ ] Preparos base / componentes intermediários (receita usada dentro de outra receita)
- [ ] Persistência local (`localStorage`) ou remota — decisão de arquitetura pendente até haver sinal de uso/validação comercial
- [ ] Histórico de exportações/simulações salvas (a T3 acima é só export avulso, sem guardar nada)
- [ ] Importação assistida por IA — explicitamente fora de escopo (PRD v0, seção 2)
