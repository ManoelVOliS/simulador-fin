import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import {
  calcularCustoMeta,
  calcularModoReverso,
  calcularPontoEquilibrio,
  calcularPrecificacao,
  formatarPercentual,
  formatarReais,
  toNumber,
  type PrecificacaoResultado,
} from '@/lib/calculos'
import { exportarCsv, exportarPdf, exportarXlsx, type LinhaExportacao } from '@/lib/exportar'

export interface PrecificacaoFormState {
  custo: string
  despesasFixas: string
  despesasVariaveis: string
  margemLucro: string
  taxaCanal: string
  precoDesejado: string
  despesasFixasTotais: string
  lucroDesejado: string
}

interface PrecificacaoBlocoProps {
  state: PrecificacaoFormState
  onChange: (state: PrecificacaoFormState) => void
  onEditCampoHerdado: () => void
}

const composicaoLabels = {
  custo: 'Custo',
  despesasFixas: 'Despesas Fixas',
  despesasVariaveis: 'Despesas Variáveis',
  taxaCanal: 'Taxa de canal',
  margemLucro: 'Margem de Lucro',
} as const

function Estatistica({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-semibold">{valor}</p>
    </div>
  )
}

function montarLinhasExportacao(
  state: PrecificacaoFormState,
  resultado: PrecificacaoResultado,
  modoReverso: ReturnType<typeof calcularModoReverso> | null,
  pontoEquilibrio: ReturnType<typeof calcularPontoEquilibrio> | null,
  custoMeta: number | null,
): LinhaExportacao[] {
  const linhas: LinhaExportacao[] = [
    { campo: 'Custo Unitário', valor: formatarReais(toNumber(state.custo)) },
    { campo: 'Despesas Fixas (%)', valor: formatarPercentual(toNumber(state.despesasFixas)) },
    { campo: 'Despesas Variáveis (%)', valor: formatarPercentual(toNumber(state.despesasVariaveis)) },
    { campo: 'Margem de Lucro (%)', valor: formatarPercentual(toNumber(state.margemLucro)) },
    { campo: 'Taxa de canal (%)', valor: formatarPercentual(toNumber(state.taxaCanal)) },
    { campo: 'Preço Final', valor: formatarReais(resultado.preco) },
    { campo: 'Lucro (R$)', valor: formatarReais(resultado.composicao.margemLucro.reais) },
    {
      campo: 'Índice de Markup',
      valor: resultado.indiceMarkup.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
    },
    {
      campo: 'Margem de Contribuição (%)',
      valor: formatarPercentual(resultado.margemContribuicaoPercentual),
    },
    {
      campo: 'Taxa de Custo (%)',
      valor: formatarPercentual(100 - resultado.composicao.margemLucro.percentual),
    },
  ]

  if (modoReverso) {
    linhas.push(
      { campo: 'Preço Desejado (modo reverso)', valor: formatarReais(toNumber(state.precoDesejado)) },
      {
        campo: 'Margem de Contribuição resultante (%)',
        valor: formatarPercentual(modoReverso.margemContribuicaoPercentual),
      },
    )
  }

  if (pontoEquilibrio) {
    linhas.push(
      { campo: 'Despesas Fixas Totais (R$)', valor: formatarReais(toNumber(state.despesasFixasTotais)) },
      { campo: 'Ponto de Equilíbrio (R$)', valor: formatarReais(pontoEquilibrio.pontoEquilibrioReais) },
      {
        campo: 'Ponto de Equilíbrio (unidades)',
        valor: pontoEquilibrio.pontoEquilibrioUnidades.toLocaleString('pt-BR', {
          maximumFractionDigits: 1,
        }),
      },
    )
  }

  if (custoMeta !== null) {
    linhas.push(
      { campo: 'Lucro Desejado (R$)', valor: formatarReais(toNumber(state.lucroDesejado)) },
      { campo: 'Custo-meta (R$)', valor: formatarReais(custoMeta) },
    )
  }

  return linhas
}

