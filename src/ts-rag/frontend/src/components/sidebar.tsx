import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, AlertCircle, MoreVertical, Pencil, Trash2 } from "lucide-react"
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


  return (
    <aside
      className={`
        h-screen border-r flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-[314px]' : 'w-0 lg:w-0'}
      `}
      style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
    >
      {/* Content wrapper with fixed width to prevent content shift */}
      <div className="w-[314px] h-full flex flex-col">
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
        <ScrollArea className="flex-1">
          <div className="px-2 py-2">
            <div className="mb-2">
              <h2 className="py-2 text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Recentes
              </h2>
            </div>

            {/* Loading state */}
            {isPending && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="py-2 text-sm text-muted-foreground flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Erro ao carregar conversas</span>
              </div>
            )}

            {/* Conversations list */}
            {data && data.conversations.length > 0 && (
              <div className="space-y-2">
                {data.conversations.map((conv) => {
                  const isActive = currentConversationId === conv.conversationId
                  return (
                    <div
                      key={conv.conversationId}
                      className={`
                        group relative w-full flex items-center px-3 py-2 rounded-md
                        transition-colors duration-150
                        ${isActive
                          ? 'bg-accent'
                          : 'hover:bg-accent/50'
                        }
                      `}
                    >
                      {/* Título da conversa - com padding right para não sobrepor o dropdown */}
                      <button
                        className="w-full cursor-pointer text-left pr-8"
                        onClick={() => handleSelectConversation(conv.conversationId)}
                      >
                        <p className={`text-sm truncate transition-all ${isActive ? 'font-medium' : 'font-normal'}`}>
                          {conv.title || conv.lastMessage}
                        </p>
                      </button>

                      {/* Dropdown Menu - posicionado absolutamente, aparece no hover */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 cursor-pointer hover:bg-accent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              className="cursor-pointer gap-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                // TODO: Implementar renomear
                                console.log('Renomear:', conv.conversationId)
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                              <span>Renomear</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                // TODO: Implementar excluir
                                console.log('Excluir:', conv.conversationId)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty state */}
            {data && data.conversations.length === 0 && (
              <div className="py-2 text-sm text-muted-foreground text-center">
                Nenhuma conversa ainda.
                <br />
                Comece um novo chat!
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}
