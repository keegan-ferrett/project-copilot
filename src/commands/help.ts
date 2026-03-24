import type { CommandHandler } from "./types.js";
import { commandList } from "./index.js";

/** Lists all available slash commands. */
export const helpCommandHandler: CommandHandler = {
  name: "help",
  description: "List available slash commands",
  execute: async () => {
    const lines = commandList().map(
      (cmd) => `  /${cmd.name} — ${cmd.description}`,
    );
    return {
      type: "action",
      message: `Available commands:\n${lines.join("\n")}`,
    };
  },
};
