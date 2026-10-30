import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../Icon";
import { analyzeJobFit } from "../../../../portfolio/jobFit";
import {
  classifyLocation,
  classifyRoles,
  type JobListing,
  type JobSearchResult,
  type LocationGroup,
  formatWait,
  hostname,
  REPOST_WINDOW_DAYS,
  type ApplicationMatch,
  type RoleGroup,
} from "../../../../portfolio/ai/jobs";
import { rankJobsByFit } from "../../../../portfolio/ai/modelHistory";
import {
  toResultsCsv,
  toResultsRow,
} from "../../../../portfolio/ai/trackerCsv";
import {
  formatAppliedDate,
  matchApplication,
  type Application,
} from "../../../../portfolio/ai/applications";
import {
  applyAnyway,
  undoApplyAnyway,
  useApplyAnyway,
} from "../../../../portfolio/ai/useApplyAnyway";
import {
  downloadCsv,
  fileTimestamp,
  getApplications,
  markApplied,
  unmarkApplied,
  useApplications,
} from "../../../../portfolio/ai/useApplications";
import {
  feedbackReasons,
  findFeedback,
  MAX_FEEDBACK_NOTE_CHARS,
  reasonLabel,
  type FeedbackReason,
  type JobFeedback,
} from "../../../../portfolio/ai/jobFeedback";
import {
  getJobFeedback,
  markNotFit,
  undoNotFit,
  useJobFeedback,
} from "../../../../portfolio/ai/useJobFeedback";

const locationFilters: { id: LocationGroup; label: string }[] = [
  { id: "remote", label: "Remote" },
  { id: "bangalore", label: "Bangalore" },
  { id: "kerala", label: "Kerala" },
  { id: "metro", label: "Other metros" },
  { id: "other", label: "Other" },
];

const roleFilters: { id: RoleGroup; label: string }[] = [
  { id: "frontend", label: "Frontend" },
  { id: "fullstack", label: "Full-stack" },
  { id: "senior", label: "Senior" },
  { id: "other", label: "Other" },
];

type SortOrder = "fit" | "newest";

type JobStatus = {
  match?: ApplicationMatch<Application>;
  notFit?: JobFeedback;
  isApplied: boolean;
  view: JobView;
};

// Which cards are listed: new ones, ones marked applied, or ones marked not a fit.
type JobView = "open" | "applied" | "notFit";

// Shown for a few seconds after a card moves out of the current view.
// `to: "open"` is an "Apply anyway" from the Applied tab.
type Moved = { title: string; to: JobView; job: JobListing };

const movedText: Record<JobView, { done: string; view: string }> = {
  applied: { done: "as applied", view: "applied" },
  notFit: { done: "as not a fit", view: "not a fit" },
  open: { done: "as a different opening", view: "open" },
};
const MOVED_NOTICE_MS = 6000;

type RankedJob = JobListing & {
  fit: ReturnType<typeof analyzeJobFit>;
  number: number;
  locationGroup: LocationGroup;
  roles: RoleGroup[];
};

const toggle = <T,>(set: Set<T>, value: T) => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

const viewTabs: { id: JobView; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "applied", label: "✓ Applied" },
  { id: "notFit", label: "✕ Not a fit" },
];

type ChipProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

const Chip = ({ label, count, active, onClick }: ChipProps) => (
  <button
    onClick={onClick}
    disabled={count === 0}
    className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors disabled:opacity-40 ${active ? "border-primary bg-primary/15 text-primary" : "border-outline-variant text-on-surface-variant hover:text-on-surface"}`}
  >
    {label} <span className="opacity-70">{count}</span>
  </button>
);

// Inline "Not a fit" form on a card: a preset reason plus an optional note.
const NotFitForm = ({
  job,
  onClose,
  onSaved,
}: {
  job: JobListing;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [reason, setReason] = useState<FeedbackReason>("above-experience");
  const [note, setNote] = useState("");
  // "Other" says nothing on its own, so it needs a note.
  const canSave = reason !== "other" || note.trim() !== "";

  const save = () => {
    if (!canSave) return;
    markNotFit(job, reason, note);
    onClose();
    onSaved();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="mt-2 space-y-1.5 rounded border border-outline-variant bg-surface-container-low p-2"
    >
      <p className="text-[11px] text-on-surface-variant">
        Why isn't this a fit? Akaza will leave out similar roles next time.
      </p>
      <div
        className="flex flex-wrap gap-1"
        role="radiogroup"
        aria-label="Reason"
      >
        {feedbackReasons.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={reason === entry.id}
            onClick={() => setReason(entry.id)}
            className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${reason === entry.id ? "border-primary bg-primary/15 text-primary" : "border-outline-variant text-on-surface-variant hover:text-on-surface"}`}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        maxLength={MAX_FEEDBACK_NOTE_CHARS}
        placeholder={
          reason === "other"
            ? "Tell Akaza why (required)"
            : "Optional: e.g. needs 6+ years, I have 3"
        }
        aria-label="Reason in your own words"
        className="w-full rounded border border-outline-variant bg-surface-container px-1.5 py-1 text-[12px] text-on-surface outline-none focus:border-primary"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!canSave}
          className="rounded bg-primary px-2 py-1 text-[11px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-on-surface-variant hover:text-on-surface"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

