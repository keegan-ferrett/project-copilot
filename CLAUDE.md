# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PM Copilot — a terminal-based AI assistant for software teams. It wraps the Anthropic API in a React-based TUI using Ink, running entirely in the terminal without alternate screen mode.

## Commands

- `npm run dev` — run in development mode (tsx, no compile step)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled output
- No test framework is configured yet

## Architecture

The app is a React/Ink TUI. Entry point is `src/index.tsx` which renders the `App` component.

**App.tsx** owns all state and API interaction:
- Maintains two parallel message arrays: one for UI display (`Message[]`) and one for the Anthropic API (`MessageParam[]`)
- Creates the Anthropic client and handles submit → API call → response parsing
- Runs an agentic tool_use loop: sends tools to the API, executes any tool calls, returns results, and repeats until the model produces a final text response
- Tracks token usage per turn

**Components:**
- `components/MessageList.tsx` — renders conversation history and loading indicator. Exports the `Message` interface used across the app. Messages with `type: "tool"` render dimmed and italic.
- `components/ChatInput.tsx` — bordered text input with a custom bottom border that displays token count. Uses `useStdout` to match terminal width.

**Tools (`src/tools/`):**
- `types.ts` — shared `ToolHandler` interface (definition + execute function)
- `index.ts` — map-based tool registry. Exports `registerTool()`, `toolDefinitions()`, and `executeTool()`. Built-in tools are registered at module load.
- `read.ts` — Read tool: reads a file from disk and returns its contents
- To add a new tool: create a file exporting a `ToolHandler`, then call `registerTool()` in `index.ts`

## Key Details

- ESM project (`"type": "module"` in package.json) — local imports require `.js` extensions
- JSX configured with `react-jsx` transform (no `React` import needed for JSX, but used for type annotations)
- Model is set to `claude-sonnet-4-6` in App.tsx
- API key loaded from `.env` via `dotenv/config` import at the top of `index.tsx`
- Commit messages follow Conventional Commits style
