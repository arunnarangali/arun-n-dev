import { useCallback, useEffect, useRef, useState } from "react";
import { ChatRequestError, streamChat, type ChatMessage } from "./chatClient";
import type { ChatMode } from "./systemPrompt";

// Only the most recent turns are sent, to keep requests small.
const HISTORY_LIMIT = 12;

export type ChatStatus = "idle" | "thinking" | "streaming";

const storageKey = (mode: ChatMode) => `vscode-chat-history-${mode}`;

const createId = () =>
  `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const readHistory = (mode: ChatMode): ChatMessage[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(storageKey(mode)) ?? "[]",
    );
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

export const useChat = (
  mode: ChatMode,
  passcode?: string,
  onUnauthorized?: () => void,
) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    readHistory(mode),
  );
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey(mode), JSON.stringify(messages));
  }, [messages, mode]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || abortRef.current) return;
      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content,
      };
      const assistantId = createId();
      const history = [...messages, userMessage].slice(-HISTORY_LIMIT);

      setError("");
      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setStatus("thinking");

      const controller = new AbortController();
      abortRef.current = controller;
      const appendToAssistant = (chunk: string) =>
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + chunk }
              : message,
          ),
        );

      try {
        for await (const event of streamChat({
          messages: history,
          mode,
          passcode,
          signal: controller.signal,
        })) {
          if (event.type === "token") {
            setStatus("streaming");
            appendToAssistant(event.text);
          }
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          appendToAssistant("\n\n_Stopped._");
        } else {
          const message =
            caught instanceof Error ? caught.message : "Something went wrong.";
          setError(message);
          setMessages((current) =>
            current.filter(
              (entry) => entry.id !== assistantId || entry.content,
            ),
          );
          if (
            caught instanceof ChatRequestError &&
            caught.status === 403 &&
            mode === "owner"
          )
            onUnauthorized?.();
        }
      } finally {
        abortRef.current = null;
        setStatus("idle");
      }
    },
    [messages, mode, onUnauthorized, passcode],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError("");
  }, []);

  return { messages, status, error, send, stop, clear };
};