type JobResultsProps = {
  result: JobSearchResult;
  isBusy: boolean;
  // Time (ms) until Ollama's web-search cool-down ends; 0 when searching is allowed.
  blockedUntil?: number;
  onRefresh: (query: string) => void;
  onDraft: (job: JobListing) => void;
};

export const JobResults = ({
  result,
  isBusy,
  blockedUntil = 0,
  onRefresh,
  onDraft,
}: JobResultsProps) => {
  const [now, setNow] = useState(() => Date.now());
  const isCoolingDown = blockedUntil > now;
  const waitText = formatWait((blockedUntil - now) / 1000);

  // Tick while cooling down so the countdown and the Refresh button update.
  useEffect(() => {
    if (!isCoolingDown) return;
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, [isCoolingDown]);

  const refreshTitle = isCoolingDown
    ? `Web search available again in ${waitText} (Ollama free plan limit)`
    : "Search again (fresh results)";
  const [locations, setLocations] = useState(
    () => new Set(locationFilters.map((entry) => entry.id)),
  );
  const [roles, setRoles] = useState(
    () => new Set(roleFilters.map((entry) => entry.id)),
  );
  const [sort, setSort] = useState<SortOrder>("fit");
  const [view, setView] = useState<JobView>("open");
  const [moved, setMoved] = useState<Moved | null>(null);
  const movedTimer = useRef(0);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const applications = useApplications();
  const feedback = useJobFeedback();
  const applyAnywayUrls = useApplyAnyway();

  const ranked = useMemo<RankedJob[]>(
    () =>
      rankJobsByFit(result.jobs).map(({ job, fit, number }) => ({
        ...job,
        fit,
        number,
        locationGroup: classifyLocation(job),
        roles: classifyRoles(job.title),
      })),
    [result.jobs],
  );

  // Each job's tracker status, worked out once per change instead of per use.
  const statusByUrl = useMemo(() => {
    const statuses = new Map<string, JobStatus>();
    for (const job of ranked) {
      const match = matchApplication(applications, job, {
        applyAnyway: applyAnywayUrls,
      });
      const notFit = findFeedback(feedback, job);
      // The exact posting, or most likely the same opening on another board.
      const isApplied =
        match?.status === "applied" || match?.status === "sameRole";
      statuses.set(job.url, {
        match,
        notFit,
        isApplied,
        // Applied wins over "not a fit": once applied, that's what matters.
        view: isApplied ? "applied" : notFit ? "notFit" : "open",
      });
    }
    return statuses;
  }, [ranked, applications, feedback, applyAnywayUrls]);
  // Every job in this result (not just the visible tab), best fit first, with the
  // same status the cards show.
  const downloadResults = () => {
    const rows = ranked.map((job) => {
      const { match, notFit } = statusOf(job);
      return toResultsRow(job, match, notFit);
    });
    const name =
      result.query
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "fit";
    downloadCsv(`akaza-jobs-${name}-${fileTimestamp()}.csv`, toResultsCsv(rows));
  };

  const statusOf = (job: JobListing) =>
    statusByUrl.get(job.url) ?? { isApplied: false, view: "open" as const };
  const viewCount = (id: JobView) =>
    ranked.filter((job) => statusOf(job).view === id).length;
  const skipped = result.skipped ?? [];
  // How this search used your marks, so it's visible, not just told to the model.
  const notes = result.preferences?.length ?? 0;
  const feedbackSummary = [
    result.applied
      ? `Left out ${result.applied} you've already applied to`
      : "",
    notes
      ? `Used ${notes} "Not a fit" note${notes === 1 ? "" : "s"} from earlier searches`
      : "",
    skipped.length
      ? `Skipped ${skipped.length} similar role${skipped.length === 1 ? "" : "s"} (see below)`
      : notes
        ? "Nothing matched them this time"
        : "",
  ].filter(Boolean);

  useEffect(() => () => window.clearTimeout(movedTimer.current), []);

  const showMoved = (job: JobListing, to: Moved["to"]) => {
    window.clearTimeout(movedTimer.current);
    setMoved({ title: job.title, to, job });
    movedTimer.current = window.setTimeout(
      () => setMoved(null),
      MOVED_NOTICE_MS,
    );
  };

  const undoMoved = () => {
    if (!moved) return;
    if (moved.to === "open") undoApplyAnyway(moved.job.url);
    else if (moved.to === "notFit") {
      const entry = findFeedback(getJobFeedback(), moved.job);
      if (entry) undoNotFit(entry.id);
    } else {
      // Marking applied stores the posting's URL, so this finds that entry.
      const match = matchApplication(getApplications(), moved.job);
      if (match?.status === "applied") unmarkApplied(match.entry.id);
    }
    window.clearTimeout(movedTimer.current);
    setMoved(null);
  };

  const visible = ranked
    .filter(
      (job) =>
        locations.has(job.locationGroup) &&
        job.roles.some((role) => roles.has(role)) &&
        statusOf(job).view === view,
    )
    .sort((a, b) =>
      sort === "fit"
        ? a.number - b.number
        : (b.postedAt || "").localeCompare(a.postedAt || ""),
    );

  const searchedAt = new Date(result.searchedAt).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (result.jobs.length === 0) {
    return (
      <div className="pl-7 text-[12px] text-on-surface-variant">
        <p>
          No matching openings came back from the job boards. Try a different
          search, e.g. `/jobs react remote`.
        </p>
        <button
          onClick={() => onRefresh(result.query)}
          disabled={isBusy || isCoolingDown}
          title={refreshTitle}
          className="mt-2 flex items-center gap-1 text-primary hover:text-accent disabled:opacity-40"
        >
          <Icon name="refresh" className="text-[14px]" /> Search again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 pl-7 text-[12px]" data-job-results>
      <div className="flex items-center justify-between gap-2 text-on-surface-variant">
        <span>
          <span className="font-semibold text-on-surface">
            {result.jobs.length} openings
          </span>
          {result.query ? ` for "${result.query}"` : ""} · {searchedAt}
          {result.cached && " · cached"}
          {isCoolingDown && (
            <span className="text-tertiary"> · refresh in {waitText}</span>
          )}
        </span>
        <button
          onClick={() => onRefresh(result.query)}
          disabled={isBusy || isCoolingDown}
          title={refreshTitle}
          className="rounded p-1 hover:bg-surface-container-high hover:text-accent disabled:opacity-40"
        >
          <Icon name="refresh" className="text-[15px]" />
        </button>
      </div>

      {feedbackSummary.length > 0 && (
        <p
          className="flex items-start gap-1.5 rounded border border-outline-variant/60 bg-surface-container px-2 py-1 text-[11px] text-on-surface-variant"
          role="status"
        >
          <Icon name="smart_toy" className="mt-px text-[13px] text-primary" />
          <span>{feedbackSummary.join(" · ")}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {locationFilters.map((entry) => (
          <Chip
            key={entry.id}
            label={entry.label}
            count={
              ranked.filter((job) => job.locationGroup === entry.id).length
            }
            active={locations.has(entry.id)}
            onClick={() => setLocations((current) => toggle(current, entry.id))}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {roleFilters.map((entry) => (
          <Chip
            key={entry.id}
            label={entry.label}
            count={ranked.filter((job) => job.roles.includes(entry.id)).length}
            active={roles.has(entry.id)}
            onClick={() => setRoles((current) => toggle(current, entry.id))}
          />
        ))}
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOrder)}
          className="ml-auto rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 text-[11px] text-on-surface outline-none"
          aria-label="Sort openings"
        >
          <option value="fit">Best fit</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div
        className="flex w-fit overflow-hidden rounded border border-outline-variant text-[11px]"
        role="tablist"
        aria-label="Show openings"
      >
        {viewTabs.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            aria-selected={view === entry.id}
            onClick={() => setView(entry.id)}
            className={`px-2 py-0.5 transition-colors ${view === entry.id ? "bg-primary/15 font-semibold text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            {entry.label}{" "}
            <span className="opacity-70">{viewCount(entry.id)}</span>
          </button>
        ))}
      </div>

      {moved && (
        <p
          className="flex flex-wrap items-center gap-x-2 text-[11px] text-on-surface-variant"
          role="status"
        >
          <span>
            Marked <span className="text-on-surface">{moved.title}</span>{" "}
            {movedText[moved.to].done}.
          </span>
          <button
            onClick={undoMoved}
            className="text-primary hover:text-accent"
          >
            Undo
          </button>
          <button
            onClick={() => {
              setView(moved.to);
              setMoved(null);
            }}
            className="text-primary hover:text-accent"
          >
            View {movedText[moved.to].view}
          </button>
        </p>
      )}

      {skipped.length > 0 && (
        <details className="rounded border border-outline-variant/60 px-2 py-1 text-[11px] text-on-surface-variant">
          <summary className="cursor-pointer">
            Skipped {skipped.length} based on your "Not a fit" feedback
          </summary>
          <ul className="mt-1 space-y-0.5">
            {skipped.map((entry, index) => (
              <li key={`${entry.title}-${index}`}>
                <span className="text-on-surface">{entry.title}</span>
                {entry.company && ` · ${entry.company}`} · {entry.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      {visible.length === 0 && (
        <p className="py-2 text-on-surface-variant">
          {view === "applied"
            ? "No openings here marked applied yet. Use Mark applied on a card after applying."
            : view === "notFit"
              ? "No openings here marked not a fit."
              : "No new openings match these filters. Check the Applied tab or search again."}
        </p>
      )}

      {visible.map((job) => {
        const { match, notFit, isApplied: appliedView } = statusOf(job);
        const applied: Application | undefined =
          match?.status === "applied" ? match.entry : undefined;
        // A new application for the same role, not a duplicate of the earlier one.
        const separate =
          match?.status === "repost" || match?.status === "applyAnyway";
        return (
          <article
            key={job.url}
            data-job-card
            data-applied={appliedView ? "true" : undefined}
            className={`rounded-md border bg-surface-container p-2.5 transition-colors hover:border-primary/60 ${appliedView ? "border-accent/50 opacity-75 hover:opacity-100" : notFit ? "border-outline-variant opacity-60 hover:opacity-100" : "border-outline-variant"}`}
          >
            {notFit && (
              <p className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-on-surface-variant">
                <Icon name="block" className="text-[14px]" />
                Not a fit · {reasonLabel(notFit.reason)}
                {notFit.note && ` · "${notFit.note}"`}
                <button
                  onClick={() => undoNotFit(notFit.id)}
                  className="underline hover:text-on-surface"
                >
                  Undo
                </button>
              </p>
            )}
            {applied && (
              <p
                className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-accent"
                title={
                  applied.email
                    ? `Sent to ${applied.email}`
                    : "Applied on the job site"
                }
              >
                <Icon name="task_alt" className="text-[14px]" />
                Applied · {formatAppliedDate(applied.appliedAt)}
                {applied.via === "gmail" && " · via Gmail"}
                <button
                  onClick={() => unmarkApplied(applied.id)}
                  className="font-normal text-on-surface-variant underline hover:text-on-surface"
                >
                  Undo
                </button>
              </p>
            )}
            {match?.status === "sameRole" && (
              <p className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-accent">
                <Icon name="task_alt" className="text-[14px]" />
                Looks like the role you applied to on{" "}
                {formatAppliedDate(match.entry.appliedAt)}
                <button
                  onClick={() => {
                    applyAnyway(job.url);
                    showMoved(job, "open");
                  }}
                  className="ml-1 flex items-center gap-0.5 rounded border border-outline-variant px-1.5 py-0.5 font-semibold text-on-surface hover:border-primary hover:text-accent"
                  title="A different opening (another team, city or a new posting)? Move it to Open"
                >
                  <Icon name="undo" className="text-[12px]" /> Apply anyway
                </button>
              </p>
            )}
            {match?.status === "repost" && (
              <p
                className="mb-1.5 flex items-center gap-1 text-[11px] text-primary"
                title={`Same role, posted after you applied${job.postedAt ? "" : ` (no posting date, but it's been ${REPOST_WINDOW_DAYS}+ days)`}. It may be a new opening.`}
              >
                <Icon name="autorenew" className="text-[14px]" />
                Reposted · you applied on{" "}
                {formatAppliedDate(match.entry.appliedAt)}
              </p>
            )}
            {match?.status === "applyAnyway" && (
              <p className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-on-surface-variant">
                <Icon name="call_split" className="text-[14px]" />
                Similar to a role you applied to on{" "}
                {formatAppliedDate(match.entry.appliedAt)}
                <button
                  onClick={() => undoApplyAnyway(job.url)}
                  className="underline hover:text-on-surface"
                  title="Treat it as the same opening again"
                >
                  Undo
                </button>
              </p>
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold leading-snug text-on-surface">
                  <span
                    className="mr-1 font-mono text-[11px] text-on-surface-variant"
                    title={`Job #${job.number}: ask Akaza about it by number, e.g. "cover letter for #${job.number}"`}
                  >
                    #{job.number}
                  </span>
                  {job.title}
                </h3>
                <p className="truncate text-on-surface-variant">
                  {job.company}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${job.fit.score >= 60 ? "bg-accent/20 text-accent" : job.fit.score >= 35 ? "bg-primary/15 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}
                title="Fit score from the Job Fit analyzer"
              >
                {job.fit.score}% fit
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-on-surface-variant">
              {job.location && (
                <span className="flex items-center gap-0.5">
                  <Icon name="location_on" className="text-[13px]" />
                  {job.location}
                </span>
              )}
              {job.workMode !== "unknown" && (
                <span className="capitalize">{job.workMode}</span>
              )}
              {job.experience && <span>{job.experience}</span>}
              {job.salary && <span>{job.salary}</span>}
              {job.postedAt && <span>Posted {job.postedAt}</span>}
              <span className="truncate">{hostname(job.url)}</span>
            </div>

            {job.summary && (
              <p className="mt-1.5 text-on-surface">{job.summary}</p>
            )}

            {(job.fit.matched.length > 0 || job.fit.missing.length > 0) && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {job.fit.matched.map((skill) => (
                  <span
                    key={skill}
                    className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent"
                  >
                    {skill}
                  </span>
                ))}
                {job.fit.missing.map((skill) => (
                  <span
                    key={skill}
                    className="rounded bg-tertiary/15 px-1.5 py-0.5 text-[10px] text-tertiary"
                    title="Not in your profile yet"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 whitespace-nowrap">
              {appliedView ? (
                <>
                  <span
                    className="flex items-center gap-1 rounded border border-accent/50 bg-accent/15 px-2 py-1 text-[11px] font-semibold text-accent"
                    title={
                      match
                        ? `Applied on ${formatAppliedDate(match.entry.appliedAt)}`
                        : "Applied"
                    }
                  >
                    <Icon name="task_alt" className="text-[13px]" /> Applied
                  </span>
                  {/* The posting stays one click away, without looking like a call to apply again. */}
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-on-surface-variant hover:text-accent"
                    title={`Open the posting on ${hostname(job.url)}`}
                  >
                    View posting{" "}
                    <Icon name="open_in_new" className="text-[12px]" />
                  </a>
                </>
              ) : (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-semibold text-on-primary hover:opacity-90"
                  title={`Open on ${hostname(job.url)}`}
                >
                  Apply <Icon name="open_in_new" className="text-[12px]" />
                </a>
              )}
              <button
                onClick={() => onDraft(job)}
                disabled={isBusy}
                className="flex items-center gap-1 rounded border border-outline-variant px-2 py-1 text-[11px] text-on-surface hover:border-primary hover:text-accent disabled:opacity-40"
                title="Ask Akaza to draft a cover letter for this opening"
              >
                <Icon name="edit_note" className="text-[13px]" /> Cover letter
              </button>
              {!appliedView && (
                <button
                  onClick={() => {
                    markApplied(job, { via: "portal" }, { separate });
                    showMoved(job, "applied");
                  }}
                  className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-on-surface-variant hover:text-accent"
                  title="Applied on the job site? Mark it so Akaza remembers"
                >
                  <Icon name="check" className="text-[13px]" /> Mark applied
                </button>
              )}
              {!appliedView && !notFit && (
                <button
                  onClick={() =>
                    setFeedbackFor((current) =>
                      current === job.url ? null : job.url,
                    )
                  }
                  aria-expanded={feedbackFor === job.url}
                  className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-on-surface-variant hover:text-error"
                  title="Not a fit? Tell Akaza why so later searches skip similar roles"
                >
                  <Icon name="thumb_down" className="text-[13px]" /> Not a fit
                </button>
              )}
            </div>
            {feedbackFor === job.url && !notFit && (
              <NotFitForm
                job={job}
                onClose={() => setFeedbackFor(null)}
                onSaved={() => showMoved(job, "notFit")}
              />
            )}
          </article>
        );
      })}

      <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-on-surface-variant">
        <span>
          {applications.length} application
          {applications.length === 1 ? "" : "s"} tracked
        </span>
        <button
          onClick={downloadResults}
          title="Every job in these results, with its status (Applied / Not applied / Not a fit…)"
          className="text-primary hover:text-accent"
        >
          Download results (CSV)
        </button>
        <span>· type /applied to manage</span>
      </p>
      <p className="text-[10px] text-on-surface-variant">
        Listings come from web search and may be outdated. Check them on the
        source site.
      </p>
    </div>
  );
};
