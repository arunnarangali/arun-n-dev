import MarkdownPreview from "@uiw/react-markdown-preview";
import { useState } from "react";
import { Icon } from "../Icon";
import { useSettings } from "../../state/useSettings";
import { getFileById } from "../../data/files";
import { JobResults } from "./JobResults";
import { SendLetterBar } from "./SendLetterBar";
import { ApplicationsList } from "./ApplicationsList";
import type {
  ChatMessage as ChatMessageType,
  HrEmailResult,
} from "../../../../portfolio/ai/chatClient";
import type {
  JobDescriptionStatus,
  JobListing,
} from "../../../../portfolio/ai/jobs";
import {
  formatAppliedDate,
  type Application,
} from "../../../../portfolio/ai/applications";
import type { CoverLetterTarget } from "../../../../portfolio/ai/coverLetter";
import { unmarkApplied } from "../../../../portfolio/ai/useApplications";

// Fold state of a finished cover letter. Kept by ChatPanel, because folding also
// hides the request message above the letter.
export type LetterFold = {
  collapsed: boolean;
  applied?: Application;
  onToggle: (expanded: boolean) => void;
};

const summaryReasons: Record<
  Extract<JobDescriptionStatus, { status: "summary" }>["reason"],
  string
> = {
  blocked: "the job page needs a sign-in or blocked reading",
  cooldown: "web access is paused by Ollama's free-plan limit",
  failed: "the job page couldn't be loaded",
};

// What the letter was based on: the posting's full job description, or only the
// search summary (worth checking against the posting before sending).
const JobDescriptionNote = ({ status }: { status: JobDescriptionStatus }) =>
  status.status === "full" ? (
    <p className="ml-7 mt-2 flex items-center gap-1 text-[11px] text-accent">
      <Icon name="fact_check" className="text-[14px]" />
      Based on the full job description · {status.source}
    </p>
  ) : (
    <p className="ml-7 mt-2 flex items-start gap-1 text-[11px] text-tertiary">
      <Icon name="warning" className="mt-px text-[14px]" />
      <span>
        Used the search summary only: {summaryReasons[status.reason]}. Check the
        letter against the posting before sending.
      </span>
    </p>
  );

// A cover letter folded into one card: applied (with date and where it went), or a
// draft hidden by hand. "Next job" goes back to the results to apply to the next one.
const LetterSummary = ({
  bodyId,
  target,
  applied,
  onShow,
  onNextJob,
}: {
  bodyId: string;
  target: CoverLetterTarget;
  applied?: Application;
  onShow: () => void;
  onNextJob?: () => void;
}) => {
  const linkClass = "text-primary hover:text-accent";
  return (
    <div
      className={`chat-collapse-in ml-7 rounded-md border bg-surface-container p-2 text-[12px] ${applied ? "border-accent/50" : "border-outline-variant"}`}
    >
      <p
        className={`flex items-center gap-1.5 font-semibold ${applied ? "text-accent" : "text-on-surface"}`}
      >
        <Icon name={applied ? "task_alt" : "mail"} className="text-[15px]" />
        {applied ? "Applied" : "Cover letter"} · {target.title}
      </p>
      <p className="ml-5 truncate text-[11px] text-on-surface-variant">
        {target.company}
        {applied
          ? ` · ${formatAppliedDate(applied.appliedAt)} · ${applied.via === "gmail" ? "Gmail" : "Job site"}${applied.email ? ` → ${applied.email}` : ""}`
          : " · not sent"}
      </p>
      <div className="ml-5 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <button
          onClick={onShow}
          aria-expanded={false}
          aria-controls={bodyId}
          className={linkClass}
        >
          Show letter
        </button>
        {applied && (
          <button
            onClick={() => unmarkApplied(applied.id)}
            className="text-on-surface-variant hover:text-on-surface"
            title="Not applied after all: show the letter and Send bar again"
          >
            Undo
          </button>
        )}
        {onNextJob && (
          <button
            onClick={onNextJob}
            className={`ml-auto flex items-center gap-0.5 ${linkClass}`}
            title="Back to the job results to apply to the next company"
          >
            <Icon name="arrow_upward" className="text-[13px]" /> Next job
          </button>
        )}
      </div>
    </div>
  );
};

type ChatMessageProps = {
  message: ChatMessageType;
  isPending: boolean;
  onOpenFile: (id: string) => void;
  pendingLabel?: string;
  isBusy?: boolean;
  onRefreshJobs?: (query: string) => void;
  jobsBlockedUntil?: number;
  onDraftCoverLetter?: (job: JobListing) => void;
  onFindHrEmail?: (company: string) => Promise<HrEmailResult>;
  // Scrolls back to the latest job results; undefined when there are none.
  onBackToJobs?: () => void;
  // Set for finished cover letters only.
  letter?: LetterFold;
};

