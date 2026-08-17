import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface SegmentedToggleProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  ariaLabel: string
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedToggleProps<T>) {
  const botoesRef = useRef<(HTMLButtonElement | null)[]>([])

  function moverFoco(indiceAtual: number, direcao: 1 | -1) {
    const proximoIndice = (indiceAtual + direcao + options.length) % options.length
    const opcao = options[proximoIndice]
    onChange(opcao.value)
    botoesRef.current[proximoIndice]?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      moverFoco(indice, 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      moverFoco(indice, -1)
    }
  }

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option, indice) => (
        <button
          key={option.value}
          ref={(el) => {
            botoesRef.current[indice] = el
          }}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(e) => onKeyDown(e, indice)}
          className={cn(
            'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
            value === option.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
