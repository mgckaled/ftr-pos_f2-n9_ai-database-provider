import { useState } from "react"
import { type Message } from "@/types/chat.types"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"

// Dados fake para desenvolvimento
const FAKE_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Como usar generics em TypeScript?',
    timestamp: new Date('2025-01-18T10:00:00')
  },
  {
    id: '2',
    role: 'assistant',
    content: `# Generics em TypeScript

Generics permitem criar componentes reutilizáveis que funcionam com múltiplos tipos. Aqui está um exemplo básico:

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}

// Uso
const output1 = identity<string>("Hello");
const output2 = identity<number>(42);
\`\`\`

## Benefícios

- **Type Safety**: Mantém a segurança de tipos
- **Reusabilidade**: Um código serve para vários tipos
- **Inferência**: TypeScript pode deduzir o tipo automaticamente

Você também pode usar generics com interfaces:

\`\`\`typescript
interface GenericIdentityFn<T> {
  (arg: T): T;
}

function identity<T>(arg: T): T {
  return arg;
}

let myIdentity: GenericIdentityFn<number> = identity;
\`\`\`

Para inline code, use \`Array<T>\` ou \`Promise<string>\`.`,
    timestamp: new Date('2025-01-18T10:00:05'),
    sources: [
      {
        text: 'Generics provide a way to create reusable components that work with a variety of types rather than a single one.',
        metadata: {
          bookTitle: 'Essential TypeScript 5',
          chapter: 'Chapter 12',
          section: 'Section 12.1',
          page: 289,
          type: 'explanation'
        },
        score: 0.92
      },
      {
        text: 'function identity<T>(arg: T): T { return arg; }',
        metadata: {
          bookTitle: 'Essential TypeScript 5',
          chapter: 'Chapter 12',
          section: 'Section 12.2',
          page: 291,
          type: 'code'
        },
        score: 0.88
      }
    ]
  }
]

export function Chat() {
  const [messages, setMessages] = useState<Message[]>(FAKE_MESSAGES)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (content: string) => {
    // Adiciona mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // TODO: Integrar com backend API
    // Simulação de resposta (será substituído pela API real)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Você perguntou: "${content}"\n\nEsta é uma resposta fake. A integração com o backend será implementada na próxima fase.`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder={isLoading ? "Aguardando resposta..." : "Pergunte sobre TypeScript..."}
      />
    </div>
  )
}