export function PrecificacaoBloco({ state, onChange, onEditCampoHerdado }: PrecificacaoBlocoProps) {
  const resultado = useMemo(
    () =>
      calcularPrecificacao({
        custo: toNumber(state.custo),
        despesasFixas: toNumber(state.despesasFixas),
        despesasVariaveis: toNumber(state.despesasVariaveis),
        margemLucro: toNumber(state.margemLucro),
        taxaCanal: toNumber(state.taxaCanal),
      }),
    [state],
  )

  const modoReverso = useMemo(() => {
    if (!state.precoDesejado) return null
    return calcularModoReverso({
      precoDesejado: toNumber(state.precoDesejado),
      custo: toNumber(state.custo),
      despesasVariaveis: toNumber(state.despesasVariaveis),
      taxaCanal: toNumber(state.taxaCanal),
    })
  }, [state.precoDesejado, state.custo, state.despesasVariaveis, state.taxaCanal])

  const pontoEquilibrio = useMemo(() => {
    if (!state.despesasFixasTotais) return null
    return calcularPontoEquilibrio({
      despesasFixasTotais: toNumber(state.despesasFixasTotais),
      margemContribuicaoPercentual: resultado.margemContribuicaoPercentual,
      margemContribuicaoReaisPorUnidade: resultado.margemContribuicaoReais,
    })
  }, [state.despesasFixasTotais, resultado.margemContribuicaoPercentual, resultado.margemContribuicaoReais])

  const custoMeta = useMemo(() => {
    if (!state.precoDesejado || !state.lucroDesejado) return null
    return calcularCustoMeta(toNumber(state.precoDesejado), toNumber(state.lucroDesejado))
  }, [state.precoDesejado, state.lucroDesejado])

  const linhasExportacao = useMemo(
    () => montarLinhasExportacao(state, resultado, modoReverso, pontoEquilibrio, custoMeta),
    [state, resultado, modoReverso, pontoEquilibrio, custoMeta],
  )

  const somaPercentuais =
    toNumber(state.despesasFixas) +
    toNumber(state.despesasVariaveis) +
    toNumber(state.margemLucro) +
    toNumber(state.taxaCanal)
  const percentuaisInvalidos = somaPercentuais >= 100

  function setCampoHerdado(field: 'custo' | 'margemLucro') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onEditCampoHerdado()
      onChange({ ...state, [field]: e.target.value })
    }
  }

  function setField(field: keyof PrecificacaoFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...state, [field]: e.target.value })
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Estatistica label="Preço Final" valor={formatarReais(resultado.preco)} />
            <Estatistica label="Custo" valor={formatarReais(toNumber(state.custo))} />
            <Estatistica label="Lucro (R$)" valor={formatarReais(resultado.composicao.margemLucro.reais)} />
            <Estatistica
              label="Margem sobre o preço"
              valor={formatarPercentual(resultado.composicao.margemLucro.percentual)}
            />
            <Estatistica
              label="Taxa de Custo"
              valor={formatarPercentual(100 - resultado.composicao.margemLucro.percentual)}
            />
            <Estatistica
              label="Índice de Markup"
              valor={resultado.indiceMarkup.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            />
            <Estatistica
              label="Margem de Contribuição"
              valor={formatarPercentual(resultado.margemContribuicaoPercentual)}
            />
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportarCsv(linhasExportacao, 'simulacao-precificacao.csv')}
            >
              Exportar CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportarXlsx(linhasExportacao, 'simulacao-precificacao.xlsx')}
            >
              Exportar XLSX
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                exportarPdf(linhasExportacao, 'simulacao-precificacao.pdf', 'Simulação de Precificação')
              }
            >
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Composição</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FloatingLabelInput
              id="precificacao-custo"
              label="Custo Unitário (R$) — herdado do Markup, editável"
              inputMode="decimal"
              value={state.custo}
              onChange={setCampoHerdado('custo')}
            />
            <FloatingLabelInput
              id="precificacao-df"
              label="Despesas Fixas — DF (%)"
              inputMode="decimal"
              value={state.despesasFixas}
              onChange={setField('despesasFixas')}
            />
            <FloatingLabelInput
              id="precificacao-dv"
              label="Despesas Variáveis — DV (%)"
              inputMode="decimal"
              value={state.despesasVariaveis}
              onChange={setField('despesasVariaveis')}
            />
            <FloatingLabelInput
              id="precificacao-ml"
              label="Margem de Lucro — ML (%) — herdada do Markup, editável"
              inputMode="decimal"
              value={state.margemLucro}
              onChange={setCampoHerdado('margemLucro')}
            />
            <FloatingLabelInput
              id="precificacao-taxa-canal"
              label="Taxa de canal de venda (%)"
              inputMode="decimal"
              value={state.taxaCanal}
              onChange={setField('taxaCanal')}
            />
            {percentuaisInvalidos && (
              <p className="text-destructive text-xs font-medium">
                Soma de DF + DV + ML + Taxa de canal está em {formatarPercentual(somaPercentuais)} —
                precisa ser menor que 100% pro preço fazer sentido.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composição do preço</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {(Object.keys(composicaoLabels) as (keyof typeof composicaoLabels)[]).map((key) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{composicaoLabels[key]}</span>
                <span>
                  {formatarReais(resultado.composicao[key].reais)} (
                  {formatarPercentual(resultado.composicao[key].percentual)})
                </span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
              <span>Preço final</span>
              <span>{formatarReais(resultado.preco)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modo reverso</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FloatingLabelInput
            id="precificacao-preco-desejado"
            label="Preço de venda desejado (R$)"
            inputMode="decimal"
            value={state.precoDesejado}
            onChange={setField('precoDesejado')}
          />
          {modoReverso && (
            <div>
              <p className="text-muted-foreground text-sm">Margem de Contribuição resultante</p>
              <p className="text-2xl font-semibold">
                {formatarPercentual(modoReverso.margemContribuicaoPercentual)} (
                {formatarReais(modoReverso.margemContribuicaoReais)})
              </p>
            </div>
          )}

          <FloatingLabelInput
            id="precificacao-lucro-desejado"
            label="Lucro desejado (R$) — opcional, pra calcular o Custo-meta"
            inputMode="decimal"
            value={state.lucroDesejado}
            onChange={setField('lucroDesejado')}
          />
          {custoMeta !== null && (
            <div>
              <p className="text-muted-foreground text-sm">
                Custo-meta — custo máximo pra manter esse lucro nesse preço
              </p>
              <p className="text-2xl font-semibold">{formatarReais(custoMeta)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ponto de Equilíbrio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FloatingLabelInput
            id="precificacao-despesas-fixas-totais"
            label="Despesas Fixas Totais (R$/mês) — opcional"
            inputMode="decimal"
            value={state.despesasFixasTotais}
            onChange={setField('despesasFixasTotais')}
          />
          <p className="text-muted-foreground text-xs">
            Valor absoluto (aluguel, salários etc.), diferente do DF% acima — esse é usado só pra
            calcular quanto precisa vender pra não ter prejuízo.
          </p>
          {pontoEquilibrio && (
            <div>
              <p className="text-muted-foreground text-sm">Quanto precisa vender pra zerar o prejuízo</p>
              <p className="text-2xl font-semibold">
                {formatarReais(pontoEquilibrio.pontoEquilibrioReais)} (
                {pontoEquilibrio.pontoEquilibrioUnidades.toLocaleString('pt-BR', {
                  maximumFractionDigits: 1,
                })}{' '}
                unidades)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
