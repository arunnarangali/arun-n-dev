import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../Icon";
import { ChatInput } from "./ChatInput";
import { ChatMessage, type LetterFold } from "./ChatMessage";
import { matchApplication } from "../../../../portfolio/ai/applications";
import { useApplications } from "../../../../portfolio/ai/useApplications";
import { useApplyAnyway } from "../../../../portfolio/ai/useApplyAnyway";
import { OwnerVerification } from "./OwnerVerification";
import { useChat } from "../../../../portfolio/ai/useChat";
import {
  ChatRequestError,
  findHrEmail,
} from "../../../../portfolio/ai/chatClient";
import { matchCoverLetterJob } from "../../../../portfolio/ai/modelHistory";
import { startTrackerSync } from "../../../../portfolio/ai/trackerSync";
import { parseChatInput } from "../../../../portfolio/ai/slashCommands";
import type { ChatMode } from "../../../../portfolio/ai/systemPrompt";
import { aboutContent } from "../../../../portfolio/content";
import type { JobListing } from "../../../../portfolio/ai/jobs";

// Kept for the browser session only, so closing the tab locks owner mode again.
const PASSCODE_KEY = "vscode-chat-owner-passcode";
const firstName = aboutContent.name.split(" ")[0];

// Suggestions go through the same path as typed input, so slash commands work too.
const suggestedPrompts: Record<ChatMode, { label: string; input: string }[]> = {
  public: [
    `What does ${firstName} specialize in?`,
    "Which projects use Golang?",
    `Is ${firstName} a good fit for a senior React role?`,
    `How can I contact ${firstName}?`,
  ].map((label) => ({ label, input: label })),
  owner: [
    { label: "Find job openings that fit me", input: "/jobs" },
    ...[
      "Draft a cover letter for a Senior React Developer role",
      "Rewrite my project descriptions to be more concise",
      "Give me 5 interview questions about my Kafka experience",
      "What skills should I add for a full-stack role?",
    ].map((label) => ({ label, input: label })),
  ],
};

// Keeps letters parseable for "Send now" (subject line, plain text).
const COVER_LETTER_FORMAT = [
  `Reply with only the email: first line "Subject: ...", a blank line, then the letter in plain text (no markdown, no notes), ending with "Best regards," and my name. Keep it under 220 words.`,
  `Use only facts from my profile and keep numbers exact (years of experience, skills). Never round up or invent.`,
  `Do not state any number, percentage or measured result (like "cut load time by half" or "improved performance by 40%") unless that exact figure is in my profile. Describe the work instead.`,
  `If the job description from the posting is provided, pick the 2–3 most important requirements or responsibilities and connect each to a real fact from my profile (a project, a company, years with a skill). Mention in one line what the company or team builds, if it says. Never claim a requirement I don't meet: leave it out rather than stretch.`,
].join("\n");

const coverLetterTarget = (job: JobListing) => ({
  title: job.title,
  company: job.company,
  url: job.url,
  email: job.contactEmail ?? "",
});

