import { mkdir } from "node:fs/promises";
import { createProject, getProjectsRoot } from "./projects/index.js";

/**
 * Parses CLI arguments and runs the appropriate command.
 * Returns true if a command was handled, false to fall through to the TUI.
 */
export async function runCli(args: string[]): Promise<boolean> {
  const command = args[0];

  if (command === "new") {
    const name = args[1];

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

  return false;
}
