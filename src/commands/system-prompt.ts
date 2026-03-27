import type { CommandHandler } from "./types.js";

/** Displays the current system prompt. Only available in dev mode. */
export const systemPromptCommandHandler: CommandHandler = {
  name: "system-prompt",
  description: "Display the system prompt sent to the AI (dev only)",
  execute: async (_args, context) => {
    return {
      type: "action",
      message: context.systemPrompt ?? "(no system prompt loaded)",
    };
  },
};
