import { useRef, useState } from "react";
import { Icon } from "../Icon";
import { formatAppliedDate } from "../../../../portfolio/ai/applications";
import {
  downloadApplicationsCsv,
  importApplicationsCsv,
  unmarkApplied,
  useApplications,
} from "../../../../portfolio/ai/useApplications";

// Tracker for jobs marked as applied. Lives in this browser; CSV moves it elsewhere.
export const ApplicationsList = () => {
  const applications = useApplications();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { added, skipped } = await importApplicationsCsv(file);
      setNotice(
        `Imported ${added}, skipped ${skipped} duplicate${skipped === 1 ? "" : "s"} or invalid row${skipped === 1 ? "" : "s"}.`,
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
          onClick={downloadApplicationsCsv}
          disabled={applications.length === 0}
          className={`ml-auto ${buttonClass}`}
        >
          <Icon name="download" className="text-[13px]" /> Download CSV
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
      {notice && <p className="text-tertiary">{notice}</p>}

      {applications.length === 0 ? (
        <p className="text-on-surface-variant">
          Nothing tracked yet. Use “Mark as applied” after sending a cover
          letter, or “Mark applied” on a job card.
        </p>
      ) : (
        <ul className="divide-y divide-outline-variant/40 rounded-md border border-outline-variant bg-surface-container">
          {applications.map((entry) => (
            <li key={entry.id} className="flex items-start gap-2 px-2.5 py-2">
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
              {entry.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-on-surface-variant hover:text-accent"
                  title="Open the posting"
                >
                  <Icon name="open_in_new" className="text-[14px]" />
                </a>
              )}
              <button
                onClick={() => unmarkApplied(entry.id)}
                className="rounded p-1 text-on-surface-variant hover:text-error"
                title="Remove from applications"
              >
                <Icon name="delete" className="text-[14px]" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-on-surface-variant">
        Saved in this browser only. Download the CSV to keep a backup or move it
        to another device.
      </p>
    </div>
  );
};
