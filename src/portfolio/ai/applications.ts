// Job applications marked in the Akaza chat. Pure helpers plus a storage seam: swap
// `localApplicationStore` for a database-backed store later without touching the UI.

export type ApplicationVia = "gmail" | "portal";

export type Application = {
  id: string;
  company: string;
  title: string;
  url: string;
  email: string;
  subject: string;
  appliedAt: string;
  via: ApplicationVia;
  note: string;
};

export type ApplicationTarget = Pick<Application, "company" | "title" | "url">;

export interface ApplicationStore {
  load(): Application[];
  save(list: Application[]): void;
}

const STORAGE_KEY = "vscode-akaza-applications";
// Earlier name of the key. Its entries are merged into the new key once, then removed.
const LEGACY_STORAGE_KEY = "vscode-jarvis-applications";

const readList = (key: string): Application[] => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

export const localApplicationStore: ApplicationStore = {
  load() {
    if (typeof window === "undefined") return [];
    const list = readList(STORAGE_KEY);
    if (window.localStorage.getItem(LEGACY_STORAGE_KEY) === null) return list;
    // One-time move: keep entries from both keys, then drop the old one.
    const merged = mergeApplications(list, readList(LEGACY_STORAGE_KEY)).list;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return merged;
  },
  save(list) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },
};

export const APPLICATIONS_STORAGE_KEY = STORAGE_KEY;
export const LEGACY_APPLICATIONS_STORAGE_KEY = LEGACY_STORAGE_KEY;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\bsr\b\.?/g, "senior")
    .replace(/\bjr\b\.?/g, "junior")
    .replace(/front[\s-]+end/g, "frontend")
    .replace(/back[\s-]+end/g, "backend")
    .replace(/full[\s-]+stack/g, "fullstack")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const UNKNOWN_COMPANY = "unknown company";

// Same role at the same company, even when another job board reposts it. Null when
// the company or title is too vague to identify a role (then only the URL matches).
export const applicationKey = (company: string, title: string) => {
  const companyKey = normalize(company);
  const titleKey = normalize(title);
  if (!companyKey || companyKey === UNKNOWN_COMPANY || !titleKey) return null;
  return `${companyKey}|${titleKey}`;
};

export const findApplication = (
  list: Application[],
  job: ApplicationTarget,
) => {
  const key = applicationKey(job.company, job.title);
  return list.find(
    (entry) =>
      (job.url && entry.url === job.url) ||
      (key !== null && applicationKey(entry.company, entry.title) === key),
  );
};

export const createApplication = (
  target: ApplicationTarget,
  extra: Partial<Pick<Application, "email" | "subject" | "via" | "note">> = {},
  now = new Date(),
): Application => ({
  id: `app-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  company: target.company,
  title: target.title,
  url: target.url,
  email: extra.email ?? "",
  subject: extra.subject ?? "",
  appliedAt: now.toISOString(),
  via: extra.via ?? "portal",
  note: extra.note ?? "",
});

// Keeps one entry per role; the earliest application date wins.
export const mergeApplications = (
  current: Application[],
  incoming: Application[],
) => {
  const merged = [...current];
  let added = 0;
  for (const entry of incoming) {
    const existingIndex = merged.findIndex(
      (item) => item.id === entry.id || findApplication([item], entry),
    );
    if (existingIndex === -1) {
      merged.push(entry);
      added += 1;
    } else if (entry.appliedAt < merged[existingIndex].appliedAt) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        appliedAt: entry.appliedAt,
      };
    }
  }
  merged.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  return { list: merged, added, skipped: incoming.length - added };
};

const columns = [
  ["applied_at", "appliedAt"],
  ["company", "company"],
  ["title", "title"],
  ["url", "url"],
  ["email", "email"],
  ["subject", "subject"],
  ["via", "via"],
  ["note", "note"],
] as const;

// Spreadsheet apps run cells starting with these as formulas.
const formulaStart = /^[=+\-@\t\r]/;

const csvCell = (value: string) => {
  const safe = formulaStart.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const toCsv = (list: Application[]) =>
  [
    columns.map(([header]) => header).join(","),
    ...list.map((entry) =>
      columns.map(([, field]) => csvCell(entry[field])).join(","),
    ),
  ].join("\r\n");

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

// Reads a CSV exported by `toCsv` (any column order). Rows without a company,
// title or valid date are skipped.
export const parseCsv = (text: string): Application[] => {
  const [header, ...rows] = parseRows(text.replace(/^\uFEFF/, ""));
  if (!header) return [];
  const indexOf = (name: string) =>
    header.findIndex((value) => value.trim().toLowerCase() === name);
  const positions = columns.map(
    ([name, field]) => [field, indexOf(name)] as const,
  );
  return rows.flatMap((row) => {
    const value = (field: string) => {
      const position = positions.find(([key]) => key === field)?.[1] ?? -1;
      return position === -1 ? "" : unguard((row[position] ?? "").trim());
    };
    const appliedAt = new Date(value("appliedAt"));
    if (
      !value("company") ||
      !value("title") ||
      Number.isNaN(appliedAt.getTime())
    )
      return [];
    return [
      {
        ...createApplication(
          {
            company: value("company"),
            title: value("title"),
            url: value("url"),
          },
          {
            email: value("email"),
            subject: value("subject"),
            via: value("via") === "gmail" ? "gmail" : "portal",
            note: value("note"),
          },
          appliedAt,
        ),
      },
    ];
  });
};

export const formatAppliedDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
