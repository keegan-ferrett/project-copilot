import type { CommandHandler, CommandContext, CommandResult } from "./types.js";
import { helpCommandHandler } from "./help.js";
import { clearCommandHandler } from "./clear.js";
import { echoCommandHandler } from "./echo.js";
import { systemPromptCommandHandler } from "./system-prompt.js";

export type { CommandHandler, CommandContext, CommandResult } from "./types.js";

const registry = new Map<string, CommandHandler>();

/** Registers a command handler, keyed by its name. */
export function registerCommand(handler: CommandHandler): void {
  registry.set(handler.name, handler);
}

/** Returns all registered command handlers. */
export function commandList(): CommandHandler[] {
  return Array.from(registry.values());
}

/** Checks whether a raw input string is a slash command. */
export function isCommand(input: string): boolean {
  return input.startsWith("/");
}

/** Parses a raw input string into a command name and arguments. */
export function parseCommand(input: string): { name: string; args: string[] } {
  const parts = input.slice(1).split(/\s+/).filter(Boolean);
  return { name: parts[0] ?? "", args: parts.slice(1) };
}

/** Dispatches a parsed command to its registered handler. */
export async function executeCommand(
  name: string,
  args: string[],
  context: CommandContext,
): Promise<CommandResult> {
  const handler = registry.get(name);
  if (!handler) {
    return {
      type: "action",
      message: `Unknown command: /${name}. Type /help for available commands.`,
    };
  }
  return handler.execute(args, context);
}

// Register built-in commands
registerCommand(helpCommandHandler);
registerCommand(clearCommandHandler);
registerCommand(echoCommandHandler);

if (process.env.DEV_MODE) {
  registerCommand(systemPromptCommandHandler);
}
