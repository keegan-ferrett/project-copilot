import React, { useState, useCallback } from "react";
import { Box, Text } from "ink";
import Anthropic from "@anthropic-ai/sdk";
import MessageList, { type Message } from "./components/MessageList.js";
import ChatInput from "./components/ChatInput.js";
import { toolDefinitions, executeTool } from "./tools/index.js";

interface TokenUsage {
  input: number;
  output: number;
}

const client = new Anthropic();

/** Main application component rendering a chat TUI. */
export default function App(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiMessages, setApiMessages] = useState<Anthropic.MessageParam[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);

  const handleSubmit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || loading) return;

      setInput("");
      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);

      const nextApiMessages: Anthropic.MessageParam[] = [
        ...apiMessages,
        { role: "user", content: trimmed },
      ];

      setLoading(true);

      try {
        let currentMessages = nextApiMessages;
        let response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          tools: toolDefinitions(),
          messages: currentMessages,
        });

        // Loop while the model wants to use tools
        while (response.stop_reason === "tool_use") {
          const toolUseBlocks = response.content.filter(
            (block): block is Anthropic.ToolUseBlock =>
              block.type === "tool_use",
          );

          const toolResults: Anthropic.ToolResultBlockParam[] =
            await Promise.all(
              toolUseBlocks.map(async (block) => {
                try {
                  const result = await executeTool(
                    block.name,
                    block.input as Record<string, unknown>,
                  );
                  return {
                    type: "tool_result" as const,
                    tool_use_id: block.id,
                    content: result,
                  };
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "Unknown error";
                  return {
                    type: "tool_result" as const,
                    tool_use_id: block.id,
                    content: message,
                    is_error: true,
                  };
                }
              }),
            );

          // Show tool usage in chat
          for (const block of toolUseBlocks) {
            const input = block.input as Record<string, unknown>;
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                type: "tool",
                text: `[tool: ${block.name}] ${input.file_path ?? ""}`,
              },
            ]);
          }

          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: response.content },
            { role: "user", content: toolResults },
          ];

          response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            tools: toolDefinitions(),
            messages: currentMessages,
          });
        }

        const assistantText = response.content
          .filter(
            (block): block is Anthropic.TextBlock => block.type === "text",
          )
          .map((block) => block.text)
          .join("\n");

        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: assistantText },
        ]);
        setApiMessages([
          ...currentMessages,
          { role: "assistant", content: response.content },
        ]);
        setTokens({
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `Error: ${errorMessage}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [apiMessages, loading],
  );

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        PM Copilot
      </Text>
      <Text dimColor>────────────────────────────────</Text>

      <MessageList messages={messages} loading={loading} />
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        totalTokens={tokens ? tokens.input + tokens.output : null}
      />
    </Box>
  );
}
