import type { CommandHandler } from "./types.js";

/** Clears the chat history and resets API context. */
export const clearCommandHandler: CommandHandler = {
  name: "clear",
  description: "Clear chat history",
  execute: async (_args, ctx) => {
    ctx.setMessages([]);
    ctx.setApiMessages([]);
    return { type: "action" };
  },
};
