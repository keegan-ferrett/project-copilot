import React, { useState, useCallback } from "react";
import { Box, Text } from "ink";
import Anthropic from "@anthropic-ai/sdk";
import MessageList, { type Message } from "./components/MessageList.js";
import ChatInput from "./components/ChatInput.js";

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
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: nextApiMessages,
        });

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
          ...nextApiMessages,
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
