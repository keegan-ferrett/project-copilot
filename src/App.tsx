import React, { useState, useCallback } from "react";
import { Box, Text, useStdout } from "ink";
import TextInput from "ink-text-input";
import Anthropic from "@anthropic-ai/sdk";

// Round border characters from cli-boxes
const BOTTOM_LEFT = "╰";
const BOTTOM_RIGHT = "╯";
const HORIZONTAL = "─";

/** Renders the bottom border of the input box with an optional token label. */
function InputBottomBorder({ totalTokens }: { totalTokens: number | null }): React.ReactElement {
  const { stdout } = useStdout();
  const width = stdout.columns;
  const label = totalTokens !== null ? ` tokens: ${totalTokens} ` : "";
  const lineLength = Math.max(0, width - 2 - label.length);

  return (
    <Text>
      {BOTTOM_LEFT}
      {HORIZONTAL.repeat(lineLength)}
      {label && <Text dimColor>{label}</Text>}
      {BOTTOM_RIGHT}
    </Text>
  );
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

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

      {messages.map((msg, i) => (
        <Box key={i} marginTop={i > 0 ? 1 : 0}>
          <Text color={msg.role === "user" ? "green" : "white"}>
            <Text bold>{msg.role === "user" ? "you" : "assistant"}&gt; </Text>
            {msg.text}
          </Text>
        </Box>
      ))}

      {loading && (
        <Text dimColor italic>
          thinking...
        </Text>
      )}

      <Box marginTop={1} borderStyle="round" borderBottom={false} paddingX={1}>
        <Text bold>&gt; </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Type a message..."
        />
      </Box>
      <InputBottomBorder totalTokens={tokens ? tokens.input + tokens.output : null} />
    </Box>
  );
}
