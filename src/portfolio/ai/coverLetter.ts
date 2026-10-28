import { aboutContent, socials } from "../content";

export type CoverLetterTarget = {
  title: string;
  company: string;
  url: string;
  email: string;
};

const PORTFOLIO_URL = "https://arunnarangali.github.io/arun-n-dev/";
// Gmail ignores very long compose URLs; past this the body goes via the clipboard.
export const MAX_COMPOSE_URL_CHARS = 7500;

const socialValue = (label: string) =>
  socials.find((entry) => entry.label === label)?.value ?? "";

export const ownerEmail = socialValue("Direct Email");

export const emailSignature = () =>
  [
    aboutContent.name,
    ownerEmail,
    socialValue("Secure Line"),
    socialValue("Professional Orbit"),
    `Portfolio: ${PORTFOLIO_URL}`,
  ]
    .filter(Boolean)
    .join("\n");

const stripMarkdown = (text: string) =>
  text
    .replace(/^```\w*\n?|```$/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, "$1$2")
    .replace(/(^|\W)[*_](\S[^*_]*?)[*_](?=\W|$)/g, "$1$2")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Splits a JARVIS letter into subject and plain-text body.
export const parseCoverLetter = (text: string, target: CoverLetterTarget) => {
  const plain = stripMarkdown(text);
  const match = /^\s*subject\s*:\s*(.+)$/im.exec(plain);
  const subject =
    match?.[1].trim() ||
    `Application for ${target.title} at ${target.company} — ${aboutContent.name}`;
  const body = (match ? plain.replace(match[0], "") : plain).trim();
  return { subject, body };
};

export const buildGmailComposeUrl = ({
  from,
  to,
  subject,
  body,
}: {
  from: string;
  to: string;
  subject: string;
  body: string;
}) => {
  const params = new URLSearchParams({ view: "cm", fs: "1", to, su: subject });
  if (body) params.set("body", body);
  // /u/<email>/ picks the matching signed-in Google account.
  const account = from ? `u/${encodeURIComponent(from)}/` : "";
  return `https://mail.google.com/mail/${account}?${params.toString()}`;
};

// Subject plus body with the contact signature appended (the letter's own sign-off
// usually ends with the name already, so it isn't repeated).
export const composeCoverLetterEmail = (
  text: string,
  target: CoverLetterTarget,
) => {
  const { subject, body } = parseCoverLetter(text, target);
  const lastLine = body.split("\n").pop()?.trim() ?? "";
  const signature = emailSignature()
    .split("\n")
    .filter((line, index) => !(index === 0 && line === lastLine))
    .join("\n");
  return { subject, body: `${body}\n\n${signature}` };
};
