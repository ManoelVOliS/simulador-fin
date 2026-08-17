import type { CmvFormState } from '@/components/cmv/CmvBloco'
import type { MarkupFormState } from '@/components/markup/MarkupBloco'
import type { PrecificacaoFormState } from '@/components/precificacao/PrecificacaoBloco'

export const cmvInicial: CmvFormState = {
  modo: 'revenda',
  estoqueInicial: '',
  compras: '',
  estoqueFinal: '',
  receitaBruta: '',
  cmvIdeal: '',
  mpEstoqueInicial: '',
  mpCompras: '',
  mpEstoqueFinal: '',
  maoDeObraDireta: '',
  custosIndiretosFabricacao: '',
  peEstoqueInicial: '',
  peEstoqueFinal: '',
  paEstoqueInicial: '',
  paEstoqueFinal: '',
}

export const markupInicial: MarkupFormState = {
  modo: 'markup',
  custoUnitario: '',
  indiceMarkup: '',
  margemLucro: '',
  custoUnitarioModo: 'direto',
  valorCompra: '',
  quantidadeComprada: '',
  unidadeCompra: '',
}

export const precificacaoInicial: PrecificacaoFormState = {
  custo: '',
  despesasFixas: '',
  despesasVariaveis: '',
  margemLucro: '',
  taxaCanal: '',
  precoDesejado: '',
  despesasFixasTotais: '',
  lucroDesejado: '',
}
