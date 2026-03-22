# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- Use comments sparingly. Only comment complex code.

## Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, and Claude generates React code that renders in a sandboxed iframe preview. The app works with or without an `ANTHROPIC_API_KEY` — without one, a `MockLanguageModel` returns static responses.

## Commands

```bash
# First-time setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (Next.js with Turbopack)
npm run dev

# Run tests (Vitest with jsdom)
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Lint
npm run lint

# Build
npm run build

# Reset database
npm run db:reset
```

Note: `npm run dev` and `npm run build` require `NODE_OPTIONS='--require ./node-compat.cjs'` which is already configured in package.json scripts.

## Architecture

### Data Flow

1. **Chat input** → `ChatProvider` (wraps `@ai-sdk/react` `useChat`) sends messages to `/api/chat` route
2. **API route** (`src/app/api/chat/route.ts`) reconstructs a `VirtualFileSystem` from serialized client state, calls `streamText` with two AI tools (`str_replace_editor`, `file_manager`), and streams responses back
3. **Tool calls** modify the `VirtualFileSystem` on both server (for AI context) and client (via `handleToolCall` in `FileSystemContext`)
4. **Preview** (`PreviewFrame`) transforms all virtual files with Babel (`jsx-transformer.ts`), builds an import map with blob URLs, and renders in a sandboxed iframe

### Key Abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory filesystem — no files written to disk. Stores files as `FileNode` tree with Map-based children. Serializes to/from JSON for client-server transport and Prisma persistence.
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): React context that wraps `VirtualFileSystem`, provides CRUD operations, handles tool call side effects, and triggers re-renders via `refreshTrigger` counter.
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useChat`, sends serialized file state with every request, delegates tool calls to `FileSystemContext`.
- **JSX Transformer** (`src/lib/transform/jsx-transformer.ts`): Client-side Babel transform. Creates blob URLs for each file, builds an import map with `@/` alias resolution, resolves third-party packages via `esm.sh`, and generates the full preview HTML document.

### AI Tools (Server-side)

- **`str_replace_editor`** (`src/lib/tools/str-replace.ts`): Commands: `view`, `create`, `str_replace`, `insert`, `undo_edit`. Operates on the VirtualFileSystem.
- **`file_manager`** (`src/lib/tools/file-manager.ts`): Commands: `rename`, `delete`.

### Generated Code Conventions

The AI generates code into a virtual filesystem rooted at `/`. The entry point is always `/App.jsx`. Components use `@/` import aliases (e.g., `@/components/Foo`). Styling is Tailwind CSS via CDN in the preview iframe. See `src/lib/prompts/generation.tsx` for the full system prompt.

### Auth & Persistence

- JWT-based auth via `jose` (`src/lib/auth.ts`), bcrypt passwords
- SQLite via Prisma. Schema: `User` → has many `Project`. Projects store `messages` and `data` (serialized VFS) as JSON strings.
- Anonymous users can use the app without persistence. `anon-work-tracker.ts` tracks unsaved work in `sessionStorage`.

### Provider Fallback

`src/lib/provider.ts`: If `ANTHROPIC_API_KEY` is set, uses `claude-haiku-4-5`. Otherwise, `MockLanguageModel` simulates multi-step tool-calling responses for counter/form/card components.

## Tech Stack

- Next.js 15 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4, shadcn/ui components (in `src/components/ui/`)
- Prisma + SQLite, Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)
- Monaco Editor for code editing, Babel standalone for client-side JSX transform
- Vitest + Testing Library + jsdom for tests
