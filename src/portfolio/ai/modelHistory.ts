// Turns the chat transcript into what the model sees, so follow-up questions can refer
// to earlier answers, job results and tracked applications.
import { analyzeJobFit } from "../jobFit";
import {
  matchApplication,
  formatAppliedDate,
  type Application,
} from "./applications";
import type { ChatMessage } from "./chatClient";
import {
  HISTORY_LIMIT,
  MAX_CONTEXT_MESSAGE_CHARS,
  MAX_HISTORY_CHARS,
} from "./chatLimits";
import type { ApplicationMatch, JobListing } from "./jobs";
import { findFeedback, reasonLabel, type JobFeedback } from "./jobFeedback";

export type ModelMessage = Pick<ChatMessage, "role" | "content">;

const STOPPED_SUFFIX = /\n*_Stopped\._\s*$/;

// Fixed job numbers: best fit first. The cards show the same "#N" labels whatever
// filter or sort is active, so "#2" means the same job to the user and the model.
export const rankJobsByFit = (jobs: JobListing[]) =>
  jobs
    .map((job) => ({
      job,
      fit: analyzeJobFit(
        `${job.title}\n${job.skills.join(", ")}\n${job.summary}`,
      ),
    }))
    .sort((a, b) => b.fit.score - a.fit.score)
    .map((entry, index) => ({ ...entry, number: index + 1 }));

const describeMatch = (match: ApplicationMatch<Application> | undefined) => {
  if (!match) return "not applied";
  const date = formatAppliedDate(match.entry.appliedAt);
  return {
    applied: `applied ${date}`,
    sameRole: `applied ${date} (same role, likely the same opening on another site)`,
    repost: `reposted; applied to an earlier posting on ${date}`,
    applyAnyway: `not applied; owner says it's a different opening from the one applied to on ${date}`,
  }[match.status];
};

const describeJobs = (
  message: ChatMessage,
  applications: Application[],
  feedback: JobFeedback[],
  applyAnyway: string[],
) => {
  const result = message.jobs;
  if (!result) return message.content;
  const lines = rankJobsByFit(result.jobs).map(({ job, fit, number }) => {
    const match = matchApplication(applications, job, {
      applyAnyway,
    });
    const notFit = findFeedback(feedback, job);
    return [
      `${number}. ${job.title}`,
      job.company,
      `${job.location || "location n/a"}${job.workMode !== "unknown" ? ` (${job.workMode})` : ""}`,
      job.experience,
      `${fit.score}% fit`,
      describeMatch(match),
      notFit &&
        `marked not a fit: ${reasonLabel(notFit.reason)}${notFit.note ? ` ("${notFit.note}")` : ""}`,
      job.url,
    ]
      .filter(Boolean)
      .join(" — ");
  });
  const skipped = (result.skipped ?? []).map(
    (entry) =>
      `- skipped: ${entry.title}${entry.company ? ` — ${entry.company}` : ""} — ${entry.reason}`,
  );
  return [
    `${message.content} Job search results (each card shows its #number):`,
    ...lines,
    ...(result.applied
      ? [`Left out ${result.applied} listing(s) already marked applied.`]
      : []),
    ...(skipped.length
      ? ['Left out because of the owner\'s "Not a fit" feedback:', ...skipped]
      : []),
  ].join("\n");
};

const describeApplications = (applications: Application[]) =>
  applications.length
    ? [
        `Tracked applications (${applications.length}):`,
        ...applications.map(
          (entry) =>
            `- ${entry.title} — ${entry.company} — applied ${formatAppliedDate(entry.appliedAt)} via ${entry.via === "gmail" ? "Gmail" : "the job site"}${entry.email ? ` to ${entry.email}` : ""}`,
        ),
      ].join("\n")
    : "Tracked applications: none yet.";

// Earlier turns only; the new question is sent whole (the input and Worker cap it).
const clip = (text: string) =>
  text.length > MAX_CONTEXT_MESSAGE_CHARS
    ? `${text.slice(0, MAX_CONTEXT_MESSAGE_CHARS - 20).trimEnd()}\n…(shortened)`
    : text;

const toModelContent = (
  message: ChatMessage,
  applications: Application[],
  feedback: JobFeedback[],
  applyAnyway: string[],
) => {
  if (message.applications) return describeApplications(applications);
  if (message.jobs)
    return describeJobs(message, applications, feedback, applyAnyway);
  if (message.incomplete || STOPPED_SUFFIX.test(message.content))
    return `${message.content.replace(STOPPED_SUFFIX, "").trimEnd()}\n(answer was cut off)`;
  return message.content;
};

// Recent turns within the message and character budgets. The newest message (the
// user's question) is always kept.
export const buildModelHistory = (
  messages: ChatMessage[],
  applications: Application[] = [],
  feedback: JobFeedback[] = [],
  applyAnyway: string[] = [],
): ModelMessage[] => {
  const kept = messages.filter((message) => message.content.trim());
  const converted = kept.map((message, index) => {
    const content = toModelContent(
      message,
      applications,
      feedback,
      applyAnyway,
    );
    return {
      role: message.role,
      content: index === kept.length - 1 ? content : clip(content),
    };
  });
  const history: ModelMessage[] = [];
  let total = 0;
  for (let index = converted.length - 1; index >= 0; index -= 1) {
    const entry = converted[index];
    const isNewest = history.length === 0;
    if (
      !isNewest &&
      (history.length >= HISTORY_LIMIT ||
        total + entry.content.length > MAX_HISTORY_CHARS)
    )
      break;
    history.unshift(entry);
    total += entry.content.length;
  }
  // The model expects the conversation to start with a user turn.
  while (history.length > 1 && history[0].role !== "user") history.shift();
  return history;
};

const ordinals = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
];

// "Write a cover letter for #2 / the second one / the Capco job" -> that job from the
// latest results, so the reply gets a Send now bar like the card button.
export const matchCoverLetterJob = (
  text: string,
  messages: ChatMessage[],
): JobListing | null => {
  if (!/cover\s*letter/i.test(text)) return null;
  const latest = [...messages]
    .reverse()
    .find((message) => message.jobs?.jobs.length);
  if (!latest?.jobs) return null;
  const ranked = rankJobsByFit(latest.jobs.jobs).map(({ job }) => job);
  const lower = text.toLowerCase();

  const number = /(?:#|\bno\.?\s*|\bnumber\s+|\bjob\s+)(\d{1,2})\b/.exec(
    lower,
  )?.[1];
  const ordinal = ordinals.findIndex((word) =>
    new RegExp(`\\b${word}\\b`).test(lower),
  );
  const position = number ? Number(number) : ordinal >= 0 ? ordinal + 1 : 0;
  if (position >= 1 && position <= ranked.length) return ranked[position - 1];

  const byCompany = ranked.filter((job) => {
    const company = job.company.toLowerCase();
    return (
      company.length > 2 &&
      company !== "unknown company" &&
      lower.includes(company)
    );
  });
  return byCompany.length === 1 ? byCompany[0] : null;
};
