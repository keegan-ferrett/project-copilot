import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createProject, getProjectsRoot } from "./projects/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Default system prompt path, resolved relative to the package root. */
const DEFAULT_SYSTEM_PROMPT = join(__dirname, "..", "prompts", "system.md");

/** Result returned when the CLI falls through to the TUI. */
export interface CliOptions {
  projectName: string;
  systemPromptPath?: string;
}

/**
 * Parses CLI arguments and runs the appropriate command.
 * Returns true if a subcommand was handled, or CliOptions to fall through to the TUI.
 */
export async function runCli(args: string[]): Promise<true | CliOptions> {
  const flags: { systemPromptPath?: string } = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--system-prompt") {
      const value = args[++i];
      if (!value) {
        console.error("Usage: pm-copilot --system-prompt <file>");
        process.exit(1);
      }
      flags.systemPromptPath = resolve(value);
    } else {
      positional.push(args[i]);
    }
  }

  const command = positional[0];

  if (command === "new") {
    const name = positional[1];

    if (!name) {
      console.error("Usage: pm-copilot new <project-name>");
      process.exit(1);
    }

    await mkdir(getProjectsRoot(), { recursive: true });

    try {
      const projectPath = await createProject(name);
      console.log(`Created project "${name}" at ${projectPath}`);
    } catch (err: unknown) {
      console.error(
        err instanceof Error ? err.message : "Failed to create project",
      );
      process.exit(1);
    }

    return true;
  }

  const projectName = positional[0];
  if (!projectName) {
    console.error("Usage: pm-copilot <project-name> [--system-prompt <file>]");
    process.exit(1);
  }

  return {
    projectName,
    systemPromptPath: flags.systemPromptPath ?? DEFAULT_SYSTEM_PROMPT,
  };
}
