import Anthropic from "@anthropic-ai/sdk";

/** Describes a tool's API definition and its executor. */
export interface ToolHandler {
  definition: Anthropic.Tool;
  execute: (input: Record<string, unknown>) => Promise<string>;
}
