# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 言語設定
- 日本語で会話してください

## Repository Structure

This is a monorepo for Anthropic Skilljar training projects. Currently contains:

- `claude-in-action/uigen/` — AI-powered React component generator with live preview (see its own `CLAUDE.md` for detailed architecture)

## UIGen Quick Reference

### Commands

```bash
cd claude-in-action/uigen

# First-time setup (deps + Prisma client + DB migrations)
npm run setup

# Dev server (Next.js + Turbopack, http://localhost:3000)
npm run dev

# Tests (Vitest + jsdom)
npm test
npx vitest run src/lib/__tests__/file-system.test.ts  # single test

# Lint
npm run lint

# Build
npm run build

# Reset database
npm run db:reset
```

### Architecture Overview

UIGen lets users describe React components in chat; Claude generates code into a `VirtualFileSystem` (in-memory, no disk writes) and renders live previews in a sandboxed iframe.

**Data flow:** Chat input → `ChatContext` → `/api/chat` route → `streamText` with AI tools (`str_replace_editor`, `file_manager`) → `VirtualFileSystem` updated on server & client → `PreviewFrame` transforms files with Babel → iframe render

**Key files:**
- `src/lib/file-system.ts` — `VirtualFileSystem` class (Map-based file tree, JSON serialization, Prisma persistence)
- `src/lib/contexts/file-system-context.tsx` — React context wrapping VFS with CRUD + tool call handling
- `src/lib/contexts/chat-context.tsx` — Wraps Vercel AI SDK `useChat`, sends serialized file state per request
- `src/lib/transform/jsx-transformer.ts` — Client-side Babel transform, blob URL import maps, `@/` alias and `esm.sh` resolution
- `src/lib/tools/str-replace.ts` — AI tool: view/create/replace/insert/undo files
- `src/lib/tools/file-manager.ts` — AI tool: rename/delete files
- `src/app/api/chat/route.ts` — Chat API endpoint
- `src/lib/prompts/generation.tsx` — AI system prompt
- `src/lib/provider.ts` — Model provider; falls back to `MockLanguageModel` without `ANTHROPIC_API_KEY`

**Tech stack:** Next.js 15 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma + SQLite, Vercel AI SDK, Monaco Editor, Vitest

**Generated code conventions:** Entry point is always `/App.jsx`, components use `@/` import aliases, styling via Tailwind CSS (CDN in preview iframe).
