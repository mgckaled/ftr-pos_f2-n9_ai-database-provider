/**
 * Classifica chunks do PDF por tipo de conteúdo
 * Usa heurísticas simples para detectar code, explanation, example, reference
 */

export type ChunkType = 'code' | 'explanation' | 'example' | 'reference'

export interface ChunkMetadata {
  page: number
  chapter: string
  section?: string
  type: ChunkType
  bookTitle: string
}

/**
 * Classifica o tipo de conteúdo do chunk
 */
export function classifyChunkType(content: string): ChunkType {
  const lowerContent = content.toLowerCase()

  // Heurística 1: Código
  // Procura por padrões comuns de código TypeScript
  const codePatterns = [
    /```/g, // Markdown code blocks
    /function\s+\w+/g,
    /class\s+\w+/g,
    /interface\s+\w+/g,
    /const\s+\w+\s*=/g,
    /let\s+\w+\s*=/g,
    /type\s+\w+\s*=/g,
    /enum\s+\w+/g,
    /import\s+.*from/g,
    /export\s+(class|function|interface|type|const)/g,
  ]

  const codeMatches = codePatterns.reduce((count, pattern) => {
    return count + (content.match(pattern)?.length || 0)
  }, 0)

  if (codeMatches >= 3) {
    return 'code'
  }

  // Heurística 2: Exemplo
  // Procura por indicadores de exemplo
  const examplePatterns = [
    /^example\s+\d+/im,
    /for example/i,
    /the following example/i,
    /listing\s+\d+/i,
    /demonstrates/i,
  ]

  if (examplePatterns.some((pattern) => pattern.test(content))) {
    return 'example'
  }

  // Heurística 3: Referência
  // Procura por indicadores de referência/nota
  const referencePatterns = [
    /^see also/im,
    /^note:/im,
    /^tip:/im,
    /^warning:/im,
    /^caution:/im,
    /refer to/i,
    /described in chapter/i,
  ]

  if (referencePatterns.some((pattern) => pattern.test(content))) {
    return 'reference'
  }

  // Padrão: Explanation (texto explicativo)
  return 'explanation'
}

/**
 * Extrai o número da página do texto (se disponível)
 * Procura por padrões como "Page 145" ou números no início
 */
export function extractPageNumber(content: string, fallback: number = 0): number {
  // Tenta extrair "Page X" ou "p. X"
  const pageMatch = content.match(/\bpage\s+(\d+)\b/i) || content.match(/\bp\.\s*(\d+)\b/i)

  if (pageMatch) {
    return parseInt(pageMatch[1], 10)
  }

  return fallback
}

/**
 * Extrai o nome do capítulo do texto
 * Procura por padrões como "Chapter 5: Generics" ou "CHAPTER 5"
 */
export function extractChapter(content: string): string {
  // Padrão 1: "Chapter X: Title" ou "Chapter X - Title"
  const chapterMatch = content.match(/chapter\s+(\d+)\s*[:\-]\s*([^\n]+)/i)

  if (chapterMatch) {
    return `Chapter ${chapterMatch[1]}: ${chapterMatch[2].trim()}`
  }

  // Padrão 2: Apenas "Chapter X"
  const simpleMatch = content.match(/chapter\s+(\d+)/i)

  if (simpleMatch) {
    return `Chapter ${simpleMatch[1]}`
  }

  // Padrão 3: Título de seção maior (ALL CAPS)
  const sectionMatch = content.match(/^([A-Z][A-Z\s]{10,})$/m)

  if (sectionMatch) {
    return sectionMatch[1].trim()
  }

  return 'Unknown Chapter'
}

/**
 * Extrai seção (se houver)
 * Procura por subtítulos ou seções menores
 */
export function extractSection(content: string): string | undefined {
  // Procura por padrões de seção/subtítulo
  const sectionPatterns = [
    /^##\s+(.+)$/m, // Markdown heading level 2
    /^###\s+(.+)$/m, // Markdown heading level 3
    /^\d+\.\d+\s+(.+)$/m, // Numeração como "5.1 Introduction"
  ]

  for (const pattern of sectionPatterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return undefined
}

/**
 * Processa um chunk e retorna metadata completa
 */
export function processChunkMetadata(
  content: string,
  chunkIndex: number,
  totalChunks: number
): Omit<ChunkMetadata, 'bookTitle'> {
  // Estima página baseada no índice do chunk
  // Assume ~620 páginas e distribui chunks uniformemente
  const estimatedPage = Math.floor((chunkIndex / totalChunks) * 620) + 1

  return {
    page: extractPageNumber(content, estimatedPage),
    chapter: extractChapter(content),
    section: extractSection(content),
    type: classifyChunkType(content),
  }
}
