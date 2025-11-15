/**
 * Componente de cabeçalho da aplicação
 */

import { MessageSquare } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Customer Support
            </h1>
            <p className="text-sm text-muted-foreground">
              Chat de atendimento com IA
            </p>
          </div>
        </div>

        <ThemeToggle />
      </div>
    </header>
  )
}
