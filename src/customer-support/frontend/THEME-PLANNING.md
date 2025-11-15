<!-- markdownlint-disable -->

# Planejamento de Temas e Dark Mode

## Stack Recomendada

### Gerenciamento de Tema
- **next-themes** (v0.4+) - Biblioteca para alternância de temas
  - Suporte a System preference
  - Sem flash de conteúdo não estilizado (FOUC)
  - Persistência automática em localStorage
  - TypeScript support
  - Framework-agnostic (funciona com Vite + React)

### Formato de Cores
- **OKLCH** - Espaço de cores perceptualmente uniforme
  - Melhor controle de luminosidade
  - Cores mais vibrantes e consistentes
  - Suporte nativo no TailwindCSS v4

## Paleta de Cores Moderna

### Tema Principal: "Purple Modern"
Inspirado em interfaces modernas (Linear, Vercel, Claude.ai)

#### Light Mode
```css
:root {
  /* Brand Colors - Purple/Violet */
  --primary: oklch(0.55 0.25 290);        /* Purple vibrante */
  --primary-foreground: oklch(0.99 0 0);  /* Branco */

  /* Backgrounds */
  --background: oklch(0.99 0 0);          /* Quase branco */
  --foreground: oklch(0.15 0 0);          /* Quase preto */

  /* Surfaces */
  --card: oklch(1 0 0);                   /* Branco puro */
  --card-foreground: oklch(0.15 0 0);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0 0);

  /* Secondary */
  --secondary: oklch(0.96 0.01 290);      /* Purple muito claro */
  --secondary-foreground: oklch(0.25 0 0);

  /* Muted (para textos secundários) */
  --muted: oklch(0.96 0.01 290);
  --muted-foreground: oklch(0.55 0.05 290);

  /* Accent (para highlights) */
  --accent: oklch(0.95 0.02 290);
  --accent-foreground: oklch(0.25 0 0);

  /* Destructive (erros) */
  --destructive: oklch(0.60 0.24 25);     /* Vermelho */
  --destructive-foreground: oklch(0.99 0 0);

  /* Success (opcional) */
  --success: oklch(0.65 0.18 145);        /* Verde */
  --success-foreground: oklch(0.99 0 0);

  /* Borders & Inputs */
  --border: oklch(0.92 0.01 290);
  --input: oklch(0.92 0.01 290);
  --ring: oklch(0.55 0.25 290);           /* Purple - mesma cor do primary */

  /* Border Radius */
  --radius: 0.75rem;                      /* 12px - moderadamente arredondado */
}
```

#### Dark Mode
```css
.dark {
  /* Brand Colors - Purple mais brilhante no dark */
  --primary: oklch(0.75 0.22 290);        /* Purple mais claro */
  --primary-foreground: oklch(0.15 0 0);  /* Escuro */

  /* Backgrounds */
  --background: oklch(0.14 0.01 290);     /* Quase preto com leve tint purple */
  --foreground: oklch(0.98 0 0);          /* Quase branco */

  /* Surfaces */
  --card: oklch(0.20 0.01 290);           /* Cinza escuro com tint */
  --card-foreground: oklch(0.98 0 0);

  --popover: oklch(0.20 0.01 290);
  --popover-foreground: oklch(0.98 0 0);

  /* Secondary */
  --secondary: oklch(0.25 0.02 290);      /* Cinza médio com tint */
  --secondary-foreground: oklch(0.98 0 0);

  /* Muted */
  --muted: oklch(0.25 0.02 290);
  --muted-foreground: oklch(0.65 0.05 290);

  /* Accent */
  --accent: oklch(0.30 0.04 290);
  --accent-foreground: oklch(0.98 0 0);

  /* Destructive */
  --destructive: oklch(0.70 0.20 25);     /* Vermelho mais claro */
  --destructive-foreground: oklch(0.15 0 0);

  /* Success */
  --success: oklch(0.70 0.16 145);        /* Verde mais claro */
  --success-foreground: oklch(0.15 0 0);

  /* Borders & Inputs - usar transparência */
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.75 0.22 290);
}
```

## Implementação com next-themes

### 1. Instalação
```bash
pnpm add next-themes
```

### 2. Provider (main.tsx)
```tsx
import { ThemeProvider } from 'next-themes'

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* App content */}
    </ThemeProvider>
  )
}
```

### 3. Theme Toggle Component
```tsx
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## Melhores Práticas

### 1. Prevenir FOUC (Flash of Unstyled Content)
next-themes já lida com isso automaticamente via `suppressHydrationWarning`

### 2. Acessibilidade
- Garantir contraste mínimo WCAG AA (4.5:1 para texto normal)
- Usar `prefers-color-scheme` como fallback
- Fornecer opção "System" para respeitar preferência do OS

### 3. Performance
- Usar CSS variables em vez de classes condicionais
- `disableTransitionOnChange` evita animações durante troca
- Cachear tema em localStorage (automático)

### 4. Componentes com Theme-Awareness
```tsx
// Usar classes do Tailwind com dark: variant
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">
    Texto que se adapta ao tema
  </p>
</div>
```

## Integração com shadcn-ui e TailwindCSS

✅ **Integração Nativa**
- shadcn-ui já usa `dark:` variants do Tailwind
- Todos os componentes funcionam out-of-the-box
- Apenas configurar `darkMode: 'selector'` no tailwind.config

## Recomendação Final

**Paleta**: Purple Modern
- Moderna e vibrante
- Diferenciação de concorrentes
- Boa associação com tecnologia/IA
- Excelente contraste em ambos os temas

**Biblioteca**: next-themes
- Zero FOUC
- Framework-agnostic (funciona com Vite!)
- TypeScript-first
- Bem mantida (84k downloads/semana)
- Apenas 1.2kb gzipped
