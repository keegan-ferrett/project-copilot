import "dotenv/config";
import React from "react";
import { render } from "ink";
import App from "./App.js";
import { runCli } from "./cli.js";
import { executeTool, toolDefinitions } from "./tools/index.js";

/**
 * Coerces a raw string value to the type declared in a tool's input_schema.
 * Falls back to the original string when the property is unknown.
 */
function coerceValue(
  schema: Record<string, unknown>,
  key: string,
  raw: string,
): unknown {
  const properties = schema.properties as
    | Record<string, { type?: string }>
    | undefined;
  const propType = properties?.[key]?.type;

  if (propType === "number" || propType === "integer") return Number(raw);
  if (propType === "boolean") return raw === "true";
  return raw;
}

/**
 * Parses repeated `--input key=value` pairs into a typed object,
 * using the tool's input_schema for type coercion.
 */
function buildToolInput(
  rawInputs: string[],
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const entry of rawInputs) {
    const eqIndex = entry.indexOf("=");
    const key = entry.slice(0, eqIndex);
    const value = entry.slice(eqIndex + 1);
    input[key] = coerceValue(schema, key, value);
  }
  return input;
}

const options = runCli(process.argv.slice(2));

if (options.toolRun) {
  const { name, rawInputs } = options.toolRun;

  const definition = toolDefinitions().find((t) => t.name === name);
  if (!definition) {
    const available = toolDefinitions()
      .map((t) => t.name)
      .join(", ");
    console.error(`Unknown tool "${name}". Available tools: ${available}`);
    process.exit(1);
  }

  const schema = definition.input_schema as Record<string, unknown>;
  const input = buildToolInput(rawInputs, schema);

  const properties = schema.properties as
    | Record<string, { type?: string; description?: string }>
    | undefined;
  const required = (schema.required as string[] | undefined) ?? [];
  const accepted = Object.keys(properties ?? {});

  // Warn on unrecognised input keys.
  const unknown = Object.keys(input).filter((k) => !accepted.includes(k));
  if (unknown.length) {
    console.error(
      `Unknown input${unknown.length > 1 ? "s" : ""} for tool "${name}": ${unknown.join(", ")}`,
    );
    if (accepted.length) {
      const paramList = accepted
        .map((k) => {
          const req = required.includes(k) ? " (required)" : "";
          const desc = properties?.[k]?.description;
          return `  ${k}${req}${desc ? ` — ${desc}` : ""}`;
        })
        .join("\n");
      console.error(`Accepted inputs:\n${paramList}`);
    }
    process.exit(1);
  }

  // Check for missing required inputs.
  const missing = required.filter((k) => !(k in input));
  if (missing.length) {
    console.error(
      `Missing required input${missing.length > 1 ? "s" : ""} for tool "${name}": ${missing.join(", ")}`,
    );
    if (accepted.length) {
      const paramList = accepted
        .map((k) => {
          const req = required.includes(k) ? " (required)" : "";
          const desc = properties?.[k]?.description;
          return `  ${k}${req}${desc ? ` — ${desc}` : ""}`;
        })
        .join("\n");
      console.error(`Accepted inputs:\n${paramList}`);
    }
    process.exit(1);
  }

  try {
    const result = await executeTool(name, input);
    process.stdout.write(result);
    if (!result.endsWith("\n")) process.stdout.write("\n");
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
} else {
  render(
    React.createElement(App, {
      systemPromptPath: options.systemPromptPath,
    }),
  );
}
