// Job finder shared by the chat panel and the chat Worker. Keep it free of React and
// content imports so the Worker bundle stays small.

export type WorkMode = "remote" | "hybrid" | "onsite" | "unknown";

export type JobListing = {
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  experience: string;
  salary: string;
  postedAt: string;
  url: string;
  skills: string[];
  summary: string;
  // Recruiter address when the posting states one, else "".
  contactEmail: string;
};

// A listing left out because it matched a reason the owner gave on an earlier card.
export type SkippedJob = { title: string; company: string; reason: string };

export type JobSearchResult = {
  query: string;
  queries: string[];
  searchedAt: string;
  jobs: JobListing[];
  // True when the Worker served a saved result instead of searching again.
  cached?: boolean;
  // Set when a search failed mid-run, so only some searches ran. Never cached.
  partial?: boolean;
  // Set when that failure was Ollama's quota: searching is blocked for this many seconds.
  retryAfter?: number;
  // Listings left out because of the owner's "Not a fit" feedback.
  skipped?: SkippedJob[];
  // The feedback lines this search was run with.
  preferences?: string[];
  // How many listings were left out because they're already marked applied.
  applied?: number;
};

// A role already marked applied, sent with a search so it isn't listed again.
export type AppliedJob = {
  company: string;
  title: string;
  url: string;
  // ISO time it was marked applied. Only used in the browser (matchApplication) to
  // tell a repost from the same opening; the Worker gets company/title/url only and
  // removes exact-URL matches.
  appliedAt?: string;
};

export type LocationGroup =
  "remote" | "bangalore" | "kerala" | "metro" | "other";
export type RoleGroup = "frontend" | "fullstack" | "senior" | "other";

export const MAX_JOBS = 25;
export const MAX_JOB_QUERY_CHARS = 200;
export const MAX_PREFERENCES = 10;
export const MAX_PREFERENCE_CHARS = 150;

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

// The same posting (URL) or the same role (company + title) — how "Not a fit" marks
// and synced records are matched. Applications use matchApplication, which also
// looks at dates.
export const isSameRole = (a: AppliedJob, b: AppliedJob) => {
  if (a.url && a.url === b.url) return true;
  const key = applicationKey(a.company, a.title);
  return key !== null && key === applicationKey(b.company, b.title);
};

// Same company + title this long after applying, with no posting date, counts as a
// possible new opening rather than the one already applied to.
export const REPOST_WINDOW_DAYS = 60;
export const REPOST_WINDOW_MS = REPOST_WINDOW_DAYS * 24 * 60 * 60_000;

// How a listing relates to tracked applications:
// - "applied": the exact posting (same URL).
// - "sameRole": same company + title, most likely the same opening on another board.
// - "repost": same company + title, posted after the application (or, with no posting
//   date, seen 60+ days later), so it may be a new opening.
// - "applyAnyway": a "sameRole" match the owner said is a different opening.
export type ApplicationStatus =
  "applied" | "sameRole" | "repost" | "applyAnyway";
export type ApplicationMatch<T> = { entry: T; status: ApplicationStatus };

const looksReposted = (entry: AppliedJob, postedAt: string, now: number) => {
  const applied = entry.appliedAt ? Date.parse(entry.appliedAt) : NaN;
  if (Number.isNaN(applied)) return false;
  // A stated posting date settles it; it's only kept when the page states it.
  if (/^\d{4}-\d{2}-\d{2}$/.test(postedAt))
    return postedAt > new Date(applied).toISOString().slice(0, 10);
  return now - applied >= REPOST_WINDOW_MS;
};

const newest = <T extends AppliedJob>(list: T[]) =>
  list.reduce((best, entry) =>
    (entry.appliedAt ?? "") > (best.appliedAt ?? "") ? entry : best,
  );

export const matchApplication = <T extends AppliedJob>(
  list: T[],
  job: AppliedJob & { postedAt?: string },
  {
    now = Date.now(),
    applyAnyway = [],
  }: { now?: number; applyAnyway?: string[] } = {},
): ApplicationMatch<T> | undefined => {
  const byUrl = job.url && list.find((entry) => entry.url === job.url);
  if (byUrl) return { entry: byUrl, status: "applied" };
  const key = applicationKey(job.company, job.title);
  if (key === null) return undefined;
  const sameKey = list.filter(
    (entry) => applicationKey(entry.company, entry.title) === key,
  );
  if (!sameKey.length) return undefined;
  if (job.url && applyAnyway.includes(job.url))
    return { entry: newest(sameKey), status: "applyAnyway" };
  const same = sameKey.find(
    (entry) => !looksReposted(entry, job.postedAt ?? "", now),
  );
  return same
    ? { entry: same, status: "sameRole" }
    : { entry: newest(sameKey), status: "repost" };
};

