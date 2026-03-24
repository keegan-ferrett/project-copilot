import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

/** Anthropic tool definition for reading a file's contents. */
export const readToolDefinition: Anthropic.Tool = {
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
};

interface ReadToolInput {
  file_path: string;
}

/** Executes the Read tool, returning file contents or an error message. */
export async function executeReadTool(input: ReadToolInput): Promise<string> {
  const absolutePath = resolve(input.file_path);
  try {
    return await readFile(absolutePath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Failed to read ${absolutePath}: ${message}`);
  }
}
