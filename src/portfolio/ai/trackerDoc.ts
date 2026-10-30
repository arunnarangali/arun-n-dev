// The job tracker as one synced document: applications, "Not a fit" feedback and
// "Apply anyway" marks. Shared by the browser and the chat Worker, so keep it free of
// React, `window` and content imports.

import { applicationKey } from "./jobs";

// Every synced record has an id and the time it last changed. Deleting a record keeps
// it as a tombstone (`deleted: true`), so another device's older copy can't bring it
// back when the two are merged.
export type SyncRecord = { id: string; updatedAt?: string; deleted?: boolean };

export type TrackerLists<A, F, Y> = {
  applications: A[];
  feedback: F[];
  applyAnyway: Y[];
};

// What the Worker stores and returns. `version` goes up by one on every save.
export type TrackerDoc = TrackerLists<SyncRecord, SyncRecord, SyncRecord> & {
  version: number;
  updatedAt: string;
};

export const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60_000;
export const MAX_TRACKER_BYTES = 256 * 1024;
export const MAX_TRACKER_RECORDS = 2000;

export const emptyTrackerDoc = (): TrackerDoc => ({
  version: 0,
  updatedAt: "",
  applications: [],
  feedback: [],
  applyAnyway: [],
});

const time = (record: SyncRecord) => Date.parse(record.updatedAt ?? "") || 0;

const wins = (record: SyncRecord, current: SyncRecord | undefined) =>
  !current ||
  time(record) > time(current) ||
  (time(record) === time(current) && Boolean(record.deleted) && !current.deleted);

// Keeps one record per key: the newer change, or the deletion on a tie.
const newestPerKey = <T extends SyncRecord>(
  records: T[],
  keyOf: (record: T) => string,
) => {
  const byKey = new Map<string, T>();
  for (const record of records) {
    const key = keyOf(record);
    if (wins(record, byKey.get(key))) byKey.set(key, record);
  }
  return [...byKey.values()];
};

// Per record id the newer change wins; on a tie a deletion wins, so an undo sticks.
// `identityOf` also folds together records that are the same item under different
// ids (e.g. the same CSV imported on two devices). Tombstones older than
// TOMBSTONE_TTL_MS are dropped.
export const mergeRecords = <T extends SyncRecord>(
  a: T[],
  b: T[],
  now = Date.now(),
  identityOf?: (record: T) => string,
): T[] => {
  const byId = newestPerKey([...a, ...b], (record) => record.id);
  const merged = identityOf ? newestPerKey(byId, identityOf) : byId;
  return merged
    .filter((record) => !record.deleted || now - time(record) < TOMBSTONE_TTL_MS)
    .sort((x, y) => time(y) - time(x) || x.id.localeCompare(y.id));
};

const field = (record: SyncRecord, name: string) => {
  const value = (record as Record<string, unknown>)[name];
  return typeof value === "string" ? value : "";
};

// The same application: same posting URL, or (no URL) same role applied the same day.
// Different URLs stay separate, so a repost applied to again isn't folded in.
export const applicationIdentity = (record: SyncRecord) => {
  const url = field(record, "url");
  if (url) return `url:${url}`;
  const key = applicationKey(field(record, "company"), field(record, "title"));
  return key
    ? `role:${key}|${field(record, "appliedAt").slice(0, 10)}`
    : `id:${record.id}`;
};

// One "Not a fit" mark per role (as addJobFeedback keeps it), else per URL.
export const feedbackIdentity = (record: SyncRecord) => {
  const key = applicationKey(field(record, "company"), field(record, "title"));
  if (key) return `role:${key}`;
  const url = field(record, "url");
  return url ? `url:${url}` : `id:${record.id}`;
};

export const mergeTracker = <
  A extends SyncRecord,
  F extends SyncRecord,
  Y extends SyncRecord,
>(
  a: TrackerLists<A, F, Y>,
  b: TrackerLists<A, F, Y>,
  now = Date.now(),
): TrackerLists<A, F, Y> => ({
  applications: mergeRecords(a.applications, b.applications, now, applicationIdentity),
  feedback: mergeRecords(a.feedback, b.feedback, now, feedbackIdentity),
  // Apply-anyway records already use the URL as their id.
  applyAnyway: mergeRecords(a.applyAnyway, b.applyAnyway, now),
});

const listKey = (list: SyncRecord[]) =>
  JSON.stringify(
    [...list]
      .sort((x, y) => x.id.localeCompare(y.id))
      .map((record) =>
        Object.entries(record)
          .filter(([, value]) => value !== undefined)
          .sort(([x], [y]) => x.localeCompare(y)),
      ),
  );

// True when both lists hold the same records, whatever their order.
export const sameRecords = (a: SyncRecord[], b: SyncRecord[]) =>
  listKey(a) === listKey(b);

export const sameTracker = (
  a: TrackerLists<SyncRecord, SyncRecord, SyncRecord>,
  b: TrackerLists<SyncRecord, SyncRecord, SyncRecord>,
) =>
  sameRecords(a.applications, b.applications) &&
  sameRecords(a.feedback, b.feedback) &&
  sameRecords(a.applyAnyway, b.applyAnyway);

// Allowed string fields and their maximum lengths, per list. Anything else is dropped.
const fieldLimits = {
  applications: {
    company: 80,
    title: 120,
    url: 500,
    email: 120,
    subject: 300,
    appliedAt: 40,
    via: 10,
    note: 500,
  },
  feedback: {
    company: 80,
    title: 120,
    url: 500,
    reason: 40,
    note: 200,
    createdAt: 40,
  },
  applyAnyway: { url: 500 },
} as const;

type ListName = keyof typeof fieldLimits;

const sanitizeList = (name: ListName, raw: unknown): SyncRecord[] | null => {
  if (!Array.isArray(raw) || raw.length > MAX_TRACKER_RECORDS) return null;
  const limits: Record<string, number> = fieldLimits[name];
  const records: SyncRecord[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== "string" || !item.id || item.id.length > 600)
      return null;
    if (item.updatedAt !== undefined && typeof item.updatedAt !== "string")
      return null;
    const record: Record<string, unknown> = { id: item.id };
    if (typeof item.updatedAt === "string")
      record.updatedAt = item.updatedAt.slice(0, 40);
    if (item.deleted === true) record.deleted = true;
    for (const [field, max] of Object.entries(limits)) {
      const value = item[field];
      if (value === undefined) continue;
      if (typeof value !== "string") return null;
      record[field] = value.slice(0, max);
    }
    records.push(record as SyncRecord);
  }
  return records;
};

// Validates tracker lists: unknown fields are dropped and long text is cut to size.
// Null when anything is malformed.
export const sanitizeTracker = (
  raw: unknown,
): TrackerLists<SyncRecord, SyncRecord, SyncRecord> | null => {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const applications = sanitizeList("applications", value.applications ?? []);
  const feedback = sanitizeList("feedback", value.feedback ?? []);
  const applyAnyway = sanitizeList("applyAnyway", value.applyAnyway ?? []);
  if (!applications || !feedback || !applyAnyway) return null;
  return { applications, feedback, applyAnyway };
};
