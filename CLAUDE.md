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

The app is a React/Ink TUI. Entry point is `src/index.tsx` which parses CLI arguments via `cli.ts`, then renders the `App` component.

**App.tsx** owns all state and API interaction:
- Maintains two parallel message arrays: one for UI display (`Message[]`) and one for the Anthropic API (`MessageParam[]`)
- Creates the Anthropic client and handles submit → API call → response parsing
- Runs an agentic tool_use loop: sends tools to the API, executes any tool calls, returns results, and repeats until the model produces a final text response
- Tracks token usage per turn

**Components:**
- `components/MessageList.tsx` — renders conversation history and loading indicator. Exports the `Message` interface used across the app. Messages with `type: "tool"` or `type: "command"` render dimmed and italic.
- `components/ChatInput.tsx` — bordered text input with a custom bottom border that displays token count. Uses `useStdout` to match terminal width.

**CLI (`src/cli.ts`):**
- Parses `process.argv` for flags (e.g. `--system-prompt`) and returns `CliOptions` for the TUI. No subcommands — the tool runs from any directory.
- If a `PROJECT.md` exists in the current working directory, its contents are loaded as additional context for the AI.

**Tools (`src/tools/`):** See [docs/tools.md](docs/tools.md) for full tool documentation.

**Slash Commands (`src/commands/`):**
- `types.ts` — `CommandHandler` interface, `CommandContext` (app state/setters), and `CommandResult` discriminated union (`"prompt"` sends text to the AI, `"action"` performs a side-effect)
- `index.ts` — map-based command registry. Exports `registerCommand()`, `commandList()`, `isCommand()`, `parseCommand()`, and `executeCommand()`. Built-in commands are registered at module load.
- `help.ts` — `/help`: lists all available slash commands
- `clear.ts` — `/clear`: resets chat history and API context
- `echo.ts` — `/echo <text>`: echoes arguments back into the chat
- To add a new command: create a file exporting a `CommandHandler`, then call `registerCommand()` in `index.ts`
- App.tsx intercepts `/`-prefixed input in `handleSubmit` before the API call

## Key Details

- ESM project (`"type": "module"` in package.json) — local imports require `.js` extensions
- JSX configured with `react-jsx` transform (no `React` import needed for JSX, but used for type annotations)
- Model is set to `claude-sonnet-4-6` in App.tsx
- API key loaded from `.env` via `dotenv/config` import at the top of `index.tsx`
- `package.json` has a `bin` field mapping `pm-copilot` to `dist/index.js` for global CLI installation
- Commit messages follow Conventional Commits style
