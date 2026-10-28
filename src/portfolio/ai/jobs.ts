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
};

export type LocationGroup =
  | "remote"
  | "bangalore"
  | "kerala"
  | "metro"
  | "other";
export type RoleGroup = "frontend" | "fullstack" | "senior" | "other";

export const MAX_JOBS = 25;
export const MAX_JOB_QUERY_CHARS = 200;

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

export const describeJobResult = (result: JobSearchResult) =>
  result.jobs.length
    ? `Found ${result.jobs.length} job openings${result.query ? ` for "${result.query}"` : " that fit the profile"}.`
    : "No matching job openings found right now.";
