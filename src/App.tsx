import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CmvBloco } from '@/components/cmv/CmvBloco'
import { MarkupBloco } from '@/components/markup/MarkupBloco'
import { PrecificacaoBloco } from '@/components/precificacao/PrecificacaoBloco'
import { calcularMarkup, toNumber } from '@/lib/calculos'
import { cmvInicial, markupInicial, precificacaoInicial } from '@/lib/estados-iniciais'

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
        <p className="text-muted-foreground mt-1 text-xs">
          Nada aqui é salvo — atualizar a página reseta os campos.
        </p>
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
