import { useEffect, useMemo, useState } from "react";
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
  type RoleGroup,
} from "../../../../portfolio/ai/jobs";
import { rankJobsByFit } from "../../../../portfolio/ai/modelHistory";
import {
  findApplication,
  formatAppliedDate,
  type Application,
} from "../../../../portfolio/ai/applications";
import {
  downloadApplicationsCsv,
  markApplied,
  useApplications,
} from "../../../../portfolio/ai/useApplications";

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
  const [showApplied, setShowApplied] = useState(true);
  const applications = useApplications();

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

  const appliedFor = (job: JobListing): Application | undefined =>
    findApplication(applications, job);
  const appliedCount = ranked.filter((job) => appliedFor(job)).length;

  const visible = ranked
    .filter(
      (job) =>
        locations.has(job.locationGroup) &&
        job.roles.some((role) => roles.has(role)) &&
        (showApplied || !appliedFor(job)),
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
    <div className="space-y-2 pl-7 text-[12px]">
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
        <Chip
          label="✓ Applied"
          count={appliedCount}
          active={showApplied}
          onClick={() => setShowApplied((current) => !current)}
        />
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

      {visible.length === 0 && (
        <p className="py-2 text-on-surface-variant">
          No openings match these filters.
        </p>
      )}

      {visible.map((job) => {
        const applied = appliedFor(job);
        return (
        <article
          key={job.url}
          data-job-card
          data-applied={applied ? "true" : undefined}
          className={`rounded-md border bg-surface-container p-2.5 transition-colors hover:border-primary/60 ${applied ? "border-accent/50 opacity-75 hover:opacity-100" : "border-outline-variant"}`}
        >
          {applied && (
            <p
              className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-accent"
              title={applied.email ? `Sent to ${applied.email}` : "Applied on the job site"}
            >
              <Icon name="task_alt" className="text-[14px]" />
              Applied · {formatAppliedDate(applied.appliedAt)}
              {applied.via === "gmail" && " · via Gmail"}
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
              <p className="truncate text-on-surface-variant">{job.company}</p>
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
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-semibold text-on-primary hover:opacity-90"
              title={`Open on ${hostname(job.url)}`}
            >
              Apply <Icon name="open_in_new" className="text-[12px]" />
            </a>
            <button
              onClick={() => onDraft(job)}
              disabled={isBusy}
              className="flex items-center gap-1 rounded border border-outline-variant px-2 py-1 text-[11px] text-on-surface hover:border-primary hover:text-accent disabled:opacity-40"
              title="Ask Akaza to draft a cover letter for this opening"
            >
              <Icon name="edit_note" className="text-[13px]" /> Cover letter
            </button>
            {!applied && (
              <button
                onClick={() => markApplied(job, { via: "portal" })}
                className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-on-surface-variant hover:text-accent"
                title="Applied on the job site? Mark it so Akaza remembers"
              >
                <Icon name="check" className="text-[13px]" /> Mark applied
              </button>
            )}
          </div>
        </article>
        );
      })}

      <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-on-surface-variant">
        <span>
          {applications.length} application
          {applications.length === 1 ? "" : "s"} tracked
        </span>
        <button
          onClick={downloadApplicationsCsv}
          disabled={applications.length === 0}
          className="text-primary hover:text-accent disabled:opacity-40"
        >
          Download CSV
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
