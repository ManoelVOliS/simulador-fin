export function toNumber(valor: string): number {
  if (!valor) return 0
  // Formato BR (ex.: "1.234,56"): vírgula é decimal, ponto é milhar — remove os pontos antes de trocar a vírgula.
  // Sem vírgula, assume que o ponto (se houver) já é decimal (ex.: "1234.56" colado de outra fonte).
  const semMilhar = valor.includes(',') ? valor.replace(/\./g, '') : valor
  const normalizado = semMilhar.replace(',', '.')
  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : 0
}

export function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatarPercentual(valor: number): string {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

export type StatusCmv = 'acima' | 'dentro' | 'abaixo' | null

export function avaliarStatusVsIdeal(percentual: number, ideal?: number): StatusCmv {
  if (ideal === undefined || Number.isNaN(ideal)) return null
  if (percentual > ideal) return 'acima'
  if (percentual < ideal) return 'abaixo'
  return 'dentro'
}

export type ModoCmv = 'revenda' | 'producao'

export interface CmvInput {
  estoqueInicial: number
  compras: number
  estoqueFinal: number
  receitaBruta: number
  cmvIdeal?: number
}

export interface CmvResultado {
  cmvReais: number
  cmvPercentual: number
  statusVsIdeal: StatusCmv
}

export function calcularCMV({
  estoqueInicial,
  compras,
  estoqueFinal,
  receitaBruta,
  cmvIdeal,
}: CmvInput): CmvResultado {
  const cmvReais = estoqueInicial + compras - estoqueFinal
  const cmvPercentual = receitaBruta !== 0 ? (cmvReais / receitaBruta) * 100 : 0
  const statusVsIdeal = avaliarStatusVsIdeal(cmvPercentual, cmvIdeal)

  return { cmvReais, cmvPercentual, statusVsIdeal }
}

export interface CpvInput {
  mpEstoqueInicial: number
  mpCompras: number
  mpEstoqueFinal: number
  maoDeObraDireta: number
  custosIndiretosFabricacao: number
  /** Produtos em elaboração (WIP) — opcional, default 0 pra quem não rastreia separadamente. */
  peEstoqueInicial: number
  peEstoqueFinal: number
  paEstoqueInicial: number
  paEstoqueFinal: number
  receitaBruta: number
  cmvIdeal?: number
}

export interface CpvResultado {
  consumoMateriaPrima: number
  custoProducaoPeriodo: number
  custoProducaoAcabada: number
  cpvReais: number
  cpvPercentual: number
  statusVsIdeal: StatusCmv
}

export function calcularCPV({
  mpEstoqueInicial,
  mpCompras,
  mpEstoqueFinal,
  maoDeObraDireta,
  custosIndiretosFabricacao,
  peEstoqueInicial,
  peEstoqueFinal,
  paEstoqueInicial,
  paEstoqueFinal,
  receitaBruta,
  cmvIdeal,
}: CpvInput): CpvResultado {
  const consumoMateriaPrima = mpEstoqueInicial + mpCompras - mpEstoqueFinal
  const custoProducaoPeriodo = consumoMateriaPrima + maoDeObraDireta + custosIndiretosFabricacao
  const custoProducaoAcabada = peEstoqueInicial + custoProducaoPeriodo - peEstoqueFinal
  const cpvReais = paEstoqueInicial + custoProducaoAcabada - paEstoqueFinal
  const cpvPercentual = receitaBruta !== 0 ? (cpvReais / receitaBruta) * 100 : 0
  const statusVsIdeal = avaliarStatusVsIdeal(cpvPercentual, cmvIdeal)

  return {
    consumoMateriaPrima,
    custoProducaoPeriodo,
    custoProducaoAcabada,
    cpvReais,
    cpvPercentual,
    statusVsIdeal,
  }
}

export function calcularCustoUnitarioPorConversao(
  valorCompra: number,
  quantidadeComprada: number,
): number {
  return quantidadeComprada !== 0 ? valorCompra / quantidadeComprada : 0
}

export type ModoMarkup = 'markup' | 'margem'

export interface MarkupInput {
  modo: ModoMarkup
  custoUnitario: number
  /** Usado quando modo === 'markup'. Multiplicador aplicado sobre o custo (ex.: 2.5). */
  indiceMarkup: number
  /** Usado quando modo === 'margem'. Margem de lucro desejada, em % sobre o preço de venda. */
  margemLucro: number
}

export interface MarkupResultado {
  indiceMarkup: number
  margemSobrePrecoPercentual: number
  precoSugerido: number
}

export function calcularMarkup({
  modo,
  custoUnitario,
  indiceMarkup,
  margemLucro,
}: MarkupInput): MarkupResultado {
  if (modo === 'margem') {
    const divisor = 1 - margemLucro / 100
    const precoSugerido = divisor !== 0 ? custoUnitario / divisor : 0
    const indice = custoUnitario !== 0 ? precoSugerido / custoUnitario : 0
    return { indiceMarkup: indice, margemSobrePrecoPercentual: margemLucro, precoSugerido }
  }

  const precoSugerido = custoUnitario * indiceMarkup
  const margemSobrePrecoPercentual =
    precoSugerido !== 0 ? ((precoSugerido - custoUnitario) / precoSugerido) * 100 : 0

  return { indiceMarkup, margemSobrePrecoPercentual, precoSugerido }
}

export interface ItemDespesa {
  id: string
  nome: string
  percentual: number
}

export function somarPercentuaisItens(itens: { percentual: number }[]): number {
  return itens.reduce((total, item) => total + item.percentual, 0)
}

export interface PrecificacaoInput {
  custo: number
  despesasFixas: number
  despesasVariaveis: number
  margemLucro: number
  taxaCanal: number
}

export interface ComposicaoItem {
  reais: number
  percentual: number
}

export interface PrecificacaoResultado {
  preco: number
  indiceMarkup: number
  composicao: {
    custo: ComposicaoItem
    despesasFixas: ComposicaoItem
    despesasVariaveis: ComposicaoItem
    taxaCanal: ComposicaoItem
    margemLucro: ComposicaoItem
  }
  margemContribuicaoPercentual: number
  margemContribuicaoReais: number
}

function itemComposicao(percentual: number, preco: number): ComposicaoItem {
  return { percentual, reais: (percentual / 100) * preco }
}

export function calcularPrecificacao({
  custo,
  despesasFixas,
  despesasVariaveis,
  margemLucro,
  taxaCanal,
}: PrecificacaoInput): PrecificacaoResultado {
  const divisor = 100 - (despesasFixas + despesasVariaveis + margemLucro + taxaCanal)
  const indiceMarkup = divisor !== 0 ? 100 / divisor : 0
  const preco = custo * indiceMarkup
  const custoPercentual = preco !== 0 ? (custo / preco) * 100 : 0

  const composicao = {
    custo: itemComposicao(custoPercentual, preco),
    despesasFixas: itemComposicao(despesasFixas, preco),
    despesasVariaveis: itemComposicao(despesasVariaveis, preco),
    taxaCanal: itemComposicao(taxaCanal, preco),
    margemLucro: itemComposicao(margemLucro, preco),
  }

  const custoVariavelTotal =
    custo + composicao.despesasVariaveis.reais + composicao.taxaCanal.reais
  const margemContribuicaoReais = preco - custoVariavelTotal
  const margemContribuicaoPercentual = preco !== 0 ? (margemContribuicaoReais / preco) * 100 : 0

  return { preco, indiceMarkup, composicao, margemContribuicaoPercentual, margemContribuicaoReais }
}

export interface PontoEquilibrioInput {
  despesasFixasTotais: number
  margemContribuicaoPercentual: number
  margemContribuicaoReaisPorUnidade: number
}

export interface PontoEquilibrioResultado {
  pontoEquilibrioReais: number
  pontoEquilibrioUnidades: number
}

export function calcularPontoEquilibrio({
  despesasFixasTotais,
  margemContribuicaoPercentual,
  margemContribuicaoReaisPorUnidade,
}: PontoEquilibrioInput): PontoEquilibrioResultado {
  const indiceMC = margemContribuicaoPercentual / 100
  const pontoEquilibrioReais = indiceMC !== 0 ? despesasFixasTotais / indiceMC : 0
  const pontoEquilibrioUnidades =
    margemContribuicaoReaisPorUnidade !== 0
      ? despesasFixasTotais / margemContribuicaoReaisPorUnidade
      : 0

  return { pontoEquilibrioReais, pontoEquilibrioUnidades }
}

export interface ModoReversoInput {
  precoDesejado: number
  custo: number
  despesasVariaveis: number
  taxaCanal: number
}

export interface ModoReversoResultado {
  margemContribuicaoPercentual: number
  margemContribuicaoReais: number
}

export function calcularModoReverso({
  precoDesejado,
  custo,
  despesasVariaveis,
  taxaCanal,
}: ModoReversoInput): ModoReversoResultado {
  const despesasVariaveisReais = (despesasVariaveis / 100) * precoDesejado
  const taxaCanalReais = (taxaCanal / 100) * precoDesejado
  const custoVariavelTotal = custo + despesasVariaveisReais + taxaCanalReais

  const margemContribuicaoReais = precoDesejado - custoVariavelTotal
  const margemContribuicaoPercentual =
    precoDesejado !== 0 ? (margemContribuicaoReais / precoDesejado) * 100 : 0

  return { margemContribuicaoPercentual, margemContribuicaoReais }
}

export function calcularCustoMeta(precoDesejado: number, lucroDesejado: number): number {
  return precoDesejado - lucroDesejado
}
