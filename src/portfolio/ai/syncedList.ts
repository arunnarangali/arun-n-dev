// A list kept in localStorage that the job tracker syncs: shared by every component,
// updated when another tab saves, and deletion-aware. Removing a record keeps it as a
// tombstone so a sync with another device can't bring it back (see trackerDoc.ts).
import type { SyncRecord } from "./trackerDoc";

export interface ListStore<T> {
  load(): T[];
  save(list: T[]): void;
}

export const createSyncedList = <T extends SyncRecord>(
  store: ListStore<T>,
  storageKeys: string[],
) => {
  let all = store.load();
  let live = all.filter((record) => !record.deleted);
  const listeners = new Set<() => void>();
  // Edits made in this tab only (not another tab's saves, not sync merges), so only
  // the tab where a change happened uploads it.
  const editListeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  const setAll = (next: T[]) => {
    all = next;
    live = next.filter((record) => !record.deleted);
  };

  // Another tab changed the list. Listened to for the whole session, not only while a
  // component is mounted, so reads and later saves never use a stale copy.
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (!event.key || !storageKeys.includes(event.key)) return;
      setAll(store.load());
      emit();
    });
  }

  // Replaces everything, tombstones included. Used by sync after a merge.
  const replaceAll = (next: T[]) => {
    store.save(next);
    setAll(next);
    emit();
  };

  // `change` gets the live records as saved now (so another tab's recent entries are
  // kept) and returns the new live list. Records it leaves out become tombstones.
  // Records it adds or edits must carry a fresh `updatedAt`.
  const update = (change: (current: T[]) => T[]) => {
    const saved = store.load();
    const current = saved.filter((record) => !record.deleted);
    const next = change(current);
    const ids = new Set(next.map((record) => record.id));
    const now = new Date().toISOString();
    const removed = current
      .filter((record) => !ids.has(record.id))
      .map((record) => ({ ...record, deleted: true, updatedAt: now }));
    const tombstones = saved.filter(
      (record) => record.deleted && !ids.has(record.id),
    );
    replaceAll([...next, ...removed, ...tombstones]);
    editListeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const subscribeEdits = (listener: () => void) => {
    editListeners.add(listener);
    return () => {
      editListeners.delete(listener);
    };
  };

  return {
    update,
    replaceAll,
    subscribe,
    subscribeEdits,
    // Live records only; what the UI shows.
    getLive: () => live,
    // Live records plus tombstones; what sync sends.
    getAll: () => all,
  };
};
