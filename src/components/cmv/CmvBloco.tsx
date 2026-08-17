import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { InfoBubble } from '@/components/ui/info-bubble'
import { ProgressWithValue } from '@/components/ui/progress-with-value'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import {
  calcularCMV,
  calcularCPV,
  formatarPercentual,
  formatarReais,
  toNumber,
  type CmvResultado,
  type CpvResultado,
  type ModoCmv,
  type StatusCmv,
} from '@/lib/calculos'
import { exportarCsv, exportarPdf, exportarXlsx, type LinhaExportacao } from '@/lib/exportar'

export interface CmvFormState {
  modo: ModoCmv
  estoqueInicial: string
  compras: string
  estoqueFinal: string
  receitaBruta: string
  cmvIdeal: string
  mpEstoqueInicial: string
  mpCompras: string
  mpEstoqueFinal: string
  maoDeObraDireta: string
  custosIndiretosFabricacao: string
  peEstoqueInicial: string
  peEstoqueFinal: string
  paEstoqueInicial: string
  paEstoqueFinal: string
}

interface CmvBlocoProps {
  state: CmvFormState
  onChange: (state: CmvFormState) => void
}

const statusLabel: Record<NonNullable<StatusCmv>, string> = {
  acima: 'acima da meta',
  dentro: 'dentro da meta',
  abaixo: 'abaixo da meta',
}

const statusClasses: Record<NonNullable<StatusCmv>, string> = {
  acima: 'text-destructive',
  dentro: 'text-primary',
  abaixo: 'text-muted-foreground',
}

function montarLinhasExportacaoCmv(
  state: CmvFormState,
  resultadoRevenda: CmvResultado,
  resultadoProducao: CpvResultado,
): LinhaExportacao[] {
  const linhas: LinhaExportacao[] =
    state.modo === 'revenda'
      ? [
          { campo: 'Estoque Inicial (R$)', valor: formatarReais(toNumber(state.estoqueInicial)) },
          { campo: 'Compras (R$)', valor: formatarReais(toNumber(state.compras)) },
          { campo: 'Estoque Final (R$)', valor: formatarReais(toNumber(state.estoqueFinal)) },
          { campo: 'CMV (R$)', valor: formatarReais(resultadoRevenda.cmvReais) },
          { campo: 'CMV (%)', valor: formatarPercentual(resultadoRevenda.cmvPercentual) },
        ]
      : [
          {
            campo: 'Estoque Inicial de Matéria-Prima (R$)',
            valor: formatarReais(toNumber(state.mpEstoqueInicial)),
          },
          { campo: 'Compras de Matéria-Prima (R$)', valor: formatarReais(toNumber(state.mpCompras)) },
          {
            campo: 'Estoque Final de Matéria-Prima (R$)',
            valor: formatarReais(toNumber(state.mpEstoqueFinal)),
          },
          { campo: 'Mão de Obra Direta (R$)', valor: formatarReais(toNumber(state.maoDeObraDireta)) },
          {
            campo: 'Custos Indiretos de Fabricação (R$)',
            valor: formatarReais(toNumber(state.custosIndiretosFabricacao)),
          },
          {
            campo: 'Produtos em Elaboração — Inicial (R$)',
            valor: formatarReais(toNumber(state.peEstoqueInicial)),
          },
          {
            campo: 'Produtos em Elaboração — Final (R$)',
            valor: formatarReais(toNumber(state.peEstoqueFinal)),
          },
          {
            campo: 'Estoque Inicial de Produtos Acabados (R$)',
            valor: formatarReais(toNumber(state.paEstoqueInicial)),
          },
          {
            campo: 'Estoque Final de Produtos Acabados (R$)',
            valor: formatarReais(toNumber(state.paEstoqueFinal)),
          },
          { campo: 'Consumo de Matéria-Prima (R$)', valor: formatarReais(resultadoProducao.consumoMateriaPrima) },
          {
            campo: 'Custo de Produção do Período (R$)',
            valor: formatarReais(resultadoProducao.custoProducaoPeriodo),
          },
          {
            campo: 'Custo de Produção Acabada (R$)',
            valor: formatarReais(resultadoProducao.custoProducaoAcabada),
          },
          { campo: 'CPV (R$)', valor: formatarReais(resultadoProducao.cpvReais) },
          { campo: 'CPV (%)', valor: formatarPercentual(resultadoProducao.cpvPercentual) },
        ]

  linhas.push({ campo: 'Receita Bruta (R$)', valor: formatarReais(toNumber(state.receitaBruta)) })

  if (state.cmvIdeal) {
    linhas.push({
      campo: state.modo === 'revenda' ? 'CMV ideal (%)' : 'CPV ideal (%)',
      valor: formatarPercentual(toNumber(state.cmvIdeal)),
    })
  }

  return linhas
}

