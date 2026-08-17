import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExportMenu } from '@/components/ui/export-menu'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { InfoBubble } from '@/components/ui/info-bubble'
import { CampoComItens, type ItemFormState, type ModoCampoComItens } from '@/components/precificacao/CampoComItens'
import {
  calcularCustoMeta,
  calcularModoReverso,
  calcularPontoEquilibrio,
  calcularPrecificacao,
  formatarPercentual,
  formatarReais,
  somarPercentuaisItens,
  toNumber,
  type PrecificacaoResultado,
} from '@/lib/calculos'
import { precificacaoInicial } from '@/lib/estados-iniciais'
import { precificacaoExemplo } from '@/lib/exemplos'
import type { LinhaExportacao } from '@/lib/exportar'

export interface PrecificacaoFormState {
  custo: string
  despesasFixas: string
  despesasFixasModo: ModoCampoComItens
  despesasFixasItens: ItemFormState[]
  despesasVariaveis: string
  despesasVariaveisModo: ModoCampoComItens
  despesasVariaveisItens: ItemFormState[]
  margemLucro: string
  taxaCanal: string
  precoDesejado: string
  despesasFixasTotais: string
  lucroDesejado: string
}

function totalDoModo(modo: ModoCampoComItens, valorDireto: string, itens: ItemFormState[]): number {
  return modo === 'itens'
    ? somarPercentuaisItens(itens.map((item) => ({ percentual: toNumber(item.percentual) })))
    : toNumber(valorDireto)
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

function Estatistica({ label, valor, info }: { label: string; valor: string; info?: ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        {label}
        {info && <InfoBubble label={`O que é ${label}`}>{info}</InfoBubble>}
      </p>
      <p className="text-lg font-semibold">{valor}</p>
    </div>
  )
}

function CampoComInfo({ children, info, label }: { children: ReactNode; info: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">{children}</div>
      <InfoBubble label={`O que é ${label}`}>{info}</InfoBubble>
    </div>
  )
}

function montarLinhasExportacao(
  state: PrecificacaoFormState,
  resultado: PrecificacaoResultado,
  modoReverso: ReturnType<typeof calcularModoReverso> | null,
  pontoEquilibrio: ReturnType<typeof calcularPontoEquilibrio> | null,
  custoMeta: number | null,
  despesasFixasTotal: number,
  despesasVariaveisTotal: number,
): LinhaExportacao[] {
  const linhas: LinhaExportacao[] = [{ campo: 'Custo Unitário', valor: formatarReais(toNumber(state.custo)) }]

  if (state.despesasFixasModo === 'itens') {
    state.despesasFixasItens.forEach((item) => {
      linhas.push({
        campo: `Despesas Fixas — ${item.nome || 'item'} (%)`,
        valor: formatarPercentual(toNumber(item.percentual)),
      })
    })
  }
  linhas.push({ campo: 'Despesas Fixas — Total (%)', valor: formatarPercentual(despesasFixasTotal) })

  if (state.despesasVariaveisModo === 'itens') {
    state.despesasVariaveisItens.forEach((item) => {
      linhas.push({
        campo: `Despesas Variáveis — ${item.nome || 'item'} (%)`,
        valor: formatarPercentual(toNumber(item.percentual)),
      })
    })
  }
  linhas.push(
    { campo: 'Despesas Variáveis — Total (%)', valor: formatarPercentual(despesasVariaveisTotal) },
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
  )

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
  const despesasFixasTotal = totalDoModo(state.despesasFixasModo, state.despesasFixas, state.despesasFixasItens)
  const despesasVariaveisTotal = totalDoModo(
    state.despesasVariaveisModo,
    state.despesasVariaveis,
    state.despesasVariaveisItens,
  )

  const resultado = useMemo(
    () =>
      calcularPrecificacao({
        custo: toNumber(state.custo),
        despesasFixas: despesasFixasTotal,
        despesasVariaveis: despesasVariaveisTotal,
        margemLucro: toNumber(state.margemLucro),
        taxaCanal: toNumber(state.taxaCanal),
      }),
    [state.custo, despesasFixasTotal, despesasVariaveisTotal, state.margemLucro, state.taxaCanal],
  )

  const modoReverso = useMemo(() => {
    if (!state.precoDesejado) return null
    return calcularModoReverso({
      precoDesejado: toNumber(state.precoDesejado),
      custo: toNumber(state.custo),
      despesasVariaveis: despesasVariaveisTotal,
      taxaCanal: toNumber(state.taxaCanal),
    })
  }, [state.precoDesejado, state.custo, despesasVariaveisTotal, state.taxaCanal])

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
    () =>
      montarLinhasExportacao(
        state,
        resultado,
        modoReverso,
        pontoEquilibrio,
        custoMeta,
        despesasFixasTotal,
        despesasVariaveisTotal,
      ),
    [state, resultado, modoReverso, pontoEquilibrio, custoMeta, despesasFixasTotal, despesasVariaveisTotal],
  )

  const somaPercentuais =
    despesasFixasTotal + despesasVariaveisTotal + toNumber(state.margemLucro) + toNumber(state.taxaCanal)
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
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(precificacaoExemplo)}>
          Ver exemplo
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(precificacaoInicial)}>
          Limpar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Composição</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <CampoComInfo label="Custo Unitário" info="Vem do bloco Markup automaticamente — pode editar aqui se quiser.">
              <FloatingLabelInput
                id="precificacao-custo"
                label="Custo Unitário"
                unidade="R$"
                inputMode="decimal"
                value={state.custo}
                onChange={setCampoHerdado('custo')}
              />
            </CampoComInfo>
            <CampoComItens
              idPrefix="precificacao-df"
              label="Despesas Fixas — DF"
              info="Custos que não mudam com o volume de vendas (aluguel, salários fixos etc.), como % do preço de venda — não confundir com o valor absoluto usado no Ponto de Equilíbrio, mais abaixo."
              modo={state.despesasFixasModo}
              onModoChange={(despesasFixasModo) => onChange({ ...state, despesasFixasModo })}
              valorDireto={state.despesasFixas}
              onValorDiretoChange={(despesasFixas) => onChange({ ...state, despesasFixas })}
              itens={state.despesasFixasItens}
              onItensChange={(despesasFixasItens) => onChange({ ...state, despesasFixasItens })}
              invalido={percentuaisInvalidos}
            />
            <CampoComItens
              idPrefix="precificacao-dv"
              label="Despesas Variáveis — DV"
              info="Custos que variam junto com a venda (comissão, embalagem, impostos sobre venda etc.), como % do preço."
              modo={state.despesasVariaveisModo}
              onModoChange={(despesasVariaveisModo) => onChange({ ...state, despesasVariaveisModo })}
              valorDireto={state.despesasVariaveis}
              onValorDiretoChange={(despesasVariaveis) => onChange({ ...state, despesasVariaveis })}
              itens={state.despesasVariaveisItens}
              onItensChange={(despesasVariaveisItens) => onChange({ ...state, despesasVariaveisItens })}
              invalido={percentuaisInvalidos}
            />
            <CampoComInfo
              label="Margem de Lucro"
              info="Quanto de lucro você quer que sobre, como % do preço de venda final (não do custo). Vem do bloco Markup automaticamente — pode editar aqui se quiser."
            >
              <FloatingLabelInput
                id="precificacao-ml"
                label="Margem de Lucro — ML"
                unidade="%"
                inputMode="decimal"
                aria-invalid={percentuaisInvalidos}
                value={state.margemLucro}
                onChange={setCampoHerdado('margemLucro')}
              />
            </CampoComInfo>
            <CampoComInfo
              label="Taxa de canal"
              info="Comissão ou taxa cobrada por onde você vende (marketplace, maquininha de cartão etc.), como % do preço."
            >
              <FloatingLabelInput
                id="precificacao-taxa-canal"
                label="Taxa de canal de venda"
                unidade="%"
                inputMode="decimal"
                aria-invalid={percentuaisInvalidos}
                value={state.taxaCanal}
                onChange={setField('taxaCanal')}
              />
            </CampoComInfo>
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
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Estatistica label="Preço Final" valor={formatarReais(resultado.preco)} />
            <Estatistica label="Custo" valor={formatarReais(toNumber(state.custo))} />
            <Estatistica label="Lucro (R$)" valor={formatarReais(resultado.composicao.margemLucro.reais)} />
            <Estatistica
              label="Margem de Lucro"
              valor={formatarPercentual(resultado.composicao.margemLucro.percentual)}
            />
            <Estatistica
              label="Taxa de Custo"
              valor={formatarPercentual(100 - resultado.composicao.margemLucro.percentual)}
              info="100% − Margem de Lucro. É a fatia do preço que vai pra custo, despesas e taxas, sobrando só o lucro."
            />
            <Estatistica
              label="Índice de Markup"
              valor={resultado.indiceMarkup.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            />
            <Estatistica
              label="Margem de Contribuição"
              valor={formatarPercentual(resultado.margemContribuicaoPercentual)}
              info="(Preço − Custo Variável Total) ÷ Preço. É o que sobra da venda pra pagar despesas fixas e gerar lucro — não confundir com o Índice de Markup, que é só o multiplicador sobre o custo."
            />
          </div>
          <div className="border-t pt-4">
            <ExportMenu
              linhas={linhasExportacao}
              nomeBase="simulacao-precificacao"
              titulo="Simulação de Precificação"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Accordion type="multiple">
            <AccordionItem value="modo-reverso">
              <AccordionTrigger>
                <span className="flex items-center gap-1.5">
                  Modo reverso
                  <InfoBubble label="Como funciona o modo reverso">
                    Em vez de partir do custo pra achar o preço, você informa o preço que o mercado
                    aceita e o sistema devolve a margem de contribuição resultante — útil pra checar se
                    um preço já praticado faz sentido.
                  </InfoBubble>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4">
                  <FloatingLabelInput
                    id="precificacao-preco-desejado"
                    label="Preço de venda desejado"
                    unidade="R$"
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
                    label="Lucro desejado — opcional, pra calcular o Custo-meta"
                    unidade="R$"
                    inputMode="decimal"
                    value={state.lucroDesejado}
                    onChange={setField('lucroDesejado')}
                  />
                  {custoMeta !== null && (
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1 text-sm">
                        Custo-meta — custo máximo pra manter esse lucro nesse preço
                        <InfoBubble label="O que é Custo-meta">
                          Custo-meta = Preço de venda − Lucro desejado. Em vez de calcular o preço a
                          partir do custo (cost-plus), parte do preço que o mercado aceita pra achar o
                          custo máximo que ainda permite o lucro que você quer (target costing).
                        </InfoBubble>
                      </p>
                      <p className="text-2xl font-semibold">{formatarReais(custoMeta)}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ponto-equilibrio">
              <AccordionTrigger>
                <span className="flex items-center gap-1.5">
                  Ponto de Equilíbrio
                  <InfoBubble label="O que é Ponto de Equilíbrio">
                    Quanto você precisa vender (em R$ ou em unidades) pra cobrir exatamente as despesas
                    fixas totais — abaixo disso dá prejuízo, acima começa o lucro.
                  </InfoBubble>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4">
                  <FloatingLabelInput
                    id="precificacao-despesas-fixas-totais"
                    label="Despesas Fixas Totais (por mês) — opcional"
                    unidade="R$"
                    inputMode="decimal"
                    value={state.despesasFixasTotais}
                    onChange={setField('despesasFixasTotais')}
                  />
                  <p className="text-muted-foreground text-xs">
                    Valor absoluto (aluguel, salários etc.), diferente do DF% acima — esse é usado só
                    pra calcular quanto precisa vender pra não ter prejuízo.
                  </p>
                  {pontoEquilibrio && (
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Quanto precisa vender pra zerar o prejuízo
                      </p>
                      <p className="text-2xl font-semibold">
                        {formatarReais(pontoEquilibrio.pontoEquilibrioReais)} (
                        {pontoEquilibrio.pontoEquilibrioUnidades.toLocaleString('pt-BR', {
                          maximumFractionDigits: 1,
                        })}{' '}
                        unidades)
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
