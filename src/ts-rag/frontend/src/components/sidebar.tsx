import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Plus, X, AlertCircle } from "lucide-react"
import { useConversations } from "@/hooks"
import { useConversation } from "@/contexts"

interface SidebarProps {
  isOpen: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Context hook para gerenciar conversa atual
  const { conversationId: currentConversationId, setConversationId, startNewChat } = useConversation()

  // TanStack Query hook para listar conversas
  const { data, isPending, isError } = useConversations()

  const handleNewChat = () => {
    startNewChat()
    // Fecha sidebar no mobile após criar novo chat
    if (onClose && window.innerWidth < 1024) {
      onClose()
    }
  }

  const handleSelectConversation = (convId: string) => {
    setConversationId(convId)
    // Fecha sidebar no mobile após selecionar conversa
    if (onClose && window.innerWidth < 1024) {
      onClose()
    }
  }

  // Função para gerar título resumido da conversa
  const getConversationTitle = (lastMessage: string) => {
    // Remove quebras de linha e espaços extras
    const cleaned = lastMessage.replace(/\s+/g, ' ').trim()

    // Trunca em 45 caracteres para mobile-friendly
    const maxLength = 45
    if (cleaned.length <= maxLength) {
      return cleaned
    }

    // Trunca no último espaço antes do limite para não cortar palavras
    const truncated = cleaned.slice(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')

    if (lastSpace > maxLength * 0.6) {
      return truncated.slice(0, lastSpace) + '...'
    }

    return truncated + '...'
  }

  return (
    <aside
      className={`
        h-screen border-r flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-0 lg:w-0'}
      `}
      style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
    >
      {/* Content wrapper with fixed width to prevent content shift */}
      <div className="w-64 h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--ts-blue)' }}>
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <h1 className="font-semibold text-lg">TypeScript RAG</h1>
          </div>
          {/* Close button - only visible on mobile */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden cursor-pointer hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <Button
          className="w-full cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: 'var(--ts-blue)',
            color: 'white'
          }}
          onClick={handleNewChat}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 p-2">
        <div className="mb-2">
          <h2 className="px-3 py-2 text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Recentes
          </h2>
        </div>

        {/* Loading state */}
        {isPending && (
          <div className="space-y-2 px-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="px-3 py-2 text-sm text-muted-foreground flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Erro ao carregar conversas</span>
          </div>
        )}

        {/* Conversations list */}
        {data && data.conversations.length > 0 && (
          <div className="space-y-2 px-2">
            {data.conversations.map((conv) => {
              const isActive = currentConversationId === conv.conversationId
              return (
                <button
                  key={conv.conversationId}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg
                    cursor-pointer
                    transition-all duration-200
                    border
                    ${isActive
                      ? 'bg-accent/40 border-accent hover:bg-accent/60 shadow-sm'
                      : 'bg-card/50 border-border/50 hover:bg-accent/50 hover:border-accent hover:shadow-md'
                    }
                  `}
                  onClick={() => handleSelectConversation(conv.conversationId)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-1.5 rounded transition-colors
                      ${isActive ? 'bg-blue-500/10' : 'bg-muted/50'}
                    `}>
                      <MessageSquare
                        className="w-4 h-4 transition-colors"
                        style={{ color: isActive ? 'var(--ts-blue)' : 'hsl(var(--muted-foreground))' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate transition-all ${isActive ? 'font-medium' : 'font-normal'}`}>
                        {getConversationTitle(conv.lastMessage)}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {data && data.conversations.length === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            Nenhuma conversa ainda.
            <br />
            Comece um novo chat!
          </div>
        )}
      </ScrollArea>
      </div>
    </aside>
  )
}
