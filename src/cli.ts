import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Default system prompt path, resolved relative to the package root. */
const DEFAULT_SYSTEM_PROMPT = join(__dirname, "..", "prompts", "system.md");

/** Result returned when the CLI falls through to the TUI. */
export interface CliOptions {
  systemPromptPath?: string;
}

/**
 * Parses CLI arguments and returns options for the TUI.
 */
export function runCli(args: string[]): CliOptions {
  const flags: { systemPromptPath?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--system-prompt") {
      const value = args[++i];
      if (!value) {
        console.error("Usage: pm-copilot [--system-prompt <file>]");
        process.exit(1);
      }
      flags.systemPromptPath = resolve(value);
    }
  }

  return {
    systemPromptPath: flags.systemPromptPath ?? DEFAULT_SYSTEM_PROMPT,
  };
}