export function CmvBloco({ state, onChange }: CmvBlocoProps) {
  const resultadoRevenda = useMemo(
    () =>
      calcularCMV({
        estoqueInicial: toNumber(state.estoqueInicial),
        compras: toNumber(state.compras),
        estoqueFinal: toNumber(state.estoqueFinal),
        receitaBruta: toNumber(state.receitaBruta),
        cmvIdeal: state.cmvIdeal ? toNumber(state.cmvIdeal) : undefined,
      }),
    [state],
  )

  const resultadoProducao = useMemo(
    () =>
      calcularCPV({
        mpEstoqueInicial: toNumber(state.mpEstoqueInicial),
        mpCompras: toNumber(state.mpCompras),
        mpEstoqueFinal: toNumber(state.mpEstoqueFinal),
        maoDeObraDireta: toNumber(state.maoDeObraDireta),
        custosIndiretosFabricacao: toNumber(state.custosIndiretosFabricacao),
        peEstoqueInicial: toNumber(state.peEstoqueInicial),
        peEstoqueFinal: toNumber(state.peEstoqueFinal),
        paEstoqueInicial: toNumber(state.paEstoqueInicial),
        paEstoqueFinal: toNumber(state.paEstoqueFinal),
        receitaBruta: toNumber(state.receitaBruta),
        cmvIdeal: state.cmvIdeal ? toNumber(state.cmvIdeal) : undefined,
      }),
    [state],
  )

  const custoReais = state.modo === 'revenda' ? resultadoRevenda.cmvReais : resultadoProducao.cpvReais
  const custoPercentual =
    state.modo === 'revenda' ? resultadoRevenda.cmvPercentual : resultadoProducao.cpvPercentual
  const statusVsIdeal =
    state.modo === 'revenda' ? resultadoRevenda.statusVsIdeal : resultadoProducao.statusVsIdeal
  const rotulo = state.modo === 'revenda' ? 'CMV' : 'CPV'

  const linhasExportacao = useMemo(
    () => montarLinhasExportacaoCmv(state, resultadoRevenda, resultadoProducao),
    [state, resultadoRevenda, resultadoProducao],
  )

  function setModo(modo: ModoCmv) {
    onChange({ ...state, modo })
  }

  function setField(field: keyof CmvFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...state, [field]: e.target.value })
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dados do período</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SegmentedToggle
            ariaLabel="Tipo de negócio"
            value={state.modo}
            onChange={setModo}
            options={[
              { value: 'revenda', label: 'Revenda' },
              { value: 'producao', label: 'Produção' },
            ]}
          />

          {state.modo === 'revenda' ? (
            <>
              <FloatingLabelInput
                id="cmv-estoque-inicial"
                label="Estoque Inicial (R$)"
                inputMode="decimal"
                value={state.estoqueInicial}
                onChange={setField('estoqueInicial')}
              />
              <FloatingLabelInput
                id="cmv-compras"
                label="Compras (R$)"
                inputMode="decimal"
                value={state.compras}
                onChange={setField('compras')}
              />
              <FloatingLabelInput
                id="cmv-estoque-final"
                label="Estoque Final (R$)"
                inputMode="decimal"
                value={state.estoqueFinal}
                onChange={setField('estoqueFinal')}
              />
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-xs font-medium">Matéria-Prima</p>
              <FloatingLabelInput
                id="cmv-mp-estoque-inicial"
                label="Estoque Inicial de Matéria-Prima (R$)"
                inputMode="decimal"
                value={state.mpEstoqueInicial}
                onChange={setField('mpEstoqueInicial')}
              />
              <FloatingLabelInput
                id="cmv-mp-compras"
                label="Compras de Matéria-Prima (R$)"
                inputMode="decimal"
                value={state.mpCompras}
                onChange={setField('mpCompras')}
              />
              <FloatingLabelInput
                id="cmv-mp-estoque-final"
                label="Estoque Final de Matéria-Prima (R$)"
                inputMode="decimal"
                value={state.mpEstoqueFinal}
                onChange={setField('mpEstoqueFinal')}
              />

              <p className="text-muted-foreground mt-2 text-xs font-medium">Produção</p>
              <FloatingLabelInput
                id="cmv-mao-de-obra"
                label="Mão de Obra Direta (R$)"
                inputMode="decimal"
                value={state.maoDeObraDireta}
                onChange={setField('maoDeObraDireta')}
              />
              <FloatingLabelInput
                id="cmv-cif"
                label="Custos Indiretos de Fabricação (R$)"
                inputMode="decimal"
                value={state.custosIndiretosFabricacao}
                onChange={setField('custosIndiretosFabricacao')}
              />
              <FloatingLabelInput
                id="cmv-pe-estoque-inicial"
                label="Produtos em Elaboração — Inicial (R$) — opcional"
                inputMode="decimal"
                value={state.peEstoqueInicial}
                onChange={setField('peEstoqueInicial')}
              />
              <FloatingLabelInput
                id="cmv-pe-estoque-final"
                label="Produtos em Elaboração — Final (R$) — opcional"
                inputMode="decimal"
                value={state.peEstoqueFinal}
                onChange={setField('peEstoqueFinal')}
              />

              <p className="text-muted-foreground mt-2 text-xs font-medium">Produtos Acabados</p>
              <FloatingLabelInput
                id="cmv-pa-estoque-inicial"
                label="Estoque Inicial de Produtos Acabados (R$)"
                inputMode="decimal"
                value={state.paEstoqueInicial}
                onChange={setField('paEstoqueInicial')}
              />
              <FloatingLabelInput
                id="cmv-pa-estoque-final"
                label="Estoque Final de Produtos Acabados (R$)"
                inputMode="decimal"
                value={state.paEstoqueFinal}
                onChange={setField('paEstoqueFinal')}
              />
            </>
          )}

          <FloatingLabelInput
            id="cmv-receita-bruta"
            label="Receita Bruta (R$)"
            inputMode="decimal"
            value={state.receitaBruta}
            onChange={setField('receitaBruta')}
          />
          <FloatingLabelInput
            id="cmv-ideal"
            label={`${rotulo} ideal (%) — opcional`}
            inputMode="decimal"
            value={state.cmvIdeal}
            onChange={setField('cmvIdeal')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {state.modo === 'producao' && (
            <div className="grid gap-2 border-b pb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Consumo de Matéria-Prima</span>
                <span>{formatarReais(resultadoProducao.consumoMateriaPrima)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Custo de Produção do Período</span>
                <span>{formatarReais(resultadoProducao.custoProducaoPeriodo)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Custo de Produção Acabada</span>
                <span>{formatarReais(resultadoProducao.custoProducaoAcabada)}</span>
              </div>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-sm">{rotulo} em R$</p>
            <p className="text-2xl font-semibold">{formatarReais(custoReais)}</p>
          </div>
          <div>
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              {rotulo} em %
              <InfoBubble label={`O que é ${rotulo}%`}>
                {rotulo} dividido pela Receita Bruta, em %. Mostra quanto da sua receita foi consumido
                pelo custo — quanto menor, mais sobra de margem antes das outras despesas.
              </InfoBubble>
            </p>
            <p className="text-2xl font-semibold">{formatarPercentual(custoPercentual)}</p>
          </div>
          <ProgressWithValue
            value={Math.min(100, Math.max(0, custoPercentual))}
            label={() => formatarPercentual(custoPercentual)}
          />
          {statusVsIdeal && (
            <p className={`text-sm font-medium ${statusClasses[statusVsIdeal]}`}>
              {rotulo} {statusLabel[statusVsIdeal]} ({formatarPercentual(toNumber(state.cmvIdeal))})
            </p>
          )}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportarCsv(linhasExportacao, 'simulacao-cmv.csv')}
            >
              Exportar CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportarXlsx(linhasExportacao, 'simulacao-cmv.xlsx')}
            >
              Exportar XLSX
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportarPdf(linhasExportacao, 'simulacao-cmv.pdf', `Simulação de ${rotulo}`)}
            >
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
