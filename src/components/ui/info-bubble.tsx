import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface InfoBubbleProps {
  children: ReactNode
  label?: string
}

export function InfoBubble({ children, label = 'Mais informações' }: InfoBubbleProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="text-muted-foreground hover:text-foreground -m-1.5 inline-flex shrink-0 cursor-help items-center justify-center rounded-full p-1.5 align-middle"
        >
          <Info className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">{children}</PopoverContent>
    </Popover>
  )
}
