import { readFile } from "node:fs/promises";

/**
 * Loads a system prompt from a markdown file and returns its contents.
 * Throws if the file cannot be read.
 */
export async function loadSystemPrompt(filePath: string): Promise<string> {
  const content = await readFile(filePath, "utf-8");
  return content.trim();
}
