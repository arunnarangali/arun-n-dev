// Job applications marked in the Akaza chat. Pure helpers plus a storage seam: swap
// `localApplicationStore` for a database-backed store later without touching the UI.

import { applicationKey, matchApplication, REPOST_WINDOW_MS } from "./jobs";
import type { ListStore } from "./syncedList";

export type ApplicationVia = "gmail" | "portal";

export type Application = {
  id: string;
  company: string;
  title: string;
  url: string;
  email: string;
  subject: string;
  appliedAt: string;
  via: ApplicationVia;
  note: string;
  // Sync bookkeeping (see trackerDoc.ts): last change, and whether it was deleted.
  updatedAt?: string;
  deleted?: boolean;
};

export type ApplicationTarget = Pick<Application, "company" | "title" | "url">;

export type ApplicationStore = ListStore<Application>;

const STORAGE_KEY = "vscode-akaza-applications";
// Earlier name of the key. Its entries are merged into the new key once, then removed.
const LEGACY_STORAGE_KEY = "vscode-jarvis-applications";

const readList = (key: string): Application[] => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    // Entries saved before sync existed have no `updatedAt`; their date stands in.
    return Array.isArray(stored)
      ? stored.map((entry: Application) =>
          entry.updatedAt ? entry : { ...entry, updatedAt: entry.appliedAt },
        )
      : [];
  } catch {
    return [];
  }
};

export const localApplicationStore: ApplicationStore = {
  load() {
    if (typeof window === "undefined") return [];
    const list = readList(STORAGE_KEY);
    if (window.localStorage.getItem(LEGACY_STORAGE_KEY) === null) return list;
    // One-time move: keep entries from both keys, then drop the old one.
    const merged = mergeApplications(list, readList(LEGACY_STORAGE_KEY)).list;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return merged;
  },
  save(list) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },
};

export const APPLICATIONS_STORAGE_KEY = STORAGE_KEY;
export const LEGACY_APPLICATIONS_STORAGE_KEY = LEGACY_STORAGE_KEY;

// Matching lives in jobs.ts so the Worker can use it without browser code.
export { applicationKey, matchApplication };

export const createApplication = (
  target: ApplicationTarget,
  extra: Partial<Pick<Application, "email" | "subject" | "via" | "note">> = {},
  now = new Date(),
): Application => ({
  id: `app-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  company: target.company,
  title: target.title,
  url: target.url,
  email: extra.email ?? "",
  subject: extra.subject ?? "",
  appliedAt: now.toISOString(),
  via: extra.via ?? "portal",
  note: extra.note ?? "",
  updatedAt: now.toISOString(),
});

// The same application in two lists: same id or URL. Without both URLs, the same
// company + title within the repost window also counts. Two different URLs are kept
// apart, so a repost or "Apply anyway" application marked separately stays separate.
const isSameApplication = (a: Application, b: Application) => {
  if (a.id === b.id) return true;
  if (a.url && b.url) return a.url === b.url;
  const key = applicationKey(a.company, a.title);
  return (
    key !== null &&
    key === applicationKey(b.company, b.title) &&
    Math.abs(Date.parse(a.appliedAt) - Date.parse(b.appliedAt)) <
      REPOST_WINDOW_MS
  );
};

// Keeps one entry per application; the earliest date wins.
export const mergeApplications = (
  current: Application[],
  incoming: Application[],
) => {
  const merged = [...current];
  let added = 0;
  for (const entry of incoming) {
    const existingIndex = merged.findIndex((item) =>
      isSameApplication(item, entry),
    );
    if (existingIndex === -1) {
      merged.push(entry);
      added += 1;
    } else if (entry.appliedAt < merged[existingIndex].appliedAt) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        appliedAt: entry.appliedAt,
        updatedAt: new Date().toISOString(),
      };
    }
  }
  merged.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  return { list: merged, added, skipped: incoming.length - added };
};

export const formatAppliedDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
