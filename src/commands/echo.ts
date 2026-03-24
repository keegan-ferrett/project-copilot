import type { CommandHandler } from "./types.js";

/** Echoes the provided arguments back into the chat. */
export const echoCommandHandler: CommandHandler = {
  name: "echo",
  description: "Echo a message back into the chat",
  execute: async (args) => {
    return {
      type: "action",
      message: args.join(" ") || "(empty)",
    };
  },
};
