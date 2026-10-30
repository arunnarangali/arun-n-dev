import { useSyncExternalStore } from "react";
import { createSyncedList } from "./syncedList";
import {
  APPLICATIONS_STORAGE_KEY,
  LEGACY_APPLICATIONS_STORAGE_KEY,
  createApplication,
  localApplicationStore,
  mergeApplications,
  type Application,
  type ApplicationTarget,
} from "./applications";
import { parseTrackerCsv, toTrackerCsv } from "./trackerCsv";
import { getJobFeedback, importJobFeedback } from "./useJobFeedback";
import { getApplyAnyway, importApplyAnyway } from "./useApplyAnyway";

// One shared list, so job cards, the send bar and the tracker update together.
// A tab still on the old site version writes the legacy key; load() moves it over.
const list = createSyncedList<Application>(localApplicationStore, [
  APPLICATIONS_STORAGE_KEY,
  LEGACY_APPLICATIONS_STORAGE_KEY,
]);
const update = list.update;
const noApplications: Application[] = [];

// Current list for non-React code, e.g. building the model's history.
export const getApplications = list.getLive;
// For sync: live entries plus deletions.
export const applicationsList = list;

// `separate`: a repost or "Apply anyway" opening, so it's a new application rather
// than a duplicate of the earlier one for the same role.
export const markApplied = (
  target: ApplicationTarget,
  extra?: Parameters<typeof createApplication>[1],
  { separate = false } = {},
) => {
  const entry = createApplication(target, extra);
  update((current) =>
    separate ? [entry, ...current] : mergeApplications(current, [entry]).list,
  );
};

export const unmarkApplied = (id: string) =>
  update((current) => current.filter((entry) => entry.id !== id));

export type TrackerImportCounts = {
  applications: number;
  feedback: number;
  applyAnyway: number;
  skipped: number;
};

// Imports a tracker CSV: applications, "Not a fit" and "Apply anyway" rows. Duplicates
// and invalid rows are skipped.
export const importTrackerCsv = async (
  file: File,
): Promise<TrackerImportCounts> => {
  const incoming = parseTrackerCsv(await file.text());
  let applications = 0;
  update((current) => {
    const result = mergeApplications(current, incoming.applications);
    applications = result.added;
    return result.list;
  });
  const feedback = importJobFeedback(incoming.feedback);
  const applyAnyway = importApplyAnyway(incoming.applyAnyway);
  const total =
    incoming.applications.length +
    incoming.feedback.length +
    incoming.applyAnyway.length +
    incoming.invalid;
  return {
    applications,
    feedback,
    applyAnyway,
    skipped: total - applications - feedback - applyAnyway,
  };
};

export const hasTrackerData = (counts: {
  applications: number;
  feedback: number;
  applyAnyway: number;
}) => counts.applications + counts.feedback + counts.applyAnyway > 0;

// "2026-10-30-1452": local date and time, so every download gets its own file and
// the newest one is easy to spot.
export const fileTimestamp = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
};

// Saves CSV text as a file (with a BOM, so Excel reads UTF-8 correctly).
export const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  // Firefox and Safari need the link in the document, and the URL alive until the
  // download has started.
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

// The tracker backup: applications, "Not a fit" and "Apply anyway" marks.
export const downloadTrackerCsv = () =>
  downloadCsv(
    `akaza-job-tracker-${fileTimestamp()}.csv`,
    toTrackerCsv({
      applications: list.getLive(),
      feedback: getJobFeedback(),
      applyAnyway: getApplyAnyway(),
    }),
  );

export const useApplications = () =>
  useSyncExternalStore(list.subscribe, list.getLive, () => noApplications);
