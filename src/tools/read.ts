import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ToolHandler } from "./types.js";

/** Prefixes each line with its 1-based line number, padded to a uniform width. */
function addLineNumbers(content: string): string {
  const lines = content.split("\n");
  const width = String(lines.length).length;
  return lines
    .map((line, i) => `${String(i + 1).padStart(width)} | ${line}`)
    .join("\n");
}

/** Tool handler for reading a file's contents from disk. */
export const readToolHandler: ToolHandler = {
  definition: {
    name: "Read",
    description:
      "Reads the full contents of a text file at the given path. " +
      "Returns the file contents with line numbers (e.g. '1 | first line'). Use absolute paths or paths relative to the working directory.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file to read.",
        },
      },
      required: ["file_path"],
    },
  },
  async execute(input) {
    const { file_path } = input as { file_path: string };
    const absolutePath = resolve(file_path);
    try {
      const content = await readFile(absolutePath, "utf-8");
      return addLineNumbers(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new Error(`Failed to read ${absolutePath}: ${message}`);
    }
  },
};
