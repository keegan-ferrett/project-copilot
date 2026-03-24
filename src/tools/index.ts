import Anthropic from "@anthropic-ai/sdk";
import { readToolDefinition, executeReadTool } from "./read.js";

/** All tool definitions passed to the Anthropic API. */
export const toolDefinitions: Anthropic.Tool[] = [readToolDefinition];

/**
 * Dispatches a tool call to the appropriate executor.
 * Returns the tool result content string.
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case "Read":
      return executeReadTool(input as { file_path: string });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
