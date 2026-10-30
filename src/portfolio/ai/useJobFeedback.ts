import { useSyncExternalStore } from "react";
import type { ApplicationTarget } from "./applications";
import {
  JOB_FEEDBACK_STORAGE_KEY,
  addJobFeedback,
  createJobFeedback,
  findFeedback,
  localJobFeedbackStore,
  type FeedbackReason,
  type JobFeedback,
} from "./jobFeedback";
import { createSyncedList } from "./syncedList";

// One shared list, like useApplications, so every job card updates together.
const list = createSyncedList<JobFeedback>(localJobFeedbackStore, [
  JOB_FEEDBACK_STORAGE_KEY,
]);
const noFeedback: JobFeedback[] = [];

// Current list for non-React code, e.g. the job search request.
export const getJobFeedback = list.getLive;
// For sync: live entries plus deletions.
export const jobFeedbackList = list;

export const markNotFit = (
  target: ApplicationTarget,
  reason: FeedbackReason,
  note = "",
) =>
  list.update((current) =>
    addJobFeedback(current, createJobFeedback(target, reason, note)),
  );

export const undoNotFit = (id: string) =>
  list.update((current) => current.filter((entry) => entry.id !== id));

export const useJobFeedback = () =>
  useSyncExternalStore(list.subscribe, list.getLive, () => noFeedback);

// Adds imported entries for roles not marked yet; existing reasons are kept.
export const importJobFeedback = (incoming: JobFeedback[]) => {
  let added = 0;
  list.update((current) => {
    const next = [...current];
    for (const entry of incoming) {
      if (findFeedback(next, entry)) continue;
      next.push(entry);
      added += 1;
    }
    return next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
  return added;
};
