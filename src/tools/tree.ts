import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, relative, join, basename } from "node:path";
import type { ToolHandler } from "./types.js";

interface TreeNode {
  [name: string]: TreeNode;
}

/**
 * Parses a .gitignore file into a list of ignore patterns.
 * Supports negation (!), comments (#), directory-only markers (/), and wildcards.
 */
function parseGitignore(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

/**
 * Tests whether a file or directory name matches a single gitignore pattern.
 * Supports basic glob matching: `*` (any chars), `?` (single char), leading `/`,
 * trailing `/`, and negation via `!` prefix.
 */
function matchesPattern(
  entryPath: string,
  isDirectory: boolean,
  pattern: string,
): boolean {
  let pat = pattern;

  // Negation patterns are handled by the caller
  if (pat.startsWith("!")) return false;

  // A trailing slash means the pattern only matches directories
  const dirOnly = pat.endsWith("/");
  if (dirOnly) {
    if (!isDirectory) return false;
    pat = pat.slice(0, -1);
  }

  // If the pattern contains no slash (other than a leading one removed below)
  // it matches against just the basename; otherwise it matches the full path.
  const hasSlash = pat.includes("/");
  if (pat.startsWith("/")) {
    pat = pat.slice(1);
  }

  const target = hasSlash ? entryPath : basename(entryPath);

  return globMatch(target, pat);
}

/** Converts a gitignore glob pattern to a RegExp and tests the target string. */
function globMatch(target: string, pattern: string): boolean {
  // Build a regex from the glob pattern
  let regex = "^";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        // ** matches everything including path separators
        if (pattern[i + 2] === "/") {
          regex += "(.+/)?";
          i += 3;
        } else {
          regex += ".*";
          i += 2;
        }
      } else {
        // * matches anything except /
        regex += "[^/]*";
        i++;
      }
    } else if (ch === "?") {
      regex += "[^/]";
      i++;
    } else if (ch === "[") {
      // Pass through character class
      const close = pattern.indexOf("]", i);
      if (close === -1) {
        regex += "\\[";
        i++;
      } else {
        regex += pattern.slice(i, close + 1);
        i = close + 1;
      }
    } else {
      regex += ch.replace(/[\\^$.|+(){}]/g, "\\$&");
      i++;
    }
  }
  regex += "$";
  return new RegExp(regex).test(target);
}

/**
 * Determines whether an entry should be ignored based on a list of gitignore patterns.
 * Patterns are evaluated in order; later patterns override earlier ones.
 */
function isIgnored(
  entryRelPath: string,
  isDirectory: boolean,
  patterns: string[],
): boolean {
  let ignored = false;
  for (const pattern of patterns) {
    if (pattern.startsWith("!")) {
      // Negation: un-ignore if the rest of the pattern matches
      if (matchesPattern(entryRelPath, isDirectory, pattern.slice(1))) {
        ignored = false;
      }
    } else if (matchesPattern(entryRelPath, isDirectory, pattern)) {
      ignored = true;
    }
  }
  return ignored;
}

/** Reads and parses a .gitignore file, returning an empty array if none exists. */
async function loadGitignore(dirPath: string): Promise<string[]> {
  try {
    const content = await readFile(join(dirPath, ".gitignore"), "utf-8");
    return parseGitignore(content);
  } catch {
    return [];
  }
}

/** Default directory names that are always ignored (common non-project dirs). */
const ALWAYS_IGNORED = new Set([".git"]);

/**
 * Recursively walks a directory, collecting relative file paths while
 * respecting .gitignore files found at each level of the tree.
 */
async function walkDirectory(
  rootDir: string,
  currentDir: string,
  parentPatterns: string[],
): Promise<string[]> {
  const localPatterns = await loadGitignore(currentDir);
  const patterns = [...parentPatterns, ...localPatterns];

  const entries = await readdir(currentDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (ALWAYS_IGNORED.has(entry.name)) continue;

    const fullPath = join(currentDir, entry.name);
    const relPath = relative(rootDir, fullPath);
    const isDir = entry.isDirectory();

    if (isIgnored(relPath, isDir, patterns)) continue;

    if (isDir) {
      const children = await walkDirectory(rootDir, fullPath, patterns);
      results.push(...children);
    } else {
      results.push(relPath);
    }
  }

  return results;
}

/** Builds a nested object representing the directory tree from a list of file paths. */
function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = {};
  for (const filePath of paths) {
    const parts = filePath.split("/");
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

/** Tool handler that prints the directory tree, respecting .gitignore files. */
export const treeToolHandler: ToolHandler = {
  definition: {
    name: "Tree",
    description:
      "Prints the directory structure as a tree, respecting .gitignore rules. " +
      "Walks the filesystem directly and filters entries using .gitignore files " +
      "found at each directory level. Use an optional path to scope the tree to a subdirectory.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Optional directory to root the tree at. Defaults to the current working directory.",
        },
      },
      required: [],
    },
  },
  async execute(input) {
    const targetDir = input.path ? resolve(String(input.path)) : process.cwd();

    try {
      await stat(targetDir);
    } catch {
      throw new Error(`Directory does not exist: ${targetDir}`);
    }

    const rootPatterns = await loadGitignore(targetDir);
    const files = await walkDirectory(targetDir, targetDir, rootPatterns);

    if (files.length === 0) {
      return `(empty — no files found in ${targetDir})`;
    }

    const displayRoot = basename(targetDir) || ".";
    const tree = buildTree(files);
    return `${displayRoot}/\n${renderTree(tree)}`;
  },
};
