import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Plus, X, AlertCircle } from "lucide-react"
import { useConversations } from "@/hooks"

interface SidebarProps {
  isOpen: boolean
  onClose?: () => void
  onNewChat?: () => void
}

export function Sidebar({ isOpen, onClose, onNewChat }: SidebarProps) {
  // TanStack Query hook para listar conversas
  const { data, isPending, isError, error } = useConversations()

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
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <Button
          className="w-full"
          style={{
            backgroundColor: 'var(--ts-blue)',
            color: 'white'
          }}
          onClick={onNewChat}
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
          <div className="space-y-1">
            {data.conversations.map((conv) => (
              <Button
                key={conv.conversationId}
                variant="ghost"
                className="w-full justify-start gap-3 font-normal"
              >
                <MessageSquare className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <span className="text-sm truncate">{conv.lastMessage}</span>
              </Button>
            ))}
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
