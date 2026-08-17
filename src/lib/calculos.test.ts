import { describe, expect, it } from 'vitest'
import {
  avaliarStatusVsIdeal,
  calcularCMV,
  calcularCPV,
  calcularCustoMeta,
  calcularCustoUnitarioPorConversao,
  calcularMarkup,
  calcularModoReverso,
  calcularPontoEquilibrio,
  calcularPrecificacao,
  somarPercentuaisItens,
  toNumber,
} from './calculos'

describe('toNumber', () => {
  it('converte números simples', () => {
    expect(toNumber('1234')).toBe(1234)
  })

  it('converte decimal com vírgula', () => {
    expect(toNumber('10,50')).toBe(10.5)
  })

  it('remove separador de milhar BR antes da vírgula decimal', () => {
    expect(toNumber('1.234,56')).toBe(1234.56)
  })

  it('aceita decimal com ponto quando não há vírgula', () => {
    expect(toNumber('1234.56')).toBe(1234.56)
  })

  it('retorna 0 pra string vazia', () => {
    expect(toNumber('')).toBe(0)
  })

  it('retorna 0 pra entrada inválida', () => {
    expect(toNumber('abc')).toBe(0)
  })
})

describe('avaliarStatusVsIdeal', () => {
  it('retorna null quando ideal não é informado', () => {
    expect(avaliarStatusVsIdeal(30)).toBeNull()
  })

  it('retorna acima quando percentual excede o ideal', () => {
    expect(avaliarStatusVsIdeal(35, 30)).toBe('acima')
  })

  it('retorna abaixo quando percentual fica abaixo do ideal', () => {
    expect(avaliarStatusVsIdeal(25, 30)).toBe('abaixo')
  })

  it('retorna dentro quando percentual é igual ao ideal', () => {
    expect(avaliarStatusVsIdeal(30, 30)).toBe('dentro')
  })
})

describe('calcularCMV', () => {
  it('calcula CMV em R$ e %', () => {
    const resultado = calcularCMV({
      estoqueInicial: 1000,
      compras: 5000,
      estoqueFinal: 1500,
      receitaBruta: 10000,
    })
    expect(resultado.cmvReais).toBe(4500)
    expect(resultado.cmvPercentual).toBe(45)
    expect(resultado.statusVsIdeal).toBeNull()
  })

  it('avalia status vs ideal', () => {
    const resultado = calcularCMV({
      estoqueInicial: 1000,
      compras: 5000,
      estoqueFinal: 1500,
      receitaBruta: 10000,
      cmvIdeal: 30,
    })
    expect(resultado.statusVsIdeal).toBe('acima')
  })

  it('não divide por zero quando receita bruta é 0', () => {
    const resultado = calcularCMV({
      estoqueInicial: 100,
      compras: 100,
      estoqueFinal: 50,
      receitaBruta: 0,
    })
    expect(resultado.cmvPercentual).toBe(0)
  })
})

describe('calcularCPV', () => {
  it('calcula os 3 estágios completos', () => {
    const resultado = calcularCPV({
      mpEstoqueInicial: 100,
      mpCompras: 500,
      mpEstoqueFinal: 50,
      maoDeObraDireta: 200,
      custosIndiretosFabricacao: 150,
      peEstoqueInicial: 0,
      peEstoqueFinal: 0,
      paEstoqueInicial: 0,
      paEstoqueFinal: 0,
      receitaBruta: 1800,
    })
    expect(resultado.consumoMateriaPrima).toBe(550)
    expect(resultado.custoProducaoPeriodo).toBe(900)
    expect(resultado.custoProducaoAcabada).toBe(900)
    expect(resultado.cpvReais).toBe(900)
    expect(resultado.cpvPercentual).toBe(50)
  })

  it('considera estoques de produtos em elaboração e acabados', () => {
    const resultado = calcularCPV({
      mpEstoqueInicial: 0,
      mpCompras: 1000,
      mpEstoqueFinal: 0,
      maoDeObraDireta: 0,
      custosIndiretosFabricacao: 0,
      peEstoqueInicial: 100,
      peEstoqueFinal: 200,
      paEstoqueInicial: 300,
      paEstoqueFinal: 100,
      receitaBruta: 2000,
    })
    // consumoMP=1000, CMP=1000, CPA = 100 + 1000 - 200 = 900, CPV = 300 + 900 - 100 = 1100
    expect(resultado.custoProducaoAcabada).toBe(900)
    expect(resultado.cpvReais).toBe(1100)
  })
})

