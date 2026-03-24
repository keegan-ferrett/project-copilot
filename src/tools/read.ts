import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ToolHandler } from "./types.js";

/** Tool handler for reading a file's contents from disk. */
export const readToolHandler: ToolHandler = {
  definition: {
    name: "Read",
    description:
      "Reads the full contents of a text file at the given path. " +
      "Returns the file contents as a string. Use absolute paths or paths relative to the working directory.",
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
      return await readFile(absolutePath, "utf-8");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new Error(`Failed to read ${absolutePath}: ${message}`);
    }
  },
};
