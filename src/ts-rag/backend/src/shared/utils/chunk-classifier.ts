/**
 * Chunk Classifier V2 - Versão melhorada com context propagation
 * Reduz "Unknown Chapter" através de técnicas avançadas de extração
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
 * Context compartilhado entre chunks para propagação
 */
let lastKnownChapter: string | null = null
let lastKnownSection: string | null = null
let chaptersByPageRange: Map<number, string> = new Map()
let sectionsByPageRange: Map<number, string> = new Map()

/**
 * Classifica o tipo de conteúdo do chunk
 */
export function classifyChunkType(content: string): ChunkType {
  const lowerContent = content.toLowerCase()

  // Heurística 1: Código
  const codePatterns = [
    /```/g,
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

  return 'explanation'
}

/**
 * Extrai o número da página do texto
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
 * Extrai o nome do capítulo - VERSÃO MELHORADA
 */
export function extractChapter(content: string, pageNumber: number): string {
  // Padrão 1: "Chapter X: Title" ou "Chapter X - Title"
  const chapterMatch = content.match(/chapter\s+(\d+)\s*[:\-]\s*([^\n]+)/i)
  if (chapterMatch) {
    const chapter = `Chapter ${chapterMatch[1]}: ${chapterMatch[2].trim()}`
    lastKnownChapter = chapter
    chaptersByPageRange.set(pageNumber, chapter)
    return chapter
  }

  // Padrão 2: "CHAPTER X" (simples)
  const simpleMatch = content.match(/chapter\s+(\d+)/i)
  if (simpleMatch) {
    const chapter = `Chapter ${simpleMatch[1]}`
    lastKnownChapter = chapter
    chaptersByPageRange.set(pageNumber, chapter)
    return chapter
  }

  // Padrão 3: Numeração tipo "1. Introduction" ou "Part I"
  const partMatch = content.match(/^(part|section)\s+([IVX\d]+)[:\-\s]+([^\n]+)/im)
  if (partMatch) {
    const chapter = `${partMatch[1]} ${partMatch[2]}: ${partMatch[3].trim()}`
    lastKnownChapter = chapter
    chaptersByPageRange.set(pageNumber, chapter)
    return chapter
  }

  // Padrão 4: Título em ALL CAPS com mais de 15 caracteres
  const capsMatch = content.match(/^([A-Z][A-Z\s]{15,})$/m)
  if (capsMatch) {
    const title = capsMatch[1].trim()
    // Evita headers comuns
    if (!title.match(/^(TABLE OF CONTENTS|INDEX|REFERENCES|BIBLIOGRAPHY|APPENDIX)/i)) {
      const chapter = title
      lastKnownChapter = chapter
      chaptersByPageRange.set(pageNumber, chapter)
      return chapter
    }
  }

  // Padrão 5: Numeração decimal "1.1 Introduction to TypeScript"
  const decimalMatch = content.match(/^(\d+\.\d+)\s+([^\n]+)/m)
  if (decimalMatch && decimalMatch[2].length > 10) {
    const chapter = `Section ${decimalMatch[1]}: ${decimalMatch[2].trim()}`
    lastKnownChapter = chapter
    chaptersByPageRange.set(pageNumber, chapter)
    return chapter
  }

  // NOVO: Context Propagation - usa último capítulo conhecido se páginas próximas
  if (lastKnownChapter) {
    // Busca capítulo em páginas próximas (±5 páginas)
    for (let offset = 0; offset <= 5; offset++) {
      const nearChapter = chaptersByPageRange.get(pageNumber - offset)
        || chaptersByPageRange.get(pageNumber + offset)
      if (nearChapter) {
        return nearChapter
      }
    }

    // Se não encontrou em páginas próximas, usa último conhecido
    return lastKnownChapter
  }

  return 'Unknown Chapter'
}

/**
 * Extrai seção (se houver) - VERSÃO MELHORADA COM CONTEXT PROPAGATION
 */
export function extractSection(content: string, pageNumber: number): string | undefined {
  // Padrão 1: Markdown headings
  const markdownMatch = content.match(/^#{2,3}\s+(.+)$/m)
  if (markdownMatch) {
    const section = markdownMatch[1].trim()
    lastKnownSection = section
    sectionsByPageRange.set(pageNumber, section)
    return section
  }

  // Padrão 2: Numeração decimal "5.1 Introduction"
  const decimalMatch = content.match(/^(\d+\.\d+)\s+(.+)$/m)
  if (decimalMatch && decimalMatch[2].length > 5) {
    const section = `${decimalMatch[1]} ${decimalMatch[2].trim()}`
    lastKnownSection = section
    sectionsByPageRange.set(pageNumber, section)
    return section
  }

  // Padrão 3: Subtítulos em negrito (detecta por CAPS inicial)
  const subtitleMatch = content.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})$/m)
  if (subtitleMatch && subtitleMatch[1].length > 10) {
    const section = subtitleMatch[1].trim()
    lastKnownSection = section
    sectionsByPageRange.set(pageNumber, section)
    return section
  }

  // Padrão 4: "Section: Title"
  const sectionMatch = content.match(/^section[:\s]+(.+)$/im)
  if (sectionMatch) {
    const section = sectionMatch[1].trim()
    lastKnownSection = section
    sectionsByPageRange.set(pageNumber, section)
    return section
  }

  // NOVO: Context Propagation - usa última section conhecida se páginas próximas
  if (lastKnownSection) {
    // Busca section em páginas próximas (±3 páginas - sections são menores que chapters)
    for (let offset = 0; offset <= 3; offset++) {
      const nearSection = sectionsByPageRange.get(pageNumber - offset)
        || sectionsByPageRange.get(pageNumber + offset)
      if (nearSection) {
        return nearSection
      }
    }

    // Se não encontrou em páginas próximas, usa última conhecida
    return lastKnownSection
  }

  return undefined
}

/**
 * Processa metadata de um chunk - VERSÃO MELHORADA
 */
export function processChunkMetadata(
  content: string,
  chunkIndex: number,
  totalChunks: number
): Omit<ChunkMetadata, 'bookTitle'> {
  // Estima página baseada no índice do chunk
  // Assume ~620 páginas distribuídas uniformemente
  const estimatedPage = Math.floor((chunkIndex / totalChunks) * 620) + 1

  // Extrai página do texto (se disponível)
  const page = extractPageNumber(content, estimatedPage)

  // Extrai capítulo (com context propagation)
  const chapter = extractChapter(content, page)

  // Extrai seção (com context propagation)
  const section = extractSection(content, page)

  // Classifica tipo
  const type = classifyChunkType(content)

  return {
    page,
    chapter,
    section,
    type,
  }
}

/**
 * Reseta o contexto compartilhado
 * Útil quando processar novo documento
 */
export function resetContext(): void {
  lastKnownChapter = null
  lastKnownSection = null
  chaptersByPageRange.clear()
  sectionsByPageRange.clear()
}

/**
 * Obtém estatísticas do contexto
 */
export function getContextStats() {
  return {
    lastKnownChapter,
    lastKnownSection,
    chaptersDetected: chaptersByPageRange.size,
    sectionsDetected: sectionsByPageRange.size,
    pageRanges: Array.from(chaptersByPageRange.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([page, chapter]) => ({ page, chapter })),
    sectionRanges: Array.from(sectionsByPageRange.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([page, section]) => ({ page, section })),
  }
}
