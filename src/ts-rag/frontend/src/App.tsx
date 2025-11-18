import { ThemeProvider } from "./components/theme-provider"
import { Layout } from "./components/layout"
import { Chat } from "./components/chat"

function App() {
  return (
    <ThemeProvider defaultTheme='dark'>
      <Layout>
        <Chat />
      </Layout>
    </ThemeProvider>
  )
}

export default App

