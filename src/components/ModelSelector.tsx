import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

/** Available Claude models with display labels. */
export const CLAUDE_MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { id: "claude-opus-4-6", label: "Opus 4.6" },
] as const;

export type ModelId = (typeof CLAUDE_MODELS)[number]["id"];

/** Returns the display label for a model ID. */
export function modelLabel(id: string): string {
  return CLAUDE_MODELS.find((m) => m.id === id)?.label ?? id;
}

interface ModelSelectorProps {
  currentModel: string;
  onSelect: (modelId: ModelId) => void;
  onCancel: () => void;
}

/** Arrow-key navigable model selector shown in place of the chat input. */
export default function ModelSelector({
  currentModel,
  onSelect,
  onCancel,
}: ModelSelectorProps): React.ReactElement {
  const initialIndex = CLAUDE_MODELS.findIndex((m) => m.id === currentModel);
  const [selectedIndex, setSelectedIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0,
  );

  useInput((_input, key) => {
    if (key.downArrow) {
      setSelectedIndex((i) => (i < CLAUDE_MODELS.length - 1 ? i + 1 : 0));
    } else if (key.upArrow) {
      setSelectedIndex((i) => (i > 0 ? i - 1 : CLAUDE_MODELS.length - 1));
    } else if (key.return) {
      onSelect(CLAUDE_MODELS[selectedIndex].id);
    } else if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" marginTop={1} paddingX={1}>
      <Text bold>Select a model:</Text>
      <Text dimColor>Use arrow keys to navigate, Enter to select, Esc to cancel</Text>
      <Box flexDirection="column" marginTop={1}>
        {CLAUDE_MODELS.map((model, i) => {
          const isCurrent = model.id === currentModel;
          const isSelected = i === selectedIndex;
          return (
            <Text key={model.id}>
              {isSelected ? ">" : " "}{" "}
              <Text bold={isSelected} color={isSelected ? "cyan" : undefined}>
                {model.label}
              </Text>
              {isCurrent && <Text dimColor> (current)</Text>}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
