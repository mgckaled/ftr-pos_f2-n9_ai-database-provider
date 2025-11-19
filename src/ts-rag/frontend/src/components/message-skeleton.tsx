import { Skeleton } from "@/components/ui/skeleton"
import { Bot } from "lucide-react"
import { Avatar, AvatarFallback } from "./ui/avatar"

export function MessageSkeleton() {
  return (
    <div className="flex gap-2 sm:gap-3 md:gap-4">
      {/* Avatar do Bot - seguindo mesmo padrão do MessageItem */}
      <Avatar
        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 shrink-0 mt-0.5 sm:mt-1"
        style={{ backgroundColor: 'var(--ts-blue)' }}
      >
        <AvatarFallback
          style={{
            backgroundColor: 'var(--ts-blue)',
            color: 'white'
          }}
        >
          <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
        </AvatarFallback>
      </Avatar>

      {/* Conteúdo do skeleton */}
      <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
        {/* Nome do bot */}
        <div className="font-semibold text-xs sm:text-sm md:text-base">
          TypeScript RAG
        </div>

        {/* Linhas do skeleton simulando texto */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-[90%]" style={{ backgroundColor: 'rgba(100, 116, 139, 0.4)' }} />
          <Skeleton className="h-4 w-[85%]" style={{ backgroundColor: 'rgba(100, 116, 139, 0.4)' }} />
          <Skeleton className="h-4 w-[75%]" style={{ backgroundColor: 'rgba(100, 116, 139, 0.4)' }} />
          <Skeleton className="h-4 w-[80%]" style={{ backgroundColor: 'rgba(100, 116, 139, 0.4)' }} />
          <Skeleton className="h-4 w-[45%]" style={{ backgroundColor: 'rgba(100, 116, 139, 0.4)' }} />
        </div>
      </div>
    </div>
  )
}
