import { type ReactNode, useState } from "react"
import { Menu, PanelLeftClose, PanelLeft } from "lucide-react"
import { Sidebar } from "./sidebar"
import { Button } from "./ui/button"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - collapsible on all screen sizes */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0'}
        `}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header - mobile and desktop */}
        <header className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          {/* Toggle button - different icons for mobile/desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 hidden lg:block" />
            ) : (
              <PanelLeft className="w-5 h-5 hidden lg:block" />
            )}
            <Menu className="w-5 h-5 lg:hidden" />
          </Button>

          {/* Logo - visible when sidebar is closed on desktop */}
          <div className={`flex items-center gap-2 transition-opacity duration-300 ${isSidebarOpen ? 'lg:opacity-0 lg:w-0' : 'lg:opacity-100'}`}>
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--ts-blue)' }}>
              <span className="text-white font-bold text-xs">TS</span>
            </div>
            <h1 className="font-semibold">TypeScript RAG</h1>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
