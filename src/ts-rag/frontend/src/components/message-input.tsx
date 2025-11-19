import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react"

interface MessageInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Pergunte sobre TypeScript..."
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage)
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  return (
    <div className="border-t px-2 py-2.5 sm:px-3 sm:py-3 md:p-4" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-1.5 sm:gap-2 items-end">
          {/* Textarea usando shadcn/ui - responsivo para mobile pequeno */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="resize-none min-h-[36px] sm:min-h-[40px] md:min-h-[44px] max-h-[120px] sm:max-h-[160px] md:max-h-[200px] text-xs sm:text-sm md:text-base px-2 sm:px-3"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          />

          {/* Send Button - responsivo para mobile pequeno */}
          <Button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            size="icon"
            className="shrink-0 h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] md:h-[44px] md:w-[44px] cursor-pointer hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: disabled || !message.trim() ? 'hsl(var(--muted-foreground))' : 'var(--ts-blue)',
              color: 'white'
            }}
          >
            <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
          </Button>
        </div>

        {/* Helper text - esconde no mobile muito pequeno */}
        <div className="hidden sm:block text-xs mt-2 text-center text-muted-foreground">
          Pressione <kbd className="px-1.5 py-0.5 rounded text-xs border bg-muted">Enter</kbd> para enviar,{' '}
          <kbd className="px-1.5 py-0.5 rounded text-xs border bg-muted">Shift + Enter</kbd> para nova linha
        </div>
      </div>
    </div>
  )
}
