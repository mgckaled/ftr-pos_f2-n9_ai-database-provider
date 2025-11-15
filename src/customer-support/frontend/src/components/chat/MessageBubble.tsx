/**
 * Componente de bolha de mensagem individual
 */

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bot, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Message } from '@/types/chat'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant'

  return (
    <div
      className={cn(
        'flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        isAssistant ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      {/* Avatar */}
      <Avatar className={cn('h-8 w-8', isAssistant ? 'bg-primary' : 'bg-secondary')}>
        <AvatarFallback>
          {isAssistant ? (
            <Bot className="h-4 w-4 text-primary-foreground" />
          ) : (
            <User className="h-4 w-4 text-secondary-foreground" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          'flex max-w-[75%] flex-col gap-1',
          isAssistant ? 'items-start' : 'items-end',
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 shadow-sm',
            isAssistant
              ? 'bg-card text-card-foreground border'
              : 'bg-primary text-primary-foreground',
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <time className="px-1 text-xs text-muted-foreground">
          {format(message.timestamp, "HH:mm 'de' dd/MM/yyyy", { locale: ptBR })}
        </time>
      </div>
    </div>
  )
}
