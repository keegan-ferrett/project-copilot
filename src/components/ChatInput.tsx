import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Box, Text, useStdout, useInput } from "ink";
import TextInput from "ink-text-input";
import CommandHints from "./CommandHints.js";
import type { CommandHandler } from "../commands/types.js";

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
  commands: CommandHandler[];
}

/** Text input with a bordered frame, command hints, and token count on the bottom border. */
export default function ChatInput({ value, onChange, onSubmit, totalTokens, commands }: ChatInputProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputKey, setInputKey] = useState(0);

  const showHints = value.startsWith("/") && !value.includes(" ");

  const matches = useMemo(() => {
    if (!showHints) return [];
    const query = value.slice(1);
    return commands.filter((cmd) => cmd.name.startsWith(query));
  }, [showHints, value, commands]);

  // Reset selection when the input changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [value]);

  /** Fills the selected (or given) command into the input and closes hints. */
  const acceptHint = useCallback(
    (index: number) => {
      const match = matches[index];
      if (!match) return;
      onChange("/" + match.name + " ");
      setSelectedIndex(-1);
      // Force TextInput to remount so its internal cursor resets to end of value
      setInputKey((k) => k + 1);
    },
    [matches, onChange],
  );

  // Handle arrow key and Tab navigation in the hints list
  useInput((_input, key) => {
    if (!showHints || matches.length === 0) return;

    if (key.downArrow) {
      setSelectedIndex((prev) =>
        prev < matches.length - 1 ? prev + 1 : 0,
      );
    } else if (key.upArrow) {
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : matches.length - 1,
      );
    } else if (key.tab) {
      // Tab accepts the currently selected hint, or the first match if none selected
      acceptHint(selectedIndex >= 0 ? selectedIndex : 0);
    }
  });

  // Intercept submit: fill the selected hint or block bare-/ submit while hints are visible
  const handleSubmit = useCallback(
    (val: string) => {
      if (showHints && matches.length > 0) {
        if (selectedIndex >= 0) {
          acceptHint(selectedIndex);
        }
        return;
      }
      onSubmit(val);
    },
    [showHints, selectedIndex, matches, acceptHint, onSubmit],
  );

  return (
    <>
      <Box marginTop={1} borderStyle="round" borderBottom={false} paddingX={1}>
        <Text bold>&gt; </Text>
        <TextInput
          key={inputKey}
          value={value}
          onChange={onChange}
          onSubmit={handleSubmit}
          placeholder="Type a message..."
        />
      </Box>
      <InputBottomBorder totalTokens={totalTokens} />
      {showHints && <CommandHints matches={matches} selectedIndex={selectedIndex} />}
    </>
  );
}
