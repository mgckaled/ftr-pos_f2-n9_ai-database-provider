function App() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--ts-blue)' }}>
          TypeScript RAG Chat
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vite + React + TypeScript + TailwindCSS v4
        </p>
        <code className="block mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          console.log("Hello from JetBrains Mono!")
        </code>
      </div>
    </div>
  )
}

export default App
