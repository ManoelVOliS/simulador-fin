import type { CmvFormState } from '@/components/cmv/CmvBloco'
import type { MarkupFormState } from '@/components/markup/MarkupBloco'
import type { PrecificacaoFormState } from '@/components/precificacao/PrecificacaoBloco'

export const cmvExemploRevenda: Omit<CmvFormState, 'modo'> = {
  estoqueInicial: '5000',
  compras: '15000',
  estoqueFinal: '4000',
  receitaBruta: '30000',
  cmvIdeal: '35',
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

export const cmvExemploProducao: Omit<CmvFormState, 'modo'> = {
  estoqueInicial: '',
  compras: '',
  estoqueFinal: '',
  receitaBruta: '30000',
  cmvIdeal: '45',
  mpEstoqueInicial: '2000',
  mpCompras: '8000',
  mpEstoqueFinal: '1500',
  maoDeObraDireta: '4000',
  custosIndiretosFabricacao: '2500',
  peEstoqueInicial: '500',
  peEstoqueFinal: '700',
  paEstoqueInicial: '1000',
  paEstoqueFinal: '800',
}

export const markupExemplo: MarkupFormState = {
  modo: 'markup',
  custoUnitario: '12',
  indiceMarkup: '2.5',
  margemLucro: '30',
  custoUnitarioModo: 'direto',
  valorCompra: '',
  quantidadeComprada: '',
  unidadeCompra: '',
}

export const precificacaoExemplo: PrecificacaoFormState = {
  custo: '12',
  despesasFixas: '15',
  despesasFixasModo: 'itens',
  despesasFixasItens: [
    { id: 'exemplo-df-1', nome: 'Aluguel', percentual: '8' },
    { id: 'exemplo-df-2', nome: 'Salários', percentual: '7' },
  ],
  despesasVariaveis: '8',
  despesasVariaveisModo: 'direto',
  despesasVariaveisItens: [],
  margemLucro: '20',
  taxaCanal: '5',
  precoDesejado: '35',
  despesasFixasTotais: '4500',
  lucroDesejado: '10',
}
