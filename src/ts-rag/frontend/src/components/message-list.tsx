import { type Message } from "@/types/chat.types"
import { Bot, User, BookOpen } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { ScrollArea } from "./ui/scroll-area"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <ScrollArea className="flex-1 px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    </ScrollArea>
  )
}

interface MessageItemProps {
  message: Message
}

function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'

  return (
    <div className="flex gap-2 sm:gap-3 md:gap-4">
      {/* Avatar usando shadcn/ui - responsivo */}
      <Avatar
        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 shrink-0 mt-0.5 sm:mt-1"
        style={{
          backgroundColor: isUser ? 'hsl(var(--muted))' : 'var(--ts-blue)'
        }}
      >
        <AvatarFallback
          style={{
            backgroundColor: isUser ? 'hsl(var(--muted))' : 'var(--ts-blue)',
            color: isUser ? 'hsl(var(--foreground))' : 'white'
          }}
        >
          {isUser ? (
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
          ) : (
            <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
        <div className="font-semibold text-xs sm:text-sm md:text-base">
          {isUser ? 'Você' : 'TypeScript RAG'}
        </div>

        {/* Markdown Content - responsivo com melhor espaçamento */}
        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:my-3 prose-headings:my-4 prose-pre:my-6 prose-ul:my-4 prose-ol:my-4">
          <ReactMarkdown
            components={{
              // Code blocks with syntax highlighting
              code(props) {
                const { children, className, ...rest } = props
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !match

                return isInline ? (
                  // Inline code with monospace font - responsivo
                  <code
                    {...rest}
                    className="px-1.5 py-0.5 rounded text-xs sm:text-sm"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--foreground))',
                      fontFamily: '"JetBrains Mono", monospace'
                    }}
                  >
                    {children}
                  </code>
                ) : (
                  // Code block com barra de rolagem horizontal
                  <div className="my-4 sm:my-6 -mx-2 sm:mx-0">
                    <SyntaxHighlighter
                      {...rest}
                      PreTag="div"
                      language={match[1]}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontFamily: '"JetBrains Mono", monospace',
                        padding: '0.75rem',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        maxWidth: '100%'
                      }}
                      className="text-[11px] sm:text-xs md:text-sm"
                      wrapLongLines={false}
                      showLineNumbers={false}
                      showInlineLineNumbers={false}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                )
              },
              // Paragraphs with Roboto font (normal text) - responsivo
              p(props) {
                return (
                  <p
                    {...props}
                    className="text-xs sm:text-sm md:text-base leading-relaxed"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  />
                )
              },
              // Headings - responsivos
              h1(props) {
                return (
                  <h1
                    {...props}
                    className="text-lg sm:text-xl md:text-2xl"
                    style={{
                      fontFamily: 'Roboto, sans-serif',
                      color: 'var(--ts-blue)'
                    }}
                  />
                )
              },
              h2(props) {
                return (
                  <h2
                    {...props}
                    className="text-base sm:text-lg md:text-xl"
                    style={{
                      fontFamily: 'Roboto, sans-serif',
                      color: 'var(--ts-blue)'
                    }}
                  />
                )
              },
              h3(props) {
                return (
                  <h3
                    {...props}
                    className="text-sm sm:text-base md:text-lg"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  />
                )
              },
              // Lists - responsivas
              ul(props) {
                return (
                  <ul
                    {...props}
                    className="text-xs sm:text-sm md:text-base"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  />
                )
              },
              ol(props) {
                return (
                  <ol
                    {...props}
                    className="text-xs sm:text-sm md:text-base"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  />
                )
              },
              // Links
              a(props) {
                return (
                  <a
                    {...props}
                    style={{ color: 'var(--ts-blue)' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                )
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Sources (if available) usando Card e Badge - responsivo com padding reduzido */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0" />
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-muted-foreground">
                Fontes consultadas:
              </span>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {message.sources.slice(0, 3).map((source, idx) => (
                <Card key={idx} className="border-muted">
                  <CardContent className="px-2.5 py-2 sm:px-3 sm:py-2.5">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 py-0 leading-tight">
                        {source.metadata.bookTitle || 'Essential TypeScript 5'}
                      </Badge>
                      {source.metadata.chapter && (
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 py-0 leading-tight">
                          {source.metadata.chapter}
                        </Badge>
                      )}
                      {source.metadata.section && (
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 py-0 leading-tight">
                          {source.metadata.section}
                        </Badge>
                      )}
                      {source.metadata.type && (
                        <Badge
                          variant="outline"
                          className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 py-0 leading-tight"
                          style={{ borderColor: 'var(--ts-blue)', color: 'var(--ts-blue)' }}
                        >
                          {source.metadata.type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {source.text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
