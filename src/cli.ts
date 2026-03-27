import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Default system prompt path, resolved relative to the package root. */
const DEFAULT_SYSTEM_PROMPT = join(__dirname, "..", "prompts", "system.md");

/** Result returned when the CLI falls through to the TUI. */
export interface CliOptions {
  systemPromptPath?: string;
  /** When set, run a tool directly and exit instead of launching the TUI. */
  toolRun?: {
    name: string;
    rawInputs: string[];
  };
}

/**
 * Parses CLI arguments and returns options for the TUI,
 * or a direct tool invocation when `--tool` is provided.
 */
export function runCli(args: string[]): CliOptions {
  const flags: { systemPromptPath?: string } = {};
  let toolName: string | undefined;
  const rawInputs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--system-prompt") {
      const value = args[++i];
      if (!value) {
        console.error("Usage: pm-copilot [--system-prompt <file>]");
        process.exit(1);
      }
      flags.systemPromptPath = resolve(value);
    } else if (args[i] === "--tool") {
      toolName = args[++i];
      if (!toolName) {
        console.error("Usage: pm-copilot --tool <name> [--input key=value ...]");
        process.exit(1);
      }
    } else if (args[i] === "--input") {
      const value = args[++i];
      if (!value || !value.includes("=")) {
        console.error("--input requires key=value format (e.g. --input path=./src)");
        process.exit(1);
      }
      rawInputs.push(value);
    }
  }

  return {
    systemPromptPath: flags.systemPromptPath ?? DEFAULT_SYSTEM_PROMPT,
    ...(toolName ? { toolRun: { name: toolName, rawInputs } } : {}),
  };
}
