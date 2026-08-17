import { Plus, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { InfoBubble } from '@/components/ui/info-bubble'
import { SegmentedToggle } from '@/components/ui/segmented-toggle'
import { formatarPercentual, somarPercentuaisItens, toNumber } from '@/lib/calculos'

export interface ItemFormState {
  id: string
  nome: string
  percentual: string
}

export type ModoCampoComItens = 'direto' | 'itens'

interface CampoComItensProps {
  idPrefix: string
  label: string
  info: ReactNode
  modo: ModoCampoComItens
  onModoChange: (modo: ModoCampoComItens) => void
  valorDireto: string
  onValorDiretoChange: (valor: string) => void
  itens: ItemFormState[]
  onItensChange: (itens: ItemFormState[]) => void
  invalido?: boolean
}

export function CampoComItens({
  idPrefix,
  label,
  info,
  modo,
  onModoChange,
  valorDireto,
  onValorDiretoChange,
  itens,
  onItensChange,
  invalido,
}: CampoComItensProps) {
  const total = somarPercentuaisItens(itens.map((item) => ({ percentual: toNumber(item.percentual) })))

  function adicionarItem() {
    onItensChange([...itens, { id: crypto.randomUUID(), nome: '', percentual: '' }])
  }

  function removerItem(id: string) {
    onItensChange(itens.filter((item) => item.id !== id))
  }

  function atualizarItem(id: string, campo: 'nome' | 'percentual', valor: string) {
    onItensChange(itens.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)))
  }

  function setModo(novoModo: ModoCampoComItens) {
    if (novoModo === 'itens' && itens.length === 0) {
      onItensChange([{ id: crypto.randomUUID(), nome: '', percentual: '' }])
    }
    onModoChange(novoModo)
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-1">
        <p className="text-sm font-medium">{label}</p>
        <InfoBubble label={`O que é ${label}`}>{info}</InfoBubble>
      </div>

      <SegmentedToggle
        ariaLabel={`Como informar ${label}`}
        value={modo}
        onChange={setModo}
        options={[
          { value: 'direto', label: 'Total direto' },
          { value: 'itens', label: 'Detalhar por item' },
        ]}
      />

      {modo === 'direto' ? (
        <FloatingLabelInput
          id={`${idPrefix}-direto`}
          label={label}
          unidade="%"
          inputMode="decimal"
          aria-invalid={invalido}
          value={valorDireto}
          onChange={(e) => onValorDiretoChange(e.target.value)}
        />
      ) : (
        <div className="grid gap-2">
          {itens.map((item, indice) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex-1">
                <FloatingLabelInput
                  id={`${idPrefix}-item-${indice}-nome`}
                  label="Nome (ex.: Aluguel)"
                  value={item.nome}
                  onChange={(e) => atualizarItem(item.id, 'nome', e.target.value)}
                />
              </div>
              <div className="w-24 shrink-0">
                <FloatingLabelInput
                  id={`${idPrefix}-item-${indice}-percentual`}
                  label="%"
                  unidade="%"
                  inputMode="decimal"
                  value={item.percentual}
                  onChange={(e) => atualizarItem(item.id, 'percentual', e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remover ${item.nome || 'item'}`}
                onClick={() => removerItem(item.id)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
              <Plus className="size-3.5" />
              Adicionar item
            </Button>
            <p className={`text-sm font-medium ${invalido ? 'text-destructive' : ''}`}>
              Total: {formatarPercentual(total)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
