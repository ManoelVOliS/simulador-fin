import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CmvBloco, type CmvFormState } from '@/components/cmv/CmvBloco'
import { MarkupBloco, type MarkupFormState } from '@/components/markup/MarkupBloco'
import {
  PrecificacaoBloco,
  type PrecificacaoFormState,
} from '@/components/precificacao/PrecificacaoBloco'
import { calcularMarkup, toNumber } from '@/lib/calculos'

const cmvInicial: CmvFormState = {
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

const markupInicial: MarkupFormState = {
  modo: 'markup',
  custoUnitario: '',
  indiceMarkup: '',
  margemLucro: '',
  custoUnitarioModo: 'direto',
  valorCompra: '',
  quantidadeComprada: '',
  unidadeCompra: '',
}

const precificacaoInicial: PrecificacaoFormState = {
  custo: '',
  despesasFixas: '',
  despesasVariaveis: '',
  margemLucro: '',
  taxaCanal: '',
  precoDesejado: '',
  despesasFixasTotais: '',
  lucroDesejado: '',
}

function App() {
  const [cmv, setCmv] = useState(cmvInicial)
  const [markup, setMarkup] = useState(markupInicial)
  const [precificacao, setPrecificacao] = useState(precificacaoInicial)
  const [precificacaoManual, setPrecificacaoManual] = useState(false)

  const markupResultado = useMemo(
    () =>
      calcularMarkup({
        modo: markup.modo,
        custoUnitario: toNumber(markup.custoUnitario),
        indiceMarkup: toNumber(markup.indiceMarkup),
        margemLucro: toNumber(markup.margemLucro),
      }),
    [markup],
  )

  useEffect(() => {
    if (precificacaoManual) return
    setPrecificacao((prev) => ({
      ...prev,
      custo: markup.custoUnitario,
      margemLucro: markup.custoUnitario
        ? markupResultado.margemSobrePrecoPercentual.toFixed(2)
        : prev.margemLucro,
    }))
  }, [markup.custoUnitario, markupResultado, precificacaoManual])

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Simulador Financeiro</h1>
        <p className="text-muted-foreground text-sm">CMV e Precificação — cálculo em tempo real.</p>
      </header>

      <Tabs defaultValue="cmv">
        <TabsList>
          <TabsTrigger value="cmv">CMV</TabsTrigger>
          <TabsTrigger value="precificacao">Precificação</TabsTrigger>
        </TabsList>

        <TabsContent value="cmv">
          <CmvBloco state={cmv} onChange={setCmv} />
        </TabsContent>

        <TabsContent value="precificacao" className="grid gap-6">
          <section className="grid gap-2">
            <h2 className="text-lg font-medium">1. Gerar preço sugerido</h2>
            <MarkupBloco state={markup} onChange={setMarkup} />
          </section>

          <section className="grid gap-2">
            <h2 className="text-lg font-medium">2. Composição e margem</h2>
            <PrecificacaoBloco
              state={precificacao}
              onChange={setPrecificacao}
              onEditCampoHerdado={() => setPrecificacaoManual(true)}
            />
          </section>
        </TabsContent>
      </Tabs>
    </main>
  )
}

export default App
