# Frontend Implementation Plan - TypeScript RAG Chat

## 📋 Overview

Create a Claude.ai-inspired chat interface for TypeScript documentation queries using React + Vite + TypeScript, shadcn/ui, and TailwindCSS v4.

## 🏗️ Project Structure

```plaintext
src/ts-rag/frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components (button, input, scroll-area, etc.)
│   │   ├── theme-provider.tsx
│   │   ├── mode-toggle.tsx
│   │   ├── layout.tsx       # Main layout wrapper
│   │   ├── sidebar.tsx      # Conversation history sidebar
│   │   ├── chat.tsx         # Main chat area
│   │   ├── message-list.tsx # Message display with markdown
│   │   └── message-input.tsx
│   ├── lib/
│   │   ├── api.ts          # Backend integration
│   │   └── utils.ts        # shadcn utils
│   ├── types/
│   │   └── chat.types.ts   # API response types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── components.json         # shadcn config
```

## 📦 Phase 1: Project Initialization

- Create Vite + React + TypeScript project
- Install TailwindCSS v4
- Configure fonts (Roboto + JetBrains Mono)
- Setup TypeScript color palette CSS variables

## 🎨 Phase 2: Install Dependencies

- shadcn/ui CLI and components (button, input, scroll-area, dropdown-menu)
- react-markdown + react-syntax-highlighter
- lucide-react (icons)
- date-fns (timestamp formatting)

## 🎭 Phase 3: Theme System

- Install ThemeProvider from shadcn/ui
- Create ModeToggle component
- Configure dark/light modes with localStorage
- Apply TypeScript blue (#3178C6) as primary color

## 📐 Phase 4: Base Layout

- Sidebar (250px fixed) + Main area layout
- Responsive toggle for mobile
- Logo and "Novo Chat" button
- Conversation list with scroll

## 💬 Phase 5: Chat Components

- MessageList with markdown rendering
- Code block detection with JetBrains Mono
- MessageInput with auto-resize textarea
- Loading states and error handling

## 🔌 Phase 6: Backend Integration

- API client with fetch wrapper
- POST /api/chat integration
- GET /api/chat/conversations for sidebar
- GET /api/chat/history/:id for message loading
- Type-safe request/response handling

## ✨ Phase 7: Polish

- Source citations display (from RAG response)
- Timestamp formatting
- Empty states
- Error boundaries
- Scroll-to-bottom on new messages

## 🎯 Key Features

✅ Dark/light theme toggle
✅ Conversation history sidebar
✅ Markdown + syntax highlighted code blocks
✅ TypeScript color palette
✅ Backend API integration
✅ Minimal, focused UI
