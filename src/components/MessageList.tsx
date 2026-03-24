import React from "react";
import { Box, Text } from "ink";

export interface Message {
  role: "user" | "assistant";
  type?: "tool";
  text: string;
}

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

/** Displays the conversation history with a loading indicator. */
export default function MessageList({ messages, loading }: MessageListProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      {messages.map((msg, i) => (
        <Box key={i} marginTop={i > 0 ? 1 : 0}>
          {msg.type === "tool" ? (
            <Text dimColor italic>
              {msg.text}
            </Text>
          ) : (
            <Text color={msg.role === "user" ? "green" : "white"}>
              <Text bold>{msg.role === "user" ? "you" : "assistant"}&gt; </Text>
              {msg.text}
            </Text>
          )}
        </Box>
      ))}

      {loading && (
        <Text dimColor italic>
          thinking...
        </Text>
      )}
    </Box>
  );
}
