# Tools

Tools are the capabilities exposed to the AI agent during conversation. They are defined in `src/tools/`.

## Architecture

- `types.ts` — shared `ToolHandler` interface (definition + execute function)
- `index.ts` — map-based tool registry. Exports `registerTool()`, `toolDefinitions()`, and `executeTool()`. Built-in tools are registered at module load.

## Available Tools

### Read

Reads a file's contents from disk and returns them as a string. Accepts absolute or relative paths.

- **Source:** `src/tools/read.ts`
- **Parameters:** `file_path` (string, required)

### Write

Writes content to a file at the specified path, creating the file if it does not exist and overwriting it if it does. Parent directories are created automatically.

- **Source:** `src/tools/write.ts`
- **Parameters:** `file_path` (string, required), `content` (string, required)

## Adding a New Tool

1. Create a file in `src/tools/` exporting a `ToolHandler`
2. Call `registerTool()` in `src/tools/index.ts`