export const MAX_APPLIED_SENT = 100;

// Field limits for applied roles sent with a search.
export const APPLIED_FIELD_LIMITS = { company: 80, title: 120, url: 500 };

// Applied roles sent with a search. Long text is cut to size (entries imported from a
// CSV can be longer than listings from search). Null when the value isn't a valid list.
export const parseAppliedJobs = (value: unknown): AppliedJob[] | null => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_APPLIED_SENT) return null;
  const list: AppliedJob[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const { company, title, url } = entry as Record<string, unknown>;
    if (
      typeof company !== "string" ||
      typeof title !== "string" ||
      typeof url !== "string"
    )
      return null;
    list.push(clipAppliedJob({ company, title, url }));
  }
  return list;
};

export const clipAppliedJob = ({ company, title, url }: AppliedJob) => ({
  company: company.slice(0, APPLIED_FIELD_LIMITS.company),
  title: title.slice(0, APPLIED_FIELD_LIMITS.title),
  url: url.slice(0, APPLIED_FIELD_LIMITS.url),
});

// Feedback lines sent with a search. Null when the value isn't a valid list.
export const parsePreferences = (value: unknown): string[] | null => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_PREFERENCES) return null;
  const lines: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || entry.length > MAX_PREFERENCE_CHARS)
      return null;
    const line = entry.replace(/\s+/g, " ").trim();
    if (line && !lines.includes(line)) lines.push(line);
  }
  return lines;
};

// Roles and places that match the profile: React/TypeScript frontend, Golang full-stack,
// Kerala as home base, plus remote and the big Indian tech hubs.
// Three broad searches per run: Ollama's free web search quota is small.
const defaultQueries = [
  "React frontend developer jobs Bangalore OR Hyderabad OR Chennai OR Pune",
  "React developer remote jobs India",
  "React OR Golang full stack developer jobs Kochi OR Trivandrum Kerala",
];

export const buildJobQueries = (query = "") => {
  const text = query.trim().slice(0, MAX_JOB_QUERY_CHARS);
  if (!text) return defaultQueries;
  return [`${text} jobs India`, `${text} remote jobs`];
};

const locationPatterns: [LocationGroup, RegExp][] = [
  ["remote", /\bremote\b|work from home|\bwfh\b|anywhere/i],
  [
    "kerala",
    /kerala|kochi|cochin|trivandrum|thiruvananthapuram|kozhikode|calicut|technopark|infopark|thrissur/i,
  ],
  ["bangalore", /bangalore|bengaluru/i],
  [
    "metro",
    /chennai|hyderabad|pune|mumbai|delhi|noida|gurgaon|gurugram|\bncr\b|kolkata|ahmedabad/i,
  ],
];

export const classifyLocation = (
  job: Pick<JobListing, "location" | "workMode">,
): LocationGroup => {
  if (job.workMode === "remote") return "remote";
  return (
    locationPatterns.find(([, pattern]) => pattern.test(job.location))?.[0] ??
    "other"
  );
};

export const classifyRoles = (title: string): RoleGroup[] => {
  const roles: RoleGroup[] = [];
  if (/\b(senior|sr\.?|lead|staff|principal|architect)\b/i.test(title))
    roles.push("senior");
  if (/full.?stack|\bmern\b|backend|golang|\bgo\b|node/i.test(title))
    roles.push("fullstack");
  if (/front.?end|react|\bui\b|javascript|typescript|web/i.test(title))
    roles.push("frontend");
  return roles.length ? roles : ["other"];
};

const text = (value: unknown, max: number) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";

const workModes: WorkMode[] = ["remote", "hybrid", "onsite", "unknown"];

// Validates listings the model extracted. Only URLs that came back from web search are
// kept, so the model can't invent postings.
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// "boards.greenhouse.io" from a posting URL; the URL itself if it can't be parsed.
export const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// "1 minute" / "27 minutes" for a wait given in seconds (never less than 1 minute).
export const formatWait = (seconds: number) => {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export const isEmail = (value: string) =>
  /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);

const junkEmail =
  /no-?reply|donotreply|example\.|sentry|wixpress|\.(png|jpe?g|gif|svg|webp)$|@(gmail|yahoo|hotmail|outlook)\./i;
// Whole words only, so names like "chris" don't count as HR.
const hrWord =
  /^(hr|hrd|careers?|jobs?|talent\w*|recruit\w*|hiring|people|humanresources)$/;
