import React, { useState, useCallback, useEffect } from "react";
import { Box, Text } from "ink";
import Anthropic from "@anthropic-ai/sdk";
import MessageList, { type Message } from "./components/MessageList.js";
import ChatInput from "./components/ChatInput.js";
import { toolDefinitions, executeTool } from "./tools/index.js";
import {
  isCommand,
  parseCommand,
  executeCommand,
} from "./commands/index.js";
import { loadSystemPrompt, loadProjectContext } from "./system-prompt.js";
import { getProjectPath } from "./projects/index.js";

interface TokenUsage {
  input: number;
  output: number;
}

interface AppProps {
  projectName: string;
  systemPromptPath?: string;
}

const client = new Anthropic();

/** Main application component rendering a chat TUI. */
export default function App({ projectName, systemPromptPath }: AppProps): React.ReactElement {
  const projectPath = getProjectPath(projectName);

  const [messages, setMessages] = useState<Message[]>([]);
  const [apiMessages, setApiMessages] = useState<Anthropic.MessageParam[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string | undefined>();

  useEffect(() => {
    async function init() {
      let prompt = "";

      if (systemPromptPath) {
        try {
          prompt = await loadSystemPrompt(systemPromptPath);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: `Failed to load system prompt: ${msg}` },
          ]);
        }
      }

      const projectContext = await loadProjectContext(process.cwd());
      if (projectContext) {
        prompt = prompt
          ? `${prompt}\n\n# Project Context\n\n${projectContext}`
          : projectContext;
      }

      if (prompt) {
        setSystemPrompt(prompt);
      }
    }

    init();
  }, [systemPromptPath]);

  const handleSubmit = useCallback(
    async (value: string) => {
      let trimmed = value.trim();
      if (!trimmed || loading) return;

      setInput("");

      // Slash command handling
      if (isCommand(trimmed)) {
        const { name, args } = parseCommand(trimmed);
        setMessages((prev) => [...prev, { role: "user", text: trimmed }]);

        const result = await executeCommand(name, args, {
          messages,
          setMessages,
          apiMessages,
          setApiMessages,
        });

        if (result.type === "action") {
          if (result.message) {
            const text = result.message;
            setMessages((prev) => [
              ...prev,
              { role: "assistant" as const, type: "command" as const, text },
            ]);
          }
          return;
        }

        // Prompt commands — send the generated prompt to the API
        trimmed = result.prompt;
      }

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
          ...(systemPrompt ? { system: systemPrompt } : {}),
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
            ...(systemPrompt ? { system: systemPrompt } : {}),
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
    [apiMessages, loading, systemPrompt],
  );

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        PM Copilot — {projectName}
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
