import { ChevronDown, Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportarCsv, exportarPdf, exportarXlsx, type LinhaExportacao } from '@/lib/exportar'

type Formato = 'csv' | 'xlsx' | 'pdf'

interface ExportMenuProps {
  linhas: LinhaExportacao[]
  nomeBase: string
  titulo: string
}

const rotulos: Record<Formato, string> = {
  csv: 'CSV',
  xlsx: 'XLSX',
  pdf: 'PDF',
}

export function ExportMenu({ linhas, nomeBase, titulo }: ExportMenuProps) {
  const [formatoCarregando, setFormatoCarregando] = useState<Formato | null>(null)

  async function exportar(formato: Formato) {
    setFormatoCarregando(formato)
    try {
      if (formato === 'csv') exportarCsv(linhas, `${nomeBase}.csv`)
      else if (formato === 'xlsx') await exportarXlsx(linhas, `${nomeBase}.xlsx`)
      else await exportarPdf(linhas, `${nomeBase}.pdf`, titulo)
    } finally {
      setFormatoCarregando(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Download className="size-3.5" />
          Exportar
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {(Object.keys(rotulos) as Formato[]).map((formato) => (
          <DropdownMenuItem
            key={formato}
            disabled={formatoCarregando !== null}
            onSelect={(e) => {
              e.preventDefault()
              void exportar(formato)
            }}
          >
            {formatoCarregando === formato ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {formatoCarregando === formato ? 'Gerando…' : rotulos[formato]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
