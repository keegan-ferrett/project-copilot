import Anthropic from "@anthropic-ai/sdk";
import type { ToolHandler } from "./types.js";
import { readToolHandler } from "./read.js";
import { writeToolHandler } from "./write.js";

export type { ToolHandler } from "./types.js";

const registry = new Map<string, ToolHandler>();

/** Registers a tool handler, keyed by its definition name. */
export function registerTool(handler: ToolHandler): void {
  registry.set(handler.definition.name, handler);
}

/** All tool definitions passed to the Anthropic API. */
export function toolDefinitions(): Anthropic.Tool[] {
  return Array.from(registry.values()).map((h) => h.definition);
}

/** Dispatches a tool call to the matching registered handler. */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  const handler = registry.get(name);
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler.execute(input);
}

// Register built-in tools
registerTool(readToolHandler);
registerTool(writeToolHandler);
