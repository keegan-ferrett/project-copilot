import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ToolHandler } from "./types.js";

/**
 * Counts all non-overlapping occurrences of a substring within a string.
 */
function countOccurrences(text: string, search: string): number {
  let count = 0;
  let position = 0;
  while ((position = text.indexOf(search, position)) !== -1) {
    count++;
    position += search.length;
  }
  return count;
}

/** Tool handler for performing find-and-replace edits on a file. */
export const editToolHandler: ToolHandler = {
  definition: {
    name: "Edit",
    description:
      "Performs a find-and-replace on a file. Replaces the search string with the replacement string. " +
      "If there are multiple matches and the global flag is not set, the tool returns an error — " +
      "either expand the search string to be unique or set global to true for a global replacement. " +
      "Use absolute paths or paths relative to the working directory.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file to edit.",
        },
        search_string: {
          type: "string",
          description: "The exact text to search for in the file.",
        },
        replacement_string: {
          type: "string",
          description: "The text to replace the search string with.",
        },
        global: {
          type: "boolean",
          description:
            "When true, replaces all occurrences of the search string. " +
            "When false (default), the search string must match exactly once or the tool returns an error.",
        },
      },
      required: ["file_path", "search_string", "replacement_string"],
    },
  },
  async execute(input) {
    const { file_path, search_string, replacement_string, global: globalReplace = false } =
      input as {
        file_path: string;
        search_string: string;
        replacement_string: string;
        global?: boolean;
      };

    const absolutePath = resolve(file_path);

    try {
      const content = await readFile(absolutePath, "utf-8");
      const matchCount = countOccurrences(content, search_string);

      if (matchCount === 0) {
        throw new Error(
          `Search string not found in ${absolutePath}. Verify the exact text exists in the file.`,
        );
      }

      if (matchCount > 1 && !globalReplace) {
        throw new Error(
          `Found ${matchCount} matches of the search string in ${absolutePath}. ` +
            `Expand the search string to uniquely match one location, or set global to true to replace all occurrences.`,
        );
      }

      const updated = globalReplace
        ? content.replaceAll(search_string, replacement_string)
        : content.replace(search_string, replacement_string);

      await writeFile(absolutePath, updated, "utf-8");

      const replacements = globalReplace ? matchCount : 1;
      return `Successfully replaced ${replacements} occurrence${replacements > 1 ? "s" : ""} in ${absolutePath}`;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Search string")) throw err;
      if (err instanceof Error && err.message.startsWith("Found")) throw err;
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new Error(`Failed to edit ${absolutePath}: ${message}`);
    }
  },
};