const isHrLike = (localPart: string) =>
  localPart.split(/[._+-]+/).some((word) => hrWord.test(word));

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// True when the page states the YYYY-MM-DD date in any common written form
// ("2026-10-12", "Oct 12, 2026", "12th October 2026", "12/10/2026", ...).
export const pageMentionsDate = (page: string, isoDate: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return false;
  const [, year, mm, dd] = match;
  const day = String(Number(dd));
  const month = monthNames[Number(mm) - 1];
  if (!month) return false;
  const text = page
    .toLowerCase()
    .replace(/(\d)(st|nd|rd|th)\b/g, "$1")
    .replace(/[,.]/g, " ")
    .replace(/\s+/g, " ");
  const short = month.slice(0, 3);
  const forms = [
    isoDate,
    `${year}/${mm}/${dd}`,
    `${dd}/${mm}/${year}`,
    `${dd}-${mm}-${year}`,
    `${mm}/${dd}/${year}`,
    ...[month, short].flatMap((name) => [
      `${name} ${day} ${year}`,
      `${name} ${dd} ${year}`,
      `${day} ${name} ${year}`,
      `${dd} ${name} ${year}`,
    ]),
  ];
  // Whole words only, so "2 october 2026" doesn't match inside "12 october 2026".
  return forms.some((form) =>
    new RegExp(`(^|[^0-9a-z])${escapeRegex(form)}($|[^0-9a-z])`).test(text),
  );
};

// Picks the most likely HR/careers address from web search results. Pure regex, so
// it only returns addresses that literally appear on the pages.
export const pickHrEmail = (
  results: { url: string; content: string }[],
  company: string,
): { email: string; source: string } => {
  const companyKey = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  let best = { email: "", source: "", score: 0 };
  for (const result of results) {
    for (const match of result.content.match(EMAIL_PATTERN) ?? []) {
      const email = match.toLowerCase().replace(/\.$/, "");
      if (junkEmail.test(email)) continue;
      const domain = email.split("@")[1];
      let score = 1;
      if (companyKey && domain.replace(/[^a-z0-9]/g, "").includes(companyKey))
        score += 2;
      if (isHrLike(email.split("@")[0])) score += 2;
      if (score > best.score) {
        best = { email, source: hostname(result.url), score };
      }
    }
  }
  // A lone generic address on an unrelated domain is more likely wrong than right.
  return best.score >= 3
    ? { email: best.email, source: best.source }
    : { email: "", source: "" };
};

export const sanitizeJobs = (
  raw: unknown,
  allowedUrls: Set<string>,
): JobListing[] => {
  const list = (raw as { jobs?: unknown } | null)?.jobs;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const jobs: JobListing[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const url = text(item.url, 500);
    const title = text(item.title, 120);
    if (!title || !allowedUrls.has(url) || seen.has(url)) continue;
    seen.add(url);
    const workMode = workModes.includes(item.workMode as WorkMode)
      ? (item.workMode as WorkMode)
      : "unknown";
    jobs.push({
      title,
      company: text(item.company, 80) || "Unknown company",
      location: text(item.location, 80),
      workMode,
      experience: text(item.experience, 40),
      salary: text(item.salary, 60),
      postedAt: text(item.postedAt, 30),
      url,
      skills: Array.isArray(item.skills)
        ? item.skills
            .map((skill) => text(skill, 30))
            .filter(Boolean)
            .slice(0, 12)
        : [],
      summary: text(item.summary, 400),
      contactEmail: isEmail(text(item.contactEmail, 120))
        ? text(item.contactEmail, 120).toLowerCase()
        : "",
    });
    if (jobs.length >= MAX_JOBS) break;
  }
  return jobs;
};

export const sanitizeSkipped = (raw: unknown): SkippedJob[] => {
  const list = (raw as { skipped?: unknown } | null)?.skipped;
  if (!Array.isArray(list)) return [];
  return list
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Record<string, unknown>;
      const title = text(item.title, 120);
      const reason = text(item.reason, 120);
      if (!title || !reason) return [];
      return [{ title, company: text(item.company, 80), reason }];
    })
    .slice(0, MAX_JOBS);
};

const describeSkipped = (skipped: SkippedJob[]) => {
  if (!skipped.length) return "";
  const examples = skipped
    .slice(0, 3)
    .map(
      (entry) =>
        `${entry.title}${entry.company ? ` at ${entry.company}` : ""} (${entry.reason})`,
    )
    .join("; ");
  const more = skipped.length > 3 ? `; and ${skipped.length - 3} more` : "";
  return ` Skipped ${skipped.length} based on your "Not a fit" feedback: ${examples}${more}.`;
};

