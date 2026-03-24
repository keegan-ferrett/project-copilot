import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Recognised filenames for per-directory project context, checked in order. */
const PROJECT_MD_NAMES = ["PROJECT.md", "project.md"];

/**
 * Loads a system prompt from a markdown file and returns its contents.
 * Throws if the file cannot be read.
 */
export async function loadSystemPrompt(filePath: string): Promise<string> {
  const content = await readFile(filePath, "utf-8");
  return content.trim();
}

/**
 * Searches the given directory for a PROJECT.md or project.md file.
 * Returns its trimmed contents if found, or undefined if neither exists.
 */
export async function loadProjectContext(dir: string): Promise<string | undefined> {
  for (const name of PROJECT_MD_NAMES) {
    try {
      const content = await readFile(join(dir, name), "utf-8");
      return content.trim();
    } catch {
      // File doesn't exist — try the next candidate.
    }
  }
  return undefined;
}
