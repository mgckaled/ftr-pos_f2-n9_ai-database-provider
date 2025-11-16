/**
 * Componente principal da aplicação
 */

import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { queryClient } from './lib/queryClient'
import { AppLayout } from './components/layout/AppLayout'
import { ChatInterface } from './components/chat/ChatInterface'
import { useSelectedCustomer } from './hooks/useSelectedCustomer'

export function App() {
  const { selectedCustomerId, selectCustomer } = useSelectedCustomer()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AppLayout
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={selectCustomer}
        >
          {selectedCustomerId ? (
            <ChatInterface customerId={selectedCustomerId} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-semibold text-foreground">
                  Bem-vindo ao Customer Support
                </h2>
                <p className="text-muted-foreground">
                  Selecione um cliente na barra lateral para iniciar o atendimento
                </p>
              </div>
            </div>
          )}
        </AppLayout>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
