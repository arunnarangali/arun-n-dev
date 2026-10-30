import { useMemo, useSyncExternalStore } from "react";
import { createSyncedList, type ListStore } from "./syncedList";

// Posting URLs the owner said are a different opening from a role already applied to
// (same company + title). One record per URL (the id), so it can sync like the rest.
export type ApplyAnywayRecord = {
  id: string;
  url: string;
  updatedAt?: string;
  deleted?: boolean;
};

export const APPLY_ANYWAY_STORAGE_KEY = "vscode-akaza-apply-anyway";
// Stand-in date for marks saved as plain URLs before sync existed.
const BEFORE_SYNC = new Date(0).toISOString();

const localApplyAnywayStore: ListStore<ApplyAnywayRecord> = {
  load() {
    if (typeof window === "undefined") return [];
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(APPLY_ANYWAY_STORAGE_KEY) ?? "[]",
      );
      if (!Array.isArray(stored)) return [];
      return stored.flatMap((entry): ApplyAnywayRecord[] => {
        if (typeof entry === "string")
          return [{ id: entry, url: entry, updatedAt: BEFORE_SYNC }];
        return entry && typeof entry.url === "string"
          ? [{ ...entry, id: entry.url }]
          : [];
      });
    } catch {
      return [];
    }
  },
  save(list) {
    window.localStorage.setItem(APPLY_ANYWAY_STORAGE_KEY, JSON.stringify(list));
  },
};

const list = createSyncedList(localApplyAnywayStore, [
  APPLY_ANYWAY_STORAGE_KEY,
]);
const noRecords: ApplyAnywayRecord[] = [];

const record = (url: string): ApplyAnywayRecord => ({
  id: url,
  url,
  updatedAt: new Date().toISOString(),
});

export const getApplyAnyway = () => list.getLive().map((entry) => entry.url);
// For sync: live entries plus deletions.
export const applyAnywayList = list;

export const applyAnyway = (url: string) =>
  list.update((current) => [
    record(url),
    ...current.filter((entry) => entry.url !== url),
  ]);

export const undoApplyAnyway = (url: string) =>
  list.update((current) => current.filter((entry) => entry.url !== url));

export const importApplyAnyway = (urls: string[]) => {
  let added = 0;
  list.update((current) => {
    const known = new Set(current.map((entry) => entry.url));
    const fresh = [...new Set(urls)].filter((url) => !known.has(url));
    added = fresh.length;
    return [...current, ...fresh.map(record)];
  });
  return added;
};

export const useApplyAnyway = () => {
  const records = useSyncExternalStore(
    list.subscribe,
    list.getLive,
    () => noRecords,
  );
  return useMemo(() => records.map((entry) => entry.url), [records]);
};
