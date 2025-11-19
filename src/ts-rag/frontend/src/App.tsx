import { ThemeProvider } from "./components/theme-provider"
import { ConversationProvider } from "./contexts"
import { Layout } from "./components/layout"
import { Chat } from "./components/chat"

function App() {
  return (
    <ThemeProvider defaultTheme='dark'>
      <ConversationProvider>
        <Layout>
          <Chat />
        </Layout>
      </ConversationProvider>
    </ThemeProvider>
  )
}

export default App

