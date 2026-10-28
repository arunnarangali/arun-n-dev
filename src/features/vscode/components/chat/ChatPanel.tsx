import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { OwnerVerification } from "./OwnerVerification";
import { useChat } from "../../../../portfolio/ai/useChat";
import { parseChatInput } from "../../../../portfolio/ai/slashCommands";
import type { ChatMode } from "../../../../portfolio/ai/systemPrompt";
import { aboutContent } from "../../../../portfolio/content";

// Kept for the browser session only, so closing the tab locks owner mode again.
const PASSCODE_KEY = "vscode-chat-owner-passcode";
const firstName = aboutContent.name.split(" ")[0];

const suggestedPrompts: Record<ChatMode, string[]> = {
  public: [
    `What does ${firstName} specialize in?`,
    "Which projects use Golang?",
    `Is ${firstName} a good fit for a senior React role?`,
    `How can I contact ${firstName}?`,
  ],
  owner: [
    "Draft a cover letter for a Senior React Developer role",
    "Rewrite my project descriptions to be more concise",
    "Give me 5 interview questions about my Kafka experience",
    "What skills should I add for a full-stack role?",
  ],
};

export type PendingChatInput = { id: number; text: string };

type ChatPanelProps = {
  variant?: "sidebar" | "overlay";
  onClose: () => void;
  onOpenFile: (id: string) => void;
  pendingInput?: PendingChatInput | null;
  onPendingConsumed?: () => void;
  focusSignal?: number;
};

export const ChatPanel = (props: ChatPanelProps) => {
  const [passcode, setPasscode] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (window.sessionStorage.getItem(PASSCODE_KEY) ?? ""),
  );
  const [isVerifying, setVerifying] = useState(false);
  const mode: ChatMode = passcode ? "owner" : "public";

  const updatePasscode = useCallback((value: string) => {
    if (value) window.sessionStorage.setItem(PASSCODE_KEY, value);
    else window.sessionStorage.removeItem(PASSCODE_KEY);
    setPasscode(value);
  }, []);

  const requestUnlock = useCallback(() => setVerifying(true), []);
  const lock = useCallback(() => updatePasscode(""), [updatePasscode]);
  const handleUnauthorized = useCallback(() => {
    updatePasscode("");
    setVerifying(true);
  }, [updatePasscode]);

  return (
    <div className="flex h-full w-full min-w-0 flex-col bg-surface-container-low font-sans">
      {isVerifying ? (
        <OwnerVerification
          onCancel={() => setVerifying(false)}
          onGranted={(code) => {
            updatePasscode(code);
            setVerifying(false);
          }}
        />
      ) : (
        <ChatSession
          key={mode}
          {...props}
          mode={mode}
          passcode={passcode}
          onRequestUnlock={requestUnlock}
          onLock={lock}
          onUnauthorized={handleUnauthorized}
        />
      )}
    </div>
  );
};

type ChatSessionProps = ChatPanelProps & {
  mode: ChatMode;
  passcode: string;
  onRequestUnlock: () => void;
  onLock: () => void;
  onUnauthorized: () => void;
};

const ChatSession = ({
  variant = "sidebar",
  onClose,
  onOpenFile,
  pendingInput,
  onPendingConsumed,
  focusSignal,
  mode,
  passcode,
  onRequestUnlock,
  onLock,
  onUnauthorized,
}: ChatSessionProps) => {
  const { messages, status, error, send, stop, clear } = useChat(
    mode,
    passcode,
    onUnauthorized,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const isBusy = status !== "idle";
  const isOwner = mode === "owner";

  const handleSubmit = useCallback(
    (raw: string) => {
      const parsed = parseChatInput(raw);
      if (parsed.kind === "prompt") {
        void send(parsed.text);
        return;
      }
      if (parsed.name === "clear") clear();
      if (parsed.name === "owner" && !isOwner) onRequestUnlock();
      if (parsed.name === "public" && isOwner) onLock();
    },
    [clear, isOwner, onLock, onRequestUnlock, send],
  );

  useEffect(() => {
    if (!pendingInput || isBusy) return;
    handleSubmit(pendingInput.text);
    onPendingConsumed?.();
  }, [handleSubmit, isBusy, onPendingConsumed, pendingInput]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages]);

  const headerButton =
    "rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-accent";

  return (
    <>
      <div className="flex h-9 shrink-0 items-center justify-between px-3 text-[11px] uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span className="font-bold text-on-surface-variant/80">Chat</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${isOwner ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}
            title={
              isOwner
                ? "Owner mode: JARVIS, your private assistant"
                : "Answers questions about this portfolio"
            }
          >
            {isOwner ? "JARVIS" : `Ask ${firstName}`}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={clear} className={headerButton} title="New chat">
            <Icon name="add" className="text-[16px]" />
          </button>
          <button
            onClick={isOwner ? onLock : onRequestUnlock}
            className={headerButton}
            title={isOwner ? "Lock owner mode" : "Unlock owner mode"}
          >
            <Icon
              name={isOwner ? "lock" : "shield_person"}
              className="text-[16px]"
            />
          </button>
          <button onClick={onClose} className={headerButton} title="Close chat">
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="vscode-scrollbar min-h-0 flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Icon name="smart_toy" className="text-[26px]" />
            </span>
            <h2 className="text-sm font-semibold text-on-surface">
              {isOwner
                ? `At your service, ${firstName}.`
                : `Ask me anything about ${firstName}`}
            </h2>
            <p className="mt-1 text-[12px] text-on-surface-variant">
              {isOwner
                ? "JARVIS online. Your profile is loaded as context."
                : "Projects, skills, experience or how to get in touch."}
            </p>
            <div className="mt-5 flex w-full flex-col gap-2">
              {suggestedPrompts[mode].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void send(prompt)}
                  className="rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-left text-[12px] text-on-surface transition-colors hover:border-primary hover:text-accent"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isPending={isBusy && index === messages.length - 1}
              onOpenFile={(id) => {
                onOpenFile(id);
                if (variant === "overlay") onClose();
              }}
            />
          ))
        )}
        {error && (
          <div className="mx-3 my-3 flex items-start gap-2 rounded border border-error/40 bg-error/10 px-3 py-2 text-[12px] text-on-surface">
            <Icon name="error" className="text-[16px] text-error" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <ChatInput
        isBusy={isBusy}
        placeholder={
          isOwner ? "Ask JARVIS anything…" : `Ask about ${firstName}…`
        }
        onSubmit={handleSubmit}
        onStop={stop}
        focusSignal={focusSignal}
      />
    </>
  );
};