describe('calcularCustoUnitarioPorConversao', () => {
  it('divide valor de compra pela quantidade', () => {
    expect(calcularCustoUnitarioPorConversao(200, 350)).toBeCloseTo(0.5714, 4)
  })

  it('retorna 0 quando quantidade é 0', () => {
    expect(calcularCustoUnitarioPorConversao(200, 0)).toBe(0)
  })
})

describe('calcularMarkup', () => {
  it('modo markup: preço = custo × índice', () => {
    const resultado = calcularMarkup({
      modo: 'markup',
      custoUnitario: 10,
      indiceMarkup: 2.5,
      margemLucro: 0,
    })
    expect(resultado.precoSugerido).toBe(25)
    expect(resultado.margemSobrePrecoPercentual).toBe(60)
  })

  it('modo margem: preço = custo ÷ (1 − margem%)', () => {
    const resultado = calcularMarkup({
      modo: 'margem',
      custoUnitario: 10,
      indiceMarkup: 0,
      margemLucro: 30,
    })
    expect(resultado.precoSugerido).toBeCloseTo(14.2857, 4)
    expect(resultado.margemSobrePrecoPercentual).toBe(30)
  })
})

describe('calcularPrecificacao', () => {
  it('composição soma 100% do preço', () => {
    const resultado = calcularPrecificacao({
      custo: 10,
      despesasFixas: 10,
      despesasVariaveis: 5,
      margemLucro: 15,
      taxaCanal: 0,
    })
    const somaPercentuais =
      resultado.composicao.custo.percentual +
      resultado.composicao.despesasFixas.percentual +
      resultado.composicao.despesasVariaveis.percentual +
      resultado.composicao.taxaCanal.percentual +
      resultado.composicao.margemLucro.percentual
    expect(somaPercentuais).toBeCloseTo(100, 6)
  })

  it('calcula margem de contribuição', () => {
    const resultado = calcularPrecificacao({
      custo: 10,
      despesasFixas: 10,
      despesasVariaveis: 5,
      margemLucro: 15,
      taxaCanal: 0,
    })
    // preço = 10 / (1 - 0.30) = 14.2857...
    expect(resultado.preco).toBeCloseTo(14.2857, 4)
    expect(resultado.margemContribuicaoReais).toBeCloseTo(resultado.preco - 10 - resultado.composicao.despesasVariaveis.reais, 6)
  })
})

describe('calcularPontoEquilibrio', () => {
  it('calcula PE em R$ e em unidades', () => {
    const resultado = calcularPontoEquilibrio({
      despesasFixasTotais: 4500,
      margemContribuicaoPercentual: 30,
      margemContribuicaoReaisPorUnidade: 25,
    })
    expect(resultado.pontoEquilibrioReais).toBe(15000)
    expect(resultado.pontoEquilibrioUnidades).toBe(180)
  })
})

describe('calcularModoReverso', () => {
  it('calcula margem de contribuição pro preço desejado', () => {
    const resultado = calcularModoReverso({
      precoDesejado: 100,
      custo: 40,
      despesasVariaveis: 10,
      taxaCanal: 5,
    })
    // custoVariavelTotal = 40 + 10 + 5 = 55, MC = 45 = 45%
    expect(resultado.margemContribuicaoReais).toBe(45)
    expect(resultado.margemContribuicaoPercentual).toBe(45)
  })
})

describe('calcularCustoMeta', () => {
  it('custo-meta = preço desejado − lucro desejado', () => {
    expect(calcularCustoMeta(100, 30)).toBe(70)
  })
})

describe('somarPercentuaisItens', () => {
  it('soma os percentuais de vários itens', () => {
    expect(somarPercentuaisItens([{ percentual: 8 }, { percentual: 7 }])).toBe(15)
  })

  it('retorna 0 pra lista vazia', () => {
    expect(somarPercentuaisItens([])).toBe(0)
  })

  it('funciona com um item só', () => {
    expect(somarPercentuaisItens([{ percentual: 12.5 }])).toBe(12.5)
  })
})
