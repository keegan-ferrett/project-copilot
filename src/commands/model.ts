import type { CommandHandler } from "./types.js";

/** Opens an interactive model selector to switch the active Claude model. */
export const modelCommandHandler: CommandHandler = {
  name: "model",
  description: "Switch the AI model",
  execute: async (_args, ctx) => {
    ctx.setShowModelSelector?.(true);
    return { type: "action" };
  },
};