export const ChatMessage = ({
  message,
  isPending,
  onOpenFile,
  pendingLabel = "Thinking…",
  isBusy = false,
  onRefreshJobs,
  jobsBlockedUntil = 0,
  onDraftCoverLetter,
  onFindHrEmail,
  onBackToJobs,
  letter: fold,
}: ChatMessageProps) => {
  const { theme } = useSettings();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const letter = fold ? message.coverLetter : undefined;
  const collapsed = Boolean(fold?.collapsed);
  const applied = fold?.applied;
  const bodyId = `letter-${message.id}`;

  // Links to portfolio files (e.g. `portfolio/src/pages/Projects.tsx`) open as editor tabs.
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (!href) return;
    if (getFileById(href)) {
      event.preventDefault();
      onOpenFile(href);
      return;
    }
    if (/^https?:|^mailto:|^tel:/.test(href)) {
      event.preventDefault();
      window.open(href, "_blank", "noopener");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable; nothing to do.
    }
  };

  return (
    <div className="group/message border-b border-outline-variant/30 px-3 py-3">
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${isUser ? "bg-surface-container-high text-on-surface" : "bg-primary/20 text-primary"}`}
        >
          <Icon
            name={isUser ? "person" : "smart_toy"}
            className="text-[13px]"
          />
        </span>
        <span className="truncate">
          {isUser
            ? "You"
            : collapsed && letter
              ? `Cover letter · ${letter.company}`
              : "Copilot"}
        </span>
        {letter && (
          <button
            onClick={() => fold?.onToggle(collapsed)}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            className="ml-auto rounded p-0.5 hover:bg-surface-container-high hover:text-accent"
            title={collapsed ? "Show letter" : "Hide letter"}
          >
            <Icon
              name={collapsed ? "expand_more" : "expand_less"}
              className="text-[15px]"
            />
          </button>
        )}
        {!isUser &&
          !collapsed &&
          message.content &&
          !message.jobs &&
          !message.applications &&
          !isPending && (
            <button
              onClick={handleCopy}
              className={`${letter ? "" : "ml-auto "}rounded p-0.5 opacity-0 transition-opacity hover:bg-surface-container-high hover:text-accent group-hover/message:opacity-100`}
              title="Copy answer"
            >
              <Icon
                name={copied ? "check" : "content_copy"}
                className="text-[13px]"
              />
            </button>
          )}
      </div>
      {collapsed && letter ? (
        <LetterSummary
          bodyId={bodyId}
          target={letter}
          applied={applied}
          onShow={() => fold?.onToggle(true)}
          onNextJob={onBackToJobs}
        />
      ) : isUser ? (
        <p className="whitespace-pre-wrap break-words pl-7 text-[13px] text-on-surface">
          {message.content}
        </p>
      ) : message.applications ? (
        <ApplicationsList />
      ) : message.jobs ? (
        <JobResults
          result={message.jobs}
          isBusy={isBusy}
          blockedUntil={jobsBlockedUntil}
          onRefresh={(query) => onRefreshJobs?.(query)}
          onDraft={(job) => onDraftCoverLetter?.(job)}
        />
      ) : message.content ? (
        <div
          id={letter ? bodyId : undefined}
          className="pl-7"
          onClick={handleClick}
        >
          <MarkdownPreview
            source={message.content}
            className="markdown-preview chat-markdown text-[13px] text-on-surface"
            style={{ background: "transparent" }}
            wrapperElement={{
              "data-color-mode": theme === "light" ? "light" : "dark",
            }}
          />
        </div>
      ) : (
        <p className="flex items-center gap-2 pl-7 text-[12px] text-on-surface-variant">
          <Icon name="progress_activity" className="animate-spin text-[14px]" />
          {pendingLabel}
        </p>
      )}
      {!collapsed &&
        message.coverLetter &&
        message.content &&
        !isPending &&
        onFindHrEmail &&
        (message.incomplete ? (
          <p className="ml-7 mt-2 text-[11px] text-on-surface-variant">
            This letter is unfinished, so it can't be sent. Click “Cover letter”
            on the job again for a full draft.
          </p>
        ) : (
          <>
            {message.jobDescription && (
              <JobDescriptionNote status={message.jobDescription} />
            )}
            <SendLetterBar
              letter={message.content}
              target={message.coverLetter}
              onFindHrEmail={onFindHrEmail}
              onCollapse={fold ? () => fold.onToggle(false) : undefined}
            />
          </>
        ))}
    </div>
  );
};
