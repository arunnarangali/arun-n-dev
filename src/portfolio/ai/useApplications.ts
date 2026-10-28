import { useSyncExternalStore } from "react";
import {
  APPLICATIONS_STORAGE_KEY,
  createApplication,
  localApplicationStore,
  mergeApplications,
  parseCsv,
  toCsv,
  type Application,
  type ApplicationStore,
  type ApplicationTarget,
} from "./applications";

// One shared list, so job cards, the send bar and the tracker update together.
const store: ApplicationStore = localApplicationStore;
let snapshot: Application[] = store.load();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

// Another tab changed the list. Listened to for the whole session, not only while a
// component is mounted, so getApplications() and later saves never use a stale copy.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== APPLICATIONS_STORAGE_KEY) return;
    snapshot = store.load();
    emit();
  });
}

// Changes start from what is saved now, so another tab's recent entries are kept.
const update = (change: (current: Application[]) => Application[]) => {
  snapshot = change(store.load());
  store.save(snapshot);
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => snapshot;

// Current list for non-React code, e.g. building the model's history.
export const getApplications = () => snapshot;
const getServerSnapshot = (): Application[] => [];

export const markApplied = (
  target: ApplicationTarget,
  extra?: Parameters<typeof createApplication>[1],
) => {
  update(
    (current) =>
      mergeApplications(current, [createApplication(target, extra)]).list,
  );
};

export const unmarkApplied = (id: string) =>
  update((current) => current.filter((entry) => entry.id !== id));

export const importApplicationsCsv = async (file: File) => {
  const incoming = parseCsv(await file.text());
  let counts = { added: 0, skipped: 0 };
  update((current) => {
    const { list, added, skipped } = mergeApplications(current, incoming);
    counts = { added, skipped };
    return list;
  });
  return counts;
};

export const downloadApplicationsCsv = () => {
  const blob = new Blob([`\uFEFF${toCsv(snapshot)}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jarvis-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  // Firefox and Safari need the link in the document, and the URL alive until the
  // download has started.
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const useApplications = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
