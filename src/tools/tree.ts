import { execFile } from "node:child_process";
import { resolve, relative, sep } from "node:path";
import { promisify } from "node:util";
import type { ToolHandler } from "./types.js";

const execFileAsync = promisify(execFile);

interface TreeNode {
  [name: string]: TreeNode;
}

/** Builds a nested object representing the directory tree from a list of file paths. */
function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = {};
  for (const filePath of paths) {
    const parts = filePath.split(sep);
    let current = root;
    for (const part of parts) {
      current[part] ??= {};
      current = current[part];
    }
  }
  return root;
}

/** Renders a tree node into the traditional `tree` command text format. */
function renderTree(node: TreeNode, prefix = ""): string {
  const entries = Object.keys(node).sort((a, b) => {
    const aIsDir = Object.keys(node[a]).length > 0;
    const bIsDir = Object.keys(node[b]).length > 0;
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.localeCompare(b);
  });

  const lines: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const name = entries[i];
    const isLast = i === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";
    const isDir = Object.keys(node[name]).length > 0;

    lines.push(`${prefix}${connector}${isDir ? name + "/" : name}`);
    if (isDir) {
      lines.push(renderTree(node[name], prefix + childPrefix));
    }
  }
  return lines.filter(Boolean).join("\n");
}

/** Tool handler that prints the directory tree, respecting .gitignore. */
export const treeToolHandler: ToolHandler = {
  definition: {
    name: "Tree",
    description:
      "Prints the directory structure as a tree, respecting .gitignore. " +
      "Only files tracked by git or untracked-but-not-ignored are included. " +
      "Use an optional path to scope the tree to a subdirectory.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Optional directory to root the tree at. Defaults to the repository root.",
        },
      },
      required: [],
    },
  },
  async execute(input) {
    const targetDir = input.path ? resolve(String(input.path)) : process.cwd();

    try {
      const { stdout } = await execFileAsync(
        "git",
        ["ls-files", "--cached", "--others", "--exclude-standard"],
        { cwd: targetDir },
      );

      const files = stdout
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      if (files.length === 0) {
        return `(empty — no files found in ${targetDir})`;
      }

      // If a path was given that is a subdirectory of the repo, show relative paths
      const repoRoot = (
        await execFileAsync("git", ["rev-parse", "--show-toplevel"], {
          cwd: targetDir,
        })
      ).stdout.trim();
      const displayRoot = relative(repoRoot, targetDir) || ".";

      const tree = buildTree(files);
      return `${displayRoot}/\n${renderTree(tree)}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new Error(`Failed to list directory tree: ${message}`);
    }
  },
};
