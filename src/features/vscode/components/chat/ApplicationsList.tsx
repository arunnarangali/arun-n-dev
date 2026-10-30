import { useRef, useState } from "react";
import { Icon } from "../Icon";
import { formatAppliedDate } from "../../../../portfolio/ai/applications";
import {
  downloadTrackerCsv,
  hasTrackerData,
  importTrackerCsv,
  unmarkApplied,
  useApplications,
} from "../../../../portfolio/ai/useApplications";
import {
  undoNotFit,
  useJobFeedback,
} from "../../../../portfolio/ai/useJobFeedback";
import {
  undoApplyAnyway,
  useApplyAnyway,
} from "../../../../portfolio/ai/useApplyAnyway";
import { reasonLabel } from "../../../../portfolio/ai/jobFeedback";
import { hostname } from "../../../../portfolio/ai/jobs";

type Tab = "applied" | "notFit" | "applyAnyway";

const listClass =
  "divide-y divide-outline-variant/40 rounded-md border border-outline-variant bg-surface-container";
const rowClass = "flex items-start gap-2 px-2.5 py-2";

const OpenLink = ({ url }: { url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded p-1 text-on-surface-variant hover:text-accent"
    title="Open the posting"
  >
    <Icon name="open_in_new" className="text-[14px]" />
  </a>
);

// Removing syncs as a deletion, so it's removed on other devices too.
const RemoveButton = ({
  onClick,
  title,
}: {
  onClick: () => void;
  title: string;
}) => (
  <button
    onClick={onClick}
    className="rounded p-1 text-on-surface-variant hover:text-error"
    title={title}
    aria-label={title}
  >
    <Icon name="delete" className="text-[14px]" />
  </button>
);
import {
  useTrackerSyncStatus,
  type SyncState,
} from "../../../../portfolio/ai/trackerSync";

const syncLabel: Record<SyncState, { icon: string; text: string; tone: string }> = {
  off: { icon: "cloud_off", text: "Sync off · saved in this browser", tone: "text-on-surface-variant" },
  syncing: { icon: "sync", text: "Syncing…", tone: "text-on-surface-variant" },
  synced: { icon: "cloud_done", text: "Synced", tone: "text-accent" },
  offline: { icon: "cloud_off", text: "Not synced", tone: "text-tertiary" },
  error: { icon: "error", text: "Sync error", tone: "text-error" },
  unconfigured: { icon: "cloud_off", text: "Sync not set up", tone: "text-on-surface-variant" },
};

// "Synced · 12:40" plus why, when sync isn't working.
const SyncStatusLine = () => {
  const status = useTrackerSyncStatus();
  const label = syncLabel[status.state];
  const time =
    status.state === "synced" && status.at
      ? ` · ${new Date(status.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "";
  return (
    <p
      className={`flex items-center gap-1 text-[11px] ${label.tone}`}
      title={status.message || undefined}
      role="status"
    >
      <Icon
        name={label.icon}
        className={`text-[13px] ${status.state === "syncing" ? "animate-spin" : ""}`}
      />
      {label.text}
      {time}
      {status.message && status.state !== "synced" && (
        <span className="text-on-surface-variant">· {status.message}</span>
      )}
    </p>
  );
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

// Tracker for jobs marked as applied. Lives in this browser; the CSV (applications,
// "Not a fit" and "Apply anyway" marks) backs it up or moves it elsewhere.
export const ApplicationsList = () => {
  const applications = useApplications();
  const feedback = useJobFeedback();
  const applyAnywayUrls = useApplyAnyway();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("applied");

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const counts = await importTrackerCsv(file);
      setNotice(
        `Imported ${plural(counts.applications, "application")}, ${counts.feedback} "Not a fit", ${counts.applyAnyway} "Apply anyway". Skipped ${plural(counts.skipped, "duplicate or invalid row")}.`,
      );
    } catch {
      setNotice("Could not read that file. Use a CSV exported from here.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const buttonClass =
    "flex items-center gap-1 rounded border border-outline-variant px-2 py-1 text-[11px] text-on-surface hover:border-primary hover:text-accent disabled:opacity-40";

  return (
    <div className="space-y-2 pl-7 text-[12px]" data-applications-list>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-on-surface">
          {applications.length} application
          {applications.length === 1 ? "" : "s"}
        </span>
        <button
          onClick={downloadTrackerCsv}
          disabled={
            !hasTrackerData({
              applications: applications.length,
              feedback: feedback.length,
              applyAnyway: applyAnywayUrls.length,
            })
          }
          title="Backup of everything you marked (status: Applied / Not a fit / Apply anyway). Import it on another device with Import CSV."
          className={`ml-auto ${buttonClass}`}
        >
          <Icon name="download" className="text-[13px]" /> Download tracker (CSV)
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className={buttonClass}
        >
          <Icon name="upload" className="text-[13px]" /> Import CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => void handleImport(event.target.files?.[0])}
        />
      </div>
      <SyncStatusLine />
      {notice && <p className="text-tertiary">{notice}</p>}

      <div
        className="flex w-fit overflow-hidden rounded border border-outline-variant text-[11px]"
        role="tablist"
        aria-label="Tracked marks"
      >
        {(
          [
            ["applied", "✓ Applied", applications.length],
            ["notFit", "✕ Not a fit", feedback.length],
            ["applyAnyway", "↪ Apply anyway", applyAnywayUrls.length],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-2 py-0.5 transition-colors ${tab === id ? "bg-primary/15 font-semibold text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            {label} <span className="opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {tab === "applied" &&
        (applications.length === 0 ? (
          <p className="text-on-surface-variant">
            Nothing tracked yet. Use “Mark as applied” after sending a cover
            letter, or “Mark applied” on a job card.
          </p>
        ) : (
          <ul className={listClass}>
            {applications.map((entry) => (
              <li key={entry.id} className={rowClass}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-on-surface">
                    {entry.title}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {entry.company} · {formatAppliedDate(entry.appliedAt)} ·{" "}
                    {entry.via === "gmail" ? "Gmail" : "Job site"}
                    {entry.email && ` · ${entry.email}`}
                  </p>
                </div>
                {entry.url && <OpenLink url={entry.url} />}
                <RemoveButton
                  onClick={() => unmarkApplied(entry.id)}
                  title="Remove from applications"
                />
              </li>
            ))}
          </ul>
        ))}

      {tab === "notFit" &&
        (feedback.length === 0 ? (
          <p className="text-on-surface-variant">
            No “Not a fit” marks. Use “Not a fit” on a job card to tell Akaza
            which roles to skip.
          </p>
        ) : (
          <ul className={listClass}>
            {feedback.map((entry) => (
              <li key={entry.id} className={rowClass}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-on-surface">
                    {entry.title}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {entry.company} · {reasonLabel(entry.reason)}
                    {entry.note && ` · “${entry.note}”`} ·{" "}
                    {formatAppliedDate(entry.createdAt)}
                  </p>
                </div>
                {entry.url && <OpenLink url={entry.url} />}
                <RemoveButton
                  onClick={() => undoNotFit(entry.id)}
                  title="Remove this Not a fit mark (Akaza stops skipping similar roles for it)"
                />
              </li>
            ))}
          </ul>
        ))}

      {tab === "applyAnyway" &&
        (applyAnywayUrls.length === 0 ? (
          <p className="text-on-surface-variant">
            No “Apply anyway” marks. They appear when you tell Akaza a posting
            is a different opening from one you applied to.
          </p>
        ) : (
          <ul className={listClass}>
            {applyAnywayUrls.map((url) => (
              <li key={url} className={rowClass}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-snug text-on-surface">
                    {hostname(url)}
                  </p>
                  <p className="truncate text-[11px] text-on-surface-variant">
                    {url}
                  </p>
                </div>
                <OpenLink url={url} />
                <RemoveButton
                  onClick={() => undoApplyAnyway(url)}
                  title="Remove this Apply anyway mark (the job counts as already applied again)"
                />
              </li>
            ))}
          </ul>
        ))}
      <p className="text-[10px] text-on-surface-variant">
        Saved in this browser and synced to your other devices when sync is set
        up. Download the CSV for a backup.
      </p>
    </div>
  );
};
