import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const PM_COPILOT_DIR = ".pm-copilot";

/**
 * Returns the root directory for all PM Copilot projects (~/.pm-copilot).
 */
export function getProjectsRoot(): string {
  return join(homedir(), PM_COPILOT_DIR);
}

/**
 * Returns the absolute path for a named project directory.
 */
export function getProjectPath(name: string): string {
  return join(getProjectsRoot(), name);
}

/**
 * Creates a new project directory at ~/.pm-copilot/<name>.
 * Throws if the directory already exists.
 */
export async function createProject(name: string): Promise<string> {
  const projectPath = getProjectPath(name);

  try {
    await mkdir(projectPath, { recursive: false });
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && err.code === "EEXIST") {
      throw new Error(`Project "${name}" already exists at ${projectPath}`);
    }
    throw err;
  }

  return projectPath;
}
