// Keeps the job tracker (applications, "Not a fit", "Apply anyway") the same on every
// device by syncing it with one document in the chat Worker. localStorage stays the
// working copy: the UI never waits for the network, and changes made offline are sent
// later. Runs only while owner mode is unlocked, because the Worker needs the passcode.
import { useSyncExternalStore } from "react";
import type { Application } from "./applications";
import {
  ChatRequestError,
  fetchTracker,
  saveTracker,
  TRACKER_API_URL,
} from "./chatClient";
import type { JobFeedback } from "./jobFeedback";
import {
  mergeTracker,
  sameRecords,
  sameTracker,
  sanitizeTracker,
  type TrackerDoc,
  type TrackerLists,
} from "./trackerDoc";
import { applicationsList } from "./useApplications";
import { applyAnywayList, type ApplyAnywayRecord } from "./useApplyAnyway";
import { jobFeedbackList } from "./useJobFeedback";

type Lists = TrackerLists<Application, JobFeedback, ApplyAnywayRecord>;

export type SyncState =
  | "off"
  | "syncing"
  | "synced"
  | "offline"
  | "error"
  | "unconfigured";
export type SyncStatus = { state: SyncState; at: string; message: string };

const SAVE_DELAY_MS = 2000;
const RETRY_MS = 30_000;
// A tab coming back into view pulls at most this often (reads are cheap but counted).
const PULL_ON_FOCUS_MS = 60_000;

let status: SyncStatus = { state: "off", at: "", message: "" };
const statusListeners = new Set<() => void>();

const setStatus = (state: SyncState, message = "") => {
  status = { state, at: new Date().toISOString(), message };
  statusListeners.forEach((listener) => listener());
};

const subscribeStatus = (listener: () => void) => {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};

export const getTrackerSyncStatus = () => status;
export const useTrackerSyncStatus = () =>
  useSyncExternalStore(subscribeStatus, getTrackerSyncStatus, getTrackerSyncStatus);

const localLists = (): Lists => ({
  applications: applicationsList.getAll(),
  feedback: jobFeedbackList.getAll(),
  applyAnyway: applyAnywayList.getAll(),
});

// What the Worker would keep of these lists (it drops unknown fields and cuts long
// text), so comparing with the server copy doesn't trigger needless saves.
const asStored = (lists: Lists) => sanitizeTracker(lists) ?? lists;

// Starts syncing; returns a function that stops it.
export const startTrackerSync = (
  passcode: string,
  {
    saveDelayMs = SAVE_DELAY_MS,
    retryMs = RETRY_MS,
  }: { saveDelayMs?: number; retryMs?: number } = {},
) => {
  if (!TRACKER_API_URL) {
    setStatus("off", "Sync is turned off for this build.");
    return () => {};
  }

  let stopped = false;
  // Sync can't work (no KV binding, or the live site rejects the passcode).
  let disabled = false;
  // Server version this device last saw; null until the first pull.
  let version: number | null = null;
  let saveTimer = 0;
  let retryTimer = 0;
  let lastPull = 0;
  let queue = Promise.resolve();

  // Writes merged lists into the local stores. replaceAll doesn't count as an edit,
  // so this doesn't trigger another save.
  const applyLocal = (lists: Lists) => {
    if (!sameRecords(applicationsList.getAll(), lists.applications))
      applicationsList.replaceAll(lists.applications);
    if (!sameRecords(jobFeedbackList.getAll(), lists.feedback))
      jobFeedbackList.replaceAll(lists.feedback);
    if (!sameRecords(applyAnywayList.getAll(), lists.applyAnyway))
      applyAnywayList.replaceAll(lists.applyAnyway);
  };

  const fail = (caught: unknown) => {
    const statusCode = caught instanceof ChatRequestError ? caught.status : 0;
    if (statusCode === 503) {
      disabled = true;
      setStatus("unconfigured", "Sync isn't set up on the server yet. This device keeps its own copy.");
      return;
    }
    if (statusCode === 403) {
      disabled = true;
      setStatus("error", "The live site didn't accept this access code, so sync is off.");
      return;
    }
    // Retrying can't fix these; the next edit tries again.
    if (statusCode === 400 || statusCode === 413) {
      window.clearTimeout(retryTimer);
      setStatus(
        "error",
        statusCode === 413
          ? "The tracker is too big to sync (over 256 KB). This device keeps its copy."
          : "The server rejected the tracker data, so it wasn't synced.",
      );
      return;
    }
    const wait =
      caught instanceof ChatRequestError && caught.retryAfter
        ? caught.retryAfter * 1000
        : retryMs;
    setStatus(
      statusCode === 429 ? "offline" : statusCode ? "error" : "offline",
      statusCode === 429
        ? "Sync paused by its limit. Changes are kept here and sent later."
        : statusCode
          ? `Sync failed (${statusCode}). Retrying.`
          : "Can't reach the sync server. Changes are kept here and sent later.",
    );
    window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(() => enqueue(push), wait);
  };

  const enqueue = (task: () => Promise<void>) => {
    queue = queue.then(async () => {
      if (stopped || disabled) return;
      try {
        await task();
      } catch (caught) {
        if (!stopped) fail(caught);
      }
    });
    return queue;
  };

  // Merges the server copy in; saves back when this device has something it lacks.
  const absorb = async (remote: TrackerDoc, retried: boolean) => {
    const merged = mergeTracker(localLists(), remote as unknown as Lists);
    applyLocal(merged);
    version = remote.version;
    if (sameTracker(asStored(merged), remote)) {
      setStatus("synced");
      return;
    }
    await push(retried);
  };

  const pull = async () => {
    setStatus("syncing");
    lastPull = Date.now();
    await absorb(await fetchTracker(passcode), false);
  };

  async function push(retried = false): Promise<void> {
    if (version === null) return pull();
    setStatus("syncing");
    const result = await saveTracker(passcode, asStored(localLists()), version);
    if (result.status === "saved") {
      version = result.version;
      setStatus("synced");
      return;
    }
    // Another device saved first: merge its copy and try once more.
    if (retried) throw new ChatRequestError("Sync conflict.", 409);
    await absorb(result.current, true);
  }

  const onLocalChange = () => {
    if (stopped || disabled) return;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => enqueue(push), saveDelayMs);
  };

  const onVisible = () => {
    if (
      document.visibilityState === "visible" &&
      Date.now() - lastPull > PULL_ON_FOCUS_MS
    )
      enqueue(pull);
  };

  const unsubscribes = [applicationsList, jobFeedbackList, applyAnywayList].map(
    (list) => list.subscribeEdits(onLocalChange),
  );
  document.addEventListener("visibilitychange", onVisible);
  enqueue(pull);

  return () => {
    stopped = true;
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    document.removeEventListener("visibilitychange", onVisible);
    window.clearTimeout(saveTimer);
    window.clearTimeout(retryTimer);
    setStatus("off");
  };
};
