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

### Tree

Prints the directory structure as a tree, respecting `.gitignore` rules. Walks the filesystem directly and filters entries using `.gitignore` files found at each directory level. Does not depend on `git`.

- **Source:** `src/tools/tree.ts`
- **Parameters:** `path` (string, optional — subdirectory to scope the tree to)

### Edit

Performs a find-and-replace on a file. If there are multiple matches and the global flag is not set, returns an error prompting the agent to either expand the search string or enable global replacement.

- **Source:** `src/tools/edit.ts`
- **Parameters:** `file_path` (string, required), `search_string` (string, required), `replacement_string` (string, required), `global` (boolean, optional — defaults to false)

## Adding a New Tool

1. Create a file in `src/tools/` exporting a `ToolHandler`
2. Call `registerTool()` in `src/tools/index.ts`
