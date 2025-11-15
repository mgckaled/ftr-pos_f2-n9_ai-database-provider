/**
 * Componente de sidebar para seleção de cliente
 */

import { CustomerSelector } from '../customer/CustomerSelector'
import { CustomerInfo } from '../customer/CustomerInfo'

interface SidebarProps {
  selectedCustomerId: string | null
  onSelectCustomer: (customerId: string | null) => void
}

export function Sidebar({
  selectedCustomerId,
  onSelectCustomer,
}: SidebarProps) {
  return (
    <aside className="flex w-80 flex-col border-r bg-muted/30">
      <div className="border-b bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Selecionar Cliente
        </h2>
        <CustomerSelector
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={onSelectCustomer}
        />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {selectedCustomerId ? (
          <CustomerInfo customerId={selectedCustomerId} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              Selecione um cliente para iniciar o atendimento
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
