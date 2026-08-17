import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { InfoBubble } from '@/components/ui/info-bubble'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import {
  calcularCustoUnitarioPorConversao,
  calcularMarkup,
  formatarPercentual,
  formatarReais,
  toNumber,
  type ModoMarkup,
} from '@/lib/calculos'
import { markupInicial } from '@/lib/estados-iniciais'
import { markupExemplo } from '@/lib/exemplos'

export type ModoCustoUnitario = 'direto' | 'conversao'

export interface MarkupFormState {
  modo: ModoMarkup
  custoUnitario: string
  indiceMarkup: string
  margemLucro: string
  custoUnitarioModo: ModoCustoUnitario
  valorCompra: string
  quantidadeComprada: string
  unidadeCompra: string
}

interface MarkupBlocoProps {
  state: MarkupFormState
  onChange: Dispatch<SetStateAction<MarkupFormState>>
}

export function MarkupBloco({ state, onChange }: MarkupBlocoProps) {
  const custoUnitarioConvertido = useMemo(
    () =>
      calcularCustoUnitarioPorConversao(
        toNumber(state.valorCompra),
        toNumber(state.quantidadeComprada),
      ),
    [state.valorCompra, state.quantidadeComprada],
  )

  useEffect(() => {
    if (state.custoUnitarioModo !== 'conversao') return
    const valorFormatado = custoUnitarioConvertido ? custoUnitarioConvertido.toFixed(2) : ''
    onChange((prev) =>
      prev.custoUnitario === valorFormatado ? prev : { ...prev, custoUnitario: valorFormatado },
    )
  }, [custoUnitarioConvertido, state.custoUnitarioModo, onChange])

  const resultado = useMemo(
    () =>
      calcularMarkup({
        modo: state.modo,
        custoUnitario: toNumber(state.custoUnitario),
        indiceMarkup: toNumber(state.indiceMarkup),
        margemLucro: toNumber(state.margemLucro),
      }),
    [state],
  )

  const margemInvalida = state.modo === 'margem' && toNumber(state.margemLucro) >= 100

  function setModo(modo: ModoMarkup) {
    onChange({ ...state, modo })
  }

  function setCustoUnitarioModo(custoUnitarioModo: ModoCustoUnitario) {
    onChange({ ...state, custoUnitarioModo })
  }

  function setField(field: keyof MarkupFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...state, [field]: e.target.value })
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Preço sugerido
            <InfoBubble label="Sobre a fórmula de markup">
              Aqui usamos "markup sobre preço de venda" (prática comum no Brasil — os percentuais são
              fatia do preço final, por isso 100 ÷ (100 − soma%)). É diferente do "markup sobre custo"
              de livros americanos como o Garrison, onde Preço = Custo × (1 + %) e o percentual
              multiplica direto o custo.
            </InfoBubble>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onChange(markupExemplo)}>
              Ver exemplo
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(markupInicial)}>
              Limpar
            </Button>
          </div>

          <SegmentedToggle
            ariaLabel="Como informar o custo unitário"
            value={state.custoUnitarioModo}
            onChange={setCustoUnitarioModo}
            options={[
              { value: 'direto', label: 'Digitar custo direto' },
              { value: 'conversao', label: 'Calcular por conversão' },
            ]}
          />

          {state.custoUnitarioModo === 'direto' ? (
            <FloatingLabelInput
              id="markup-custo-unitario"
              label="Custo Unitário"
              unidade="R$"
              inputMode="decimal"
              value={state.custoUnitario}
              onChange={setField('custoUnitario')}
            />
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FloatingLabelInput
                  id="markup-valor-compra"
                  label="Valor de Compra"
                  unidade="R$"
                  inputMode="decimal"
                  value={state.valorCompra}
                  onChange={setField('valorCompra')}
                />
                <FloatingLabelInput
                  id="markup-quantidade-comprada"
                  label="Quantidade Comprada"
                  inputMode="decimal"
                  value={state.quantidadeComprada}
                  onChange={setField('quantidadeComprada')}
                />
              </div>
              <FloatingLabelInput
                id="markup-unidade-compra"
                label="Unidade (opcional — ex.: g, ml, un)"
                value={state.unidadeCompra}
                onChange={setField('unidadeCompra')}
              />
              <p className="text-muted-foreground text-xs">
                Custo Unitário calculado: {formatarReais(custoUnitarioConvertido)}
                {state.unidadeCompra ? ` / ${state.unidadeCompra}` : ''}
              </p>
            </div>
          )}

          <SegmentedToggle
            ariaLabel="Modo de cálculo do preço"
            value={state.modo}
            onChange={setModo}
            options={[
              { value: 'markup', label: 'Por Markup' },
              { value: 'margem', label: 'Por Margem' },
            ]}
          />

          {state.modo === 'markup' ? (
            <FloatingLabelInput
              id="markup-indice"
              label="Índice de Markup (ex.: 2,5)"
              inputMode="decimal"
              value={state.indiceMarkup}
              onChange={setField('indiceMarkup')}
            />
          ) : (
            <FloatingLabelInput
              id="markup-margem"
              label="Margem de Lucro desejada — sobre o preço"
              unidade="%"
              inputMode="decimal"
              aria-invalid={margemInvalida}
              value={state.margemLucro}
              onChange={setField('margemLucro')}
            />
          )}

          {margemInvalida && (
            <p className="text-destructive text-xs font-medium">
              Margem inválida: precisa ser menor que 100% (senão o preço fica negativo ou infinito).
            </p>
          )}

          <p className="text-muted-foreground text-xs">
            {state.modo === 'markup'
              ? 'Preço Sugerido = Custo Unitário × Índice de Markup.'
              : 'Preço Sugerido = Custo Unitário ÷ (1 − Margem%). A margem é sobre o preço de venda, não sobre o custo.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Preço Sugerido</p>
            <p className="text-2xl font-semibold">{formatarReais(resultado.precoSugerido)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                Índice de Markup
                <InfoBubble label="O que é o Índice de Markup">
                  Multiplicador aplicado sobre o custo unitário pra chegar no preço de venda. Índice
                  2,5 significa que o preço é 2,5× o custo.
                </InfoBubble>
              </p>
              <p className="text-lg font-medium">
                {resultado.indiceMarkup.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Margem de Lucro</p>
              <p className="text-lg font-medium">
                {formatarPercentual(resultado.margemSobrePrecoPercentual)}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Os dois indicadores são mostrados sempre, independente do modo escolhido — markup e margem
            respondem perguntas diferentes e não são o mesmo número.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
