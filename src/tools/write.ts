import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import type { ToolHandler } from "./types.js";

/** Tool handler for writing content to a file on disk. */
export const writeToolHandler: ToolHandler = {
  definition: {
    name: "Write",
    description:
      "Writes the given content to a file at the specified path, creating the file if it does not exist " +
      "and overwriting it if it does. Parent directories are created automatically. " +
      "Use absolute paths or paths relative to the working directory.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file to write.",
        },
        content: {
          type: "string",
          description: "The content to write to the file.",
        },
      },
      required: ["file_path", "content"],
    },
  },
  async execute(input) {
    const { file_path, content } = input as {
      file_path: string;
      content: string;
    };
    const absolutePath = resolve(file_path);
    try {
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content, "utf-8");
      return `Successfully wrote to ${absolutePath}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new Error(`Failed to write ${absolutePath}: ${message}`);
    }
  },
};
