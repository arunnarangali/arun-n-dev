// CSV files for the job tracker:
// - the tracker backup: everything kept in this browser (applications, "Not a fit"
//   and "Apply anyway" marks), told apart by a readable `status` column, and
//   importable on another device;
// - a results export: every job in one search result with its status.
// Older tracker files used a `kind` column (or none: applications only); they still import.
import {
  createApplication,
  formatAppliedDate,
  type Application,
} from "./applications";
import {
  createJobFeedback,
  isReason,
  reasonLabel,
  type JobFeedback,
} from "./jobFeedback";
import type { ApplicationMatch, JobListing } from "./jobs";

export type TrackerData = {
  applications: Application[];
  feedback: JobFeedback[];
  applyAnyway: string[];
};

type Kind = "application" | "not_a_fit" | "apply_anyway";

const statusLabels: Record<Kind, string> = {
  application: "Applied",
  not_a_fit: "Not a fit",
  apply_anyway: "Apply anyway",
};

const columns = [
  "status",
  "date",
  "company",
  "title",
  "url",
  "via",
  "email",
  "subject",
  "reason",
  "note",
] as const;
type Column = (typeof columns)[number];
type Row = Partial<Record<Column, string>>;

// Spreadsheet apps run cells starting with these as formulas.
const formulaStart = /^[=+\-@\t\r]/;

const csvCell = (value: string) => {
  const safe = formulaStart.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// A CSV document from a header and rows of plain values (escaped and guarded here).
export const toCsv = (header: readonly string[], rows: string[][]) =>
  [header.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join(
    "\r\n",
  );

const toRow = (kind: Kind, row: Row) =>
  columns.map((column) =>
    column === "status" ? statusLabels[kind] : (row[column] ?? ""),
  );

export const toTrackerCsv = ({
  applications,
  feedback,
  applyAnyway,
}: TrackerData) =>
  toCsv(columns, [
    ...applications.map((entry) =>
      toRow("application", { ...entry, date: entry.appliedAt }),
    ),
    ...feedback.map((entry) =>
      toRow("not_a_fit", { ...entry, date: entry.createdAt }),
    ),
    ...applyAnyway.map((url) => toRow("apply_anyway", { url })),
  ]);

// One job from a search result, ready for the results export.
export const RESULTS_COLUMNS = [
  "#",
  "status",
  "applied_on",
  "applied_via",
  "title",
  "company",
  "location",
  "work_mode",
  "experience",
  "fit",
  "posted",
  "url",
  "not_a_fit_reason",
  "note",
] as const;
export type ResultsRow = Record<(typeof RESULTS_COLUMNS)[number], string>;

// A job's row: the same status its card shows. "Applied" covers the exact posting and
// the same role on another board; reposts and "Apply anyway" jobs aren't applied yet.
export const toResultsRow = (
  job: JobListing & { number: number; fit: { score: number } },
  match: ApplicationMatch<Application> | undefined,
  notFit: JobFeedback | undefined,
): ResultsRow => {
  const applied =
    match?.status === "applied" || match?.status === "sameRole"
      ? match.entry
      : undefined;
  const status = applied
    ? match?.status === "sameRole"
      ? "Applied (same role)"
      : "Applied"
    : notFit
      ? "Not a fit"
      : match?.status === "repost"
        ? "Reposted"
        : match?.status === "applyAnyway"
          ? "Apply anyway"
          : "Not applied";
  const earlier =
    !applied && match
      ? `Applied to an earlier posting on ${formatAppliedDate(match.entry.appliedAt)}`
      : "";
  return {
    "#": String(job.number),
    status,
    applied_on: applied ? applied.appliedAt.slice(0, 10) : "",
    applied_via: applied
      ? applied.via === "gmail"
        ? `Gmail${applied.email ? ` (${applied.email})` : ""}`
        : "Job site"
      : "",
    title: job.title,
    company: job.company,
    location: job.location,
    work_mode: job.workMode === "unknown" ? "" : job.workMode,
    experience: job.experience,
    fit: `${job.fit.score}%`,
    posted: job.postedAt,
    url: job.url,
    not_a_fit_reason: notFit ? reasonLabel(notFit.reason) : "",
    note: [notFit?.note, earlier].filter(Boolean).join(" · "),
  };
};

export const toResultsCsv = (rows: ResultsRow[]) =>
  toCsv(
    RESULTS_COLUMNS,
    rows.map((row) => RESULTS_COLUMNS.map((column) => row[column])),
  );

// "Applied", "application", "not_a_fit", "Not a fit"… → the row's kind. Empty means
// an application (files from before the column existed).
const kindOf = (value: string): Kind | null => {
  const key = value.trim().toLowerCase().replace(/[\s_-]+/g, " ");
  if (!key || key === "applied" || key === "application") return "application";
  if (key === "not a fit") return "not_a_fit";
  if (key === "apply anyway") return "apply_anyway";
  return null;
};

const parseRows = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim()));
};

const unguard = (value: string) =>
  /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value;

const validDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Reads a tracker CSV (any column order, new `status` or old `kind`). Rows missing
// what their kind needs (company and title, a valid date or reason, a URL) are counted as skipped.
export const parseTrackerCsv = (
  text: string,
): TrackerData & { invalid: number } => {
  const data: TrackerData & { invalid: number } = {
    applications: [],
    feedback: [],
    applyAnyway: [],
    invalid: 0,
  };
  const [header, ...rows] = parseRows(text.replace(/^\uFEFF/, ""));
  if (!header) return data;
  const names = header.map((value) => value.trim().toLowerCase());
  // Older exports called these columns "kind" and "applied_at".
  const aliases: Partial<Record<Column, string>> = {
    status: "kind",
    date: "applied_at",
  };
  const indexOf = (column: Column) => {
    const index = names.indexOf(column);
    const alias = aliases[column];
    return index === -1 && alias ? names.indexOf(alias) : index;
  };
  const positions = columns.map((column) => [column, indexOf(column)] as const);
  // Imported entries count as changed now (their dates stay as written), so restoring
  // from a backup wins over an earlier deletion when devices sync.
  const importedAt = new Date().toISOString();

  for (const cells of rows) {
    const row = Object.fromEntries(
      positions.map(([column, index]) => [
        column,
        index === -1 ? "" : unguard((cells[index] ?? "").trim()),
      ]),
    ) as Record<Column, string>;
    const target = { company: row.company, title: row.title, url: row.url };
    const kind = kindOf(row.status);
    const date = validDate(row.date);

    if (kind === "application" && row.company && row.title && date) {
      data.applications.push({
        ...createApplication(
          target,
          {
            email: row.email,
            subject: row.subject,
            via: row.via === "gmail" ? "gmail" : "portal",
            note: row.note,
          },
          date,
        ),
        updatedAt: importedAt,
      });
    } else if (
      kind === "not_a_fit" &&
      row.company &&
      row.title &&
      isReason(row.reason)
    ) {
      data.feedback.push({
        ...createJobFeedback(target, row.reason, row.note, date ?? new Date()),
        updatedAt: importedAt,
      });
    } else if (kind === "apply_anyway" && row.url) {
      data.applyAnyway.push(row.url);
    } else data.invalid += 1;
  }
  return data;
};
