// "Not a fit" feedback on job cards. Sent with later searches so Akaza leaves out
// similar openings. Same storage seam as applications.ts.
import type { ApplicationTarget } from "./applications";
import { isSameRole, MAX_PREFERENCE_CHARS, MAX_PREFERENCES } from "./jobs";
import type { ListStore } from "./syncedList";

export type FeedbackReason =
  | "above-experience"
  | "below-experience"
  | "wrong-stack"
  | "location"
  | "salary"
  | "not-real"
  | "other";

export const feedbackReasons: { id: FeedbackReason; label: string }[] = [
  { id: "above-experience", label: "Above my experience" },
  { id: "below-experience", label: "Too junior" },
  { id: "wrong-stack", label: "Wrong tech stack" },
  { id: "location", label: "Location doesn't work" },
  { id: "salary", label: "Salary too low" },
  { id: "not-real", label: "Not a real posting" },
  { id: "other", label: "Other" },
];

export const MAX_FEEDBACK_NOTE_CHARS = 100;

export type JobFeedback = {
  id: string;
  company: string;
  title: string;
  url: string;
  reason: FeedbackReason;
  note: string;
  createdAt: string;
  // Sync bookkeeping (see trackerDoc.ts).
  updatedAt?: string;
  deleted?: boolean;
};

export type JobFeedbackStore = ListStore<JobFeedback>;

export const JOB_FEEDBACK_STORAGE_KEY = "vscode-akaza-job-feedback";

export const isReason = (value: unknown): value is FeedbackReason =>
  feedbackReasons.some((entry) => entry.id === value);

export const localJobFeedbackStore: JobFeedbackStore = {
  load() {
    if (typeof window === "undefined") return [];
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(JOB_FEEDBACK_STORAGE_KEY) ?? "[]",
      );
      return Array.isArray(stored)
        ? stored
            .filter(
              (entry) =>
                entry &&
                typeof entry.title === "string" &&
                isReason(entry.reason),
            )
            .map((entry: JobFeedback) =>
              entry.updatedAt
                ? entry
                : { ...entry, updatedAt: entry.createdAt },
            )
        : [];
    } catch {
      return [];
    }
  },
  save(list) {
    window.localStorage.setItem(JOB_FEEDBACK_STORAGE_KEY, JSON.stringify(list));
  },
};

export const reasonLabel = (reason: FeedbackReason) =>
  feedbackReasons.find((entry) => entry.id === reason)?.label ?? "Other";

// Same posting (URL), or the same role at the same company on another board.
export const findFeedback = (list: JobFeedback[], job: ApplicationTarget) =>
  list.find((entry) => isSameRole(entry, job));

export const createJobFeedback = (
  target: ApplicationTarget,
  reason: FeedbackReason,
  note = "",
  now = new Date(),
): JobFeedback => ({
  id: `fb-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  company: target.company,
  title: target.title,
  url: target.url,
  reason,
  note: note.replace(/\s+/g, " ").trim().slice(0, MAX_FEEDBACK_NOTE_CHARS),
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
});

// One entry per role; marking it again replaces the reason.
export const addJobFeedback = (list: JobFeedback[], entry: JobFeedback) => [
  entry,
  ...list.filter((item) => !findFeedback([item], entry)),
];

const clipLine = (line: string) =>
  line.length > MAX_PREFERENCE_CHARS
    ? `${line.slice(0, MAX_PREFERENCE_CHARS - 1).trimEnd()}…`
    : line;

// Short lines for the job search prompt, newest feedback first: one per reason
// (with an example role), plus each written note.
export const summarizeFeedback = (list: JobFeedback[]): string[] => {
  const sorted = [...list].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const lines: string[] = [];
  const add = (line: string) => {
    const clipped = clipLine(line);
    if (!lines.includes(clipped) && lines.length < MAX_PREFERENCES)
      lines.push(clipped);
  };
  for (const entry of sorted) {
    const role = `${entry.title} at ${entry.company}`;
    if (entry.note)
      add(`${reasonLabel(entry.reason)}: "${entry.note}" (${role})`);
    else if (entry.reason !== "other") {
      const sameReason = sorted.filter(
        (item) => item.reason === entry.reason && !item.note,
      );
      if (sameReason[0] === entry)
        add(
          `${reasonLabel(entry.reason)}, e.g. ${sameReason
            .slice(0, 2)
            .map((item) => `${item.title} at ${item.company}`)
            .join("; ")}`,
        );
    }
  }
  return lines;
};