const coverLetterPrompt = (job: JobListing) =>
  [
    `Write a concise cover letter email for this opening, using my profile.`,
    COVER_LETTER_FORMAT,
    `Role: ${job.title} at ${job.company}`,
    job.location && `Location: ${job.location} (${job.workMode})`,
    job.experience && `Experience asked: ${job.experience}`,
    job.skills.length > 0 && `Skills asked: ${job.skills.join(", ")}`,
    job.summary && `About the role: ${job.summary}`,
    `Posting: ${job.url}`,
  ]
    .filter(Boolean)
    .join("\n");

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

  // Sync the job tracker with other devices while owner mode is unlocked.
  useEffect(
    () => (passcode ? startTrackerSync(passcode) : undefined),
    [passcode],
  );

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
  const {
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
    dismissSuggestion,
    enhance,
    enhanceRemaining,
  } = useChat(mode, passcode, onUnauthorized);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isBusy = status !== "idle";
  const isOwner = mode === "owner";

  const handleSubmit = useCallback(
    (raw: string) => {
      const parsed = parseChatInput(raw);
      if (parsed.kind === "prompt") {
        // "Cover letter for #2 / the Capco one" -> that job from the results, with Send now.
        const job = isOwner ? matchCoverLetterJob(parsed.text, messages) : null;
        if (job)
          void send(`${parsed.text}\n\n${COVER_LETTER_FORMAT}`, {
            coverLetter: coverLetterTarget(job),
          });
        else void send(parsed.text);
        return;
      }
      if (parsed.name === "clear") clear();
      if (parsed.name === "applied") {
        if (isOwner) showApplications();
        else onRequestUnlock();
      }
      if (parsed.name === "jobs") {
        if (isOwner) void searchJobs(parsed.args ?? "");
        else onRequestUnlock();
      }
      if (parsed.name === "owner" && !isOwner) onRequestUnlock();
      if (parsed.name === "public" && isOwner) onLock();
    },
    [
      clear,
      isOwner,
      messages,
      onLock,
      onRequestUnlock,
      searchJobs,
      send,
      showApplications,
    ],
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

  // A finished cover letter folds, together with its request above it, into one
  // summary card. Applied letters fold by default (also after a reload); the user's
  // own Show/Hide choice wins. Folding only hides them: the model still sees both.
  const applications = useApplications();
  const applyAnywayUrls = useApplyAnyway();
  const [letterExpanded, setLetterExpanded] = useState<Record<string, boolean>>(
    {},
  );
  const letterFolds = useMemo(() => {
    const folds = new Map<string, LetterFold>();
    messages.forEach((message, index) => {
      const pending = isBusy && index === messages.length - 1;
      if (
        !message.coverLetter ||
        !message.content ||
        message.incomplete ||
        pending
      )
        return;
      const match = matchApplication(applications, message.coverLetter, {
        applyAnyway: applyAnywayUrls,
      });
      const applied = match?.status === "applied" ? match.entry : undefined;
      folds.set(message.id, {
        collapsed: (letterExpanded[message.id] ?? !applied) === false,
        applied,
        onToggle: (expanded) =>
          setLetterExpanded((current) => ({
            ...current,
            [message.id]: expanded,
          })),
      });
    });
    return folds;
  }, [messages, isBusy, applications, applyAnywayUrls, letterExpanded]);

  // "Next job" on a folded cover letter: back to the latest results, with a brief
  // highlight so it's clear where the list is.
  const hasJobResults = messages.some((message) => message.jobs?.jobs.length);
  const scrollToJobs = useCallback(() => {
    const lists =
      scrollRef.current?.querySelectorAll<HTMLElement>("[data-job-results]");
    const target = lists?.[lists.length - 1];
    if (!target) return;
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    target.classList.remove("chat-highlight");
    // Restart the animation if it's clicked again quickly.
    void target.offsetWidth;
    target.classList.add("chat-highlight");
    window.setTimeout(() => target.classList.remove("chat-highlight"), 1300);
  }, []);

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
                ? "Owner mode: Akaza, your private assistant"
                : "Answers questions about this portfolio"
            }
          >
            {isOwner ? "Akaza" : `Ask ${firstName}`}
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
                ? "Akaza online. Your profile is loaded as context."
                : "Projects, skills, experience or how to get in touch."}
            </p>
            <div className="mt-5 flex w-full flex-col gap-2">
              {suggestedPrompts[mode].map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleSubmit(prompt.input)}
                  className="rounded-md border border-outline-variant bg-surface-container px-3 py-2 text-left text-[12px] text-on-surface transition-colors hover:border-primary hover:text-accent"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            // A folded letter hides the request that asked for it, too.
            const next = messages[index + 1];
            if (
              message.role === "user" &&
              next &&
              letterFolds.get(next.id)?.collapsed
            )
              return null;
            return (
              <ChatMessage
                key={message.id}
                message={message}
                letter={letterFolds.get(message.id)}
                isPending={isBusy && index === messages.length - 1}
                pendingLabel={
                  status === "searching"
                    ? "Searching job boards and ranking openings…"
                    : message.coverLetter && isOwner
                      ? "Reading the job description…"
                      : undefined
                }
                isBusy={isBusy}
                onRefreshJobs={(query) =>
                  void searchJobs(query, { fresh: true })
                }
                jobsBlockedUntil={jobsBlockedUntil}
                onBackToJobs={hasJobResults ? scrollToJobs : undefined}
                onDraftCoverLetter={(job) =>
                  void send(coverLetterPrompt(job), {
                    coverLetter: coverLetterTarget(job),
                  })
                }
                onFindHrEmail={(company) =>
                  findHrEmail({ company, passcode }).catch(
                    (caught: unknown) => {
                      // Passcode changed on the server: back to the Akaza screen, like chat does.
                      if (
                        caught instanceof ChatRequestError &&
                        caught.status === 403
                      )
                        onUnauthorized();
                      throw caught;
                    },
                  )
                }
                onOpenFile={(id) => {
                  onOpenFile(id);
                  if (variant === "overlay") onClose();
                }}
              />
            );
          })
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
          isOwner ? "Ask Akaza anything…" : `Ask about ${firstName}…`
        }
        onSubmit={handleSubmit}
        onStop={stop}
        focusSignal={focusSignal}
        suggestion={suggestion?.text}
        onDismissSuggestion={dismissSuggestion}
        onEnhance={enhance}
        // Visitors see how many ✨ uses are left today; the owner has no daily cap.
        enhanceRemaining={isOwner ? undefined : enhanceRemaining}
      />
    </>
  );
};
