import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatRequestError,
  enhancePrompt,
  findJobs,
  streamChat,
  suggestReply,
  type ChatMessage,
} from "./chatClient";
import { endsWithQuestion, SUGGEST_TURNS } from "./promptTools";
import {
  clipAppliedJob,
  describeJobResult,
  formatWait,
  MAX_APPLIED_SENT,
} from "./jobs";
import { buildModelHistory } from "./modelHistory";
import { getApplications } from "./useApplications";
import { summarizeFeedback } from "./jobFeedback";
import { getJobFeedback } from "./useJobFeedback";
import { getApplyAnyway } from "./useApplyAnyway";
import type { ChatMode } from "./systemPrompt";

export type ChatStatus = "idle" | "thinking" | "streaming" | "searching";

// A likely reply to the assistant's question, offered as ghost text Tab accepts.
export type ChatSuggestion = { forMessageId: string; text: string };

const storageKey = (mode: ChatMode) => `vscode-chat-history-${mode}`;
// When Ollama's web-search quota runs out, job searches pause until this time (ms).
const JOBS_BLOCKED_KEY = "vscode-chat-jobs-blocked-until";

const readJobsBlockedUntil = () =>
  typeof window === "undefined"
    ? 0
    : Number(window.localStorage.getItem(JOBS_BLOCKED_KEY)) || 0;

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
  const [jobsBlockedUntil, setJobsBlockedUntil] =
    useState(readJobsBlockedUntil);
  const abortRef = useRef<AbortController | null>(null);
  const [suggestion, setSuggestion] = useState<ChatSuggestion | null>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  // Set when the suggestion quota runs out, so no more requests are sent until then.
  const suggestBlockedUntilRef = useRef(0);
  // ✨ uses left today (visitors only); null until the server says.
  const [enhanceRemaining, setEnhanceRemaining] = useState<number | null>(
    null,
  );

  const dropSuggestion = useCallback(() => {
    suggestAbortRef.current?.abort();
    suggestAbortRef.current = null;
    setSuggestion(null);
  }, []);

  // Only answers that end with a question get a suggestion, so most answers cost
  // no extra AI call. Failures are silent: the ghost text just doesn't appear.
  const requestSuggestion = useCallback(
    async (turns: Pick<ChatMessage, "role" | "content">[], forMessageId: string) => {
      if (suggestBlockedUntilRef.current > Date.now()) return;
      const controller = new AbortController();
      suggestAbortRef.current = controller;
      try {
        const result = await suggestReply(turns, passcode, controller.signal);
        if (!controller.signal.aborted && result.suggestion)
          setSuggestion({ forMessageId, text: result.suggestion });
      } catch (caught) {
        if (caught instanceof ChatRequestError && caught.status === 429)
          suggestBlockedUntilRef.current =
            Date.now() + (caught.retryAfter || 60) * 1000;
      } finally {
        if (suggestAbortRef.current === controller)
          suggestAbortRef.current = null;
      }
    },
    [passcode],
  );

  const enhance = useCallback(
    async (text: string) => {
      try {
        const result = await enhancePrompt(text, passcode);
        if (typeof result.remaining === "number")
          setEnhanceRemaining(result.remaining);
        return result;
      } catch (caught) {
        if (caught instanceof ChatRequestError && caught.status === 429)
          setEnhanceRemaining(0);
        throw caught;
      }
    },
    [passcode],
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey(mode), JSON.stringify(messages));
  }, [messages, mode]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      suggestAbortRef.current?.abort();
    },
    [],
  );

  const send = useCallback(
    async (
      text: string,
      { coverLetter }: Pick<ChatMessage, "coverLetter"> = {},
    ) => {
      const content = text.trim();
      if (!content || abortRef.current) return;
      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content,
      };
      const assistantId = createId();
      const history = buildModelHistory(
        [...messages, userMessage],
        getApplications(),
        getJobFeedback(),
        getApplyAnyway(),
      );

      setError("");
      dropSuggestion();
      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: "assistant", content: "", coverLetter },
      ]);
      setStatus("thinking");
      let answer = "";

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
          jobContext: coverLetter
            ? {
                url: coverLetter.url,
                title: coverLetter.title,
                company: coverLetter.company,
              }
            : undefined,
        })) {
          if (event.type === "meta") {
            const { jobDescription } = event;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, jobDescription }
                  : message,
              ),
            );
          }
          if (event.type === "token") {
            setStatus("streaming");
            answer += event.text;
            appendToAssistant(event.text);
          }
        }
        if (endsWithQuestion(answer))
          // Only the last few turns are used for a suggestion; don't send the rest.
          void requestSuggestion(
            [...history, { role: "assistant" as const, content: answer }].slice(
              -SUGGEST_TURNS,
            ),
            assistantId,
          );
      } catch (caught) {
        // An unfinished answer (stopped or failed, even before the first word) can't be
        // sent as a letter.
        setMessages((current) =>
          current.map((entry) =>
            entry.id === assistantId ? { ...entry, incomplete: true } : entry,
          ),
        );
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
    [messages, mode, onUnauthorized, passcode, dropSuggestion, requestSuggestion],
  );

  const blockJobSearch = useCallback((seconds: number) => {
    const until = Date.now() + seconds * 1000;
    window.localStorage.setItem(JOBS_BLOCKED_KEY, String(until));
    setJobsBlockedUntil(until);
  }, []);

  const searchJobs = useCallback(
    async (query: string, { fresh = false } = {}) => {
      if (abortRef.current || mode !== "owner" || !passcode) return;
      const hasResults = messages.some((message) => message.jobs?.jobs.length);
      const keepNote = hasResults ? " Your last results are still above." : "";
      if (jobsBlockedUntil > Date.now()) {
        setError(
          `Web search is cooling down (Ollama free plan limit). Available again in ${formatWait((jobsBlockedUntil - Date.now()) / 1000)}.${keepNote}`,
        );
        return;
      }
      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: query
          ? `Find job openings that fit me: ${query}`
          : "Find job openings that fit me",
      };
      const assistantId = createId();
      setError("");
      dropSuggestion();
      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setStatus("searching");

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const result = await findJobs({
          query,
          passcode,
          fresh,
          preferences: summarizeFeedback(getJobFeedback()),
          // Newest first, so the most recent applications are the ones sent.
          applied: [...getApplications()]
            .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
            .slice(0, MAX_APPLIED_SENT)
            .map(clipAppliedJob),
          signal: controller.signal,
        });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: describeJobResult(result), jobs: result }
              : message,
          ),
        );
        if (result.partial) {
          // A search failed mid-run: show what was found, and pause if it was the quota.
          if (result.retryAfter) blockJobSearch(result.retryAfter);
          setError(
            result.retryAfter
              ? `Only some searches ran before Ollama's free web-search limit was reached, so these results are partial. Search again in ${formatWait(result.retryAfter)} for the full list.`
              : "One of the web searches failed, so these results are partial. Search again for the full list.",
          );
        }
      } catch (caught) {
        setMessages((current) =>
          current.filter((entry) => entry.id !== assistantId),
        );
        if (!controller.signal.aborted) {
          const message =
            caught instanceof Error ? caught.message : "Job search failed.";
          // Only Ollama's quota pauses all searches; the Worker's per-visitor limit
          // still lets cached results through, so it just shows the message.
          if (
            caught instanceof ChatRequestError &&
            caught.quota &&
            caught.retryAfter > 0
          ) {
            blockJobSearch(caught.retryAfter);
            setError(`${message}${keepNote}`);
          } else {
            setError(message);
          }
          if (caught instanceof ChatRequestError && caught.status === 403)
            onUnauthorized?.();
        }
      } finally {
        abortRef.current = null;
        setStatus("idle");
      }
    },
    [
      blockJobSearch,
      dropSuggestion,
      jobsBlockedUntil,
      messages,
      mode,
      onUnauthorized,
      passcode,
    ],
  );

  // Tracker for applied jobs; the model sees it as a list (see modelHistory.ts).
  const showApplications = useCallback(() => {
    if (abortRef.current || mode !== "owner") return;
    setError("");
    setMessages((current) => [
      ...current.filter((message) => !message.applications),
      {
        id: createId(),
        role: "assistant",
        content: "Your tracked job applications.",
        applications: true,
      },
    ]);
  }, [mode]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    dropSuggestion();
    setMessages([]);
    setError("");
  }, [dropSuggestion]);

  return {
    messages,
    status,
    error,
    send,
    searchJobs,
    showApplications,
    jobsBlockedUntil,
    stop,
    clear,
    suggestion,
    dismissSuggestion: dropSuggestion,
    enhance,
    enhanceRemaining,
  };
};
