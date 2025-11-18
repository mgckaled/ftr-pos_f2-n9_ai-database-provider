import { ThemeProvider } from "./components/theme-provider"
import { Layout } from "./components/layout"

function App() {
  return (
    <ThemeProvider defaultTheme='dark'>
      <Layout>
        <div
          className='flex items-center justify-center h-full'
          style={{ backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
        >
          <div className='text-center'>
            <h1 className='text-4xl font-bold mb-4' style={{ color: "var(--ts-blue)" }}>
              TypeScript RAG Chat
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>Com Layout + Sidebar + shadcn/ui</p>
            <code className='block mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-gray-800 dark:text-gray-100'>
              console.log("Layout completo funcionando!")
            </code>
          </div>
        </div>
      </Layout>
    </ThemeProvider>
  )
}

export default App

