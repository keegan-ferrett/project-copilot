import React from "react";
import { Box, Text, useStdout } from "ink";
import type { CommandHandler } from "../commands/types.js";

interface CommandHintsProps {
  matches: CommandHandler[];
  selectedIndex: number;
}

/** Displays a filtered list of slash command suggestions below the input. */
export default function CommandHints({ matches, selectedIndex }: CommandHintsProps): React.ReactElement | null {
  const { stdout } = useStdout();

  if (matches.length === 0) return null;

  const nameColumnWidth = Math.max(...matches.map((cmd) => cmd.name.length + 1)) + 4;
  const maxDescWidth = Math.max(0, stdout.columns - nameColumnWidth - 6);

  return (
    <Box flexDirection="column" paddingX={2} marginTop={0}>
      {matches.map((cmd, i) => {
        const desc = cmd.description.length > maxDescWidth
          ? cmd.description.slice(0, maxDescWidth - 1) + "\u2026"
          : cmd.description;
        const isSelected = i === selectedIndex;

        return (
          <Box key={cmd.name} gap={1}>
            <Text dimColor={!isSelected} bold={isSelected} color={isSelected ? "cyan" : undefined}>
              <Text>{"/" + cmd.name}</Text>
              {" ".repeat(Math.max(1, nameColumnWidth - cmd.name.length - 1))}
              <Text>{desc}</Text>
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
