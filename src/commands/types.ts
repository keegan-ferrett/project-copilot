import type { Message } from "../components/MessageList.js";
import type Anthropic from "@anthropic-ai/sdk";

/** State and setters available to command handlers. */
export interface CommandContext {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  apiMessages: Anthropic.MessageParam[];
  setApiMessages: React.Dispatch<React.SetStateAction<Anthropic.MessageParam[]>>;
  systemPrompt?: string;
}

/**
 * Result returned by a command handler.
 * - prompt commands return `{ prompt }` — the text is sent to the AI as a user message.
 * - action commands return `{ message? }` — an optional status message shown in chat.
 */
export type CommandResult =
  | { type: "prompt"; prompt: string }
  | { type: "action"; message?: string };

/** Describes a slash command's metadata and executor. */
export interface CommandHandler {
  name: string;
  description: string;
  execute: (args: string[], context: CommandContext) => Promise<CommandResult>;
}
