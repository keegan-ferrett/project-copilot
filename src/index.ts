import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new Anthropic();

/** Runs an interactive conversation loop with Claude. */
async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  const messages: Anthropic.MessageParam[] = [];

  console.log("PM Copilot — type your message, or 'exit' to quit.\n");

  while (true) {
    const userInput = await rl.question("you> ");

    if (userInput.trim().toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    messages.push({ role: "user", content: userInput });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages,
    });

    const assistantText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const { input_tokens, output_tokens } = response.usage;
    console.log(`\nassistant> ${assistantText}`);
    console.log(`[tokens — input: ${input_tokens}, output: ${output_tokens}, total: ${input_tokens + output_tokens}]\n`);

    messages.push({ role: "assistant", content: response.content });
  }
}

main();
