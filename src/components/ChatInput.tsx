import React from "react";
import { Box, Text, useStdout } from "ink";
import TextInput from "ink-text-input";

const BOTTOM_LEFT = "╰";
const BOTTOM_RIGHT = "╯";
const HORIZONTAL = "─";

interface InputBottomBorderProps {
  totalTokens: number | null;
}

/** Renders the bottom border of the input box with an optional token label. */
function InputBottomBorder({ totalTokens }: InputBottomBorderProps): React.ReactElement {
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

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  totalTokens: number | null;
}

/** Text input with a bordered frame and token count on the bottom border. */
export default function ChatInput({ value, onChange, onSubmit, totalTokens }: ChatInputProps): React.ReactElement {
  return (
    <>
      <Box marginTop={1} borderStyle="round" borderBottom={false} paddingX={1}>
        <Text bold>&gt; </Text>
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder="Type a message..."
        />
      </Box>
      <InputBottomBorder totalTokens={totalTokens} />
    </>
  );
}
