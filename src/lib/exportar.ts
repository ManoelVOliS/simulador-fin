export interface LinhaExportacao {
  campo: string
  valor: string
}

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportarCsv(linhas: LinhaExportacao[], nomeArquivo: string) {
  const cabecalho = 'Campo;Valor'
  const corpo = linhas.map((linha) => `${linha.campo};${linha.valor}`).join('\n')
  const bom = String.fromCharCode(0xfeff)
  const conteudo = `${bom}${cabecalho}\n${corpo}`
  baixarBlob(new Blob([conteudo], { type: 'text/csv;charset=utf-8;' }), nomeArquivo)
}

export async function exportarXlsx(linhas: LinhaExportacao[], nomeArquivo: string) {
  const XLSX = await import('xlsx')
  const dados = [['Campo', 'Valor'], ...linhas.map((linha) => [linha.campo, linha.valor])]
  const planilha = XLSX.utils.aoa_to_sheet(dados)
  const livro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(livro, planilha, 'Simulação')
  XLSX.writeFile(livro, nomeArquivo)
}

export async function exportarPdf(linhas: LinhaExportacao[], nomeArquivo: string, titulo: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  doc.setFontSize(14)
  doc.text(titulo, 14, 16)

  doc.setFontSize(11)
  linhas.forEach((linha, indice) => {
    doc.text(`${linha.campo}: ${linha.valor}`, 14, 28 + indice * 8)
  })

  doc.save(nomeArquivo)
}
