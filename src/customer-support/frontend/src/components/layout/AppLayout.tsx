/**
 * Layout principal da aplicação
 */

import { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  selectedCustomerId: string | null
  onSelectCustomer: (customerId: string | null) => void
  children: ReactNode
}

export function AppLayout({
  selectedCustomerId,
  onSelectCustomer,
  children,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={onSelectCustomer}
        />

        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
