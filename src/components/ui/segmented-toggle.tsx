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
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
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