export const describeJobResult = (result: JobSearchResult) => {
  const found = result.jobs.length
    ? `Found ${result.jobs.length} job openings${result.query ? ` for "${result.query}"` : " that fit the profile"}.`
    : "No matching job openings found right now.";
  const feedback = result.preferences?.length
    ? ` Used ${result.preferences.length} feedback note${result.preferences.length === 1 ? "" : "s"} from earlier searches.`
    : "";
  const applied = result.applied
    ? ` Left out ${result.applied} you've already applied to.`
    : "";
  return `${found}${applied}${feedback}${describeSkipped(result.skipped ?? [])}`;
};

// Job description (JD) read from the posting for cover letters.
export const JD_MAX_CHARS = 3500;
const JD_MIN_CHARS = 300;

export type JobContext = { url: string; title: string; company: string };

// What a cover letter was based on: the posting's full JD, or (when the page couldn't
// be read) the search summary.
export type JobDescriptionStatus =
  | { status: "full"; source: string }
  | { status: "summary"; reason: "blocked" | "cooldown" | "failed" };

// The job a cover letter is for. Null when it isn't a usable http(s) posting.
export const parseJobContext = (value: unknown): JobContext | null => {
  if (!value || typeof value !== "object") return null;
  const { url, title, company } = value as Record<string, unknown>;
  if (
    typeof url !== "string" ||
    typeof title !== "string" ||
    typeof company !== "string" ||
    url.length > 500 ||
    !/^https?:\/\//i.test(url)
  )
    return null;
  return { url, title: title.slice(0, 120), company: company.slice(0, 80) };
};

const jdHeading =
  /^(#+\s*)?(about (the|this) (role|job|position|opportunity)|job description|role overview|the role|responsibilities|key responsibilities|what you('|’)ll (do|be doing)|your role|requirements|qualifications|what we('|’)re looking for|who you are|skills)\b/i;
const boilerplateLine =
  /^(apply( now)?|save( job)?|share( this job)?|sign in|log in|report (this )?job|similar jobs|cookie|accept( all)?( cookies)?|back to (jobs|search)|easy apply)\b/i;
const unreadableText =
  /sign in to (view|see|continue)|join (now )?to (view|see)|log ?in to (view|see|continue)|captcha|are you a robot|enable javascript|access denied|verify you are human/i;

// The useful part of a fetched posting: from the first JD heading (if any), without
// buttons and banners, cut at a sentence boundary under JD_MAX_CHARS.
export const extractJobDescription = (content: string) => {
  const lines = content
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(
      (line) => line && !boilerplateLine.test(line.replace(/^[#*\->\s]+/, "")),
    );
  const start = lines.findIndex((line) =>
    jdHeading.test(line.replace(/^[*\->\s]+/, "")),
  );
  const text = (start === -1 ? lines : lines.slice(start)).join("\n");
  if (text.length <= JD_MAX_CHARS) return text;
  const cut = text.slice(0, JD_MAX_CHARS);
  const lastStop = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf(".\n"),
    cut.lastIndexOf("\n"),
  );
  return (
    lastStop > JD_MAX_CHARS / 2 ? cut.slice(0, lastStop + 1) : cut
  ).trim();
};

// True when the fetched page isn't the job posting: too short, a sign-in or bot wall,
// or about something else (names neither the company nor any word of the title).
export const looksUnreadable = (content: string, job: JobContext) => {
  if (content.trim().length < JD_MIN_CHARS || unreadableText.test(content))
    return true;
  const text = content.toLowerCase();
  const company = job.company.toLowerCase();
  const titleWords = job.title
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length > 2);
  const mentionsCompany =
    company.length > 2 &&
    company !== "unknown company" &&
    text.includes(company);
  return !mentionsCompany && !titleWords.some((word) => text.includes(word));
};

// Header value for the chat response: "full; source=builtin.com" or "summary; reason=…".
export const formatJobDescriptionHeader = (status: JobDescriptionStatus) =>
  status.status === "full"
    ? `full; source=${status.source}`
    : `summary; reason=${status.reason}`;

export const parseJobDescriptionHeader = (
  value: string | null,
): JobDescriptionStatus | undefined => {
  const match = /^(full|summary);\s*(source|reason)=(.+)$/.exec(value ?? "");
  if (!match) return undefined;
  if (match[1] === "full") return { status: "full", source: match[3].trim() };
  const reason = match[3].trim();
  return {
    status: "summary",
    reason: reason === "blocked" || reason === "cooldown" ? reason : "failed",
  };
};
