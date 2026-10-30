// Helpers for the chat input's AI tools: "Improve my message" (✨) and the suggested
// reply that Tab accepts. Shared by the chat panel and the Worker, so keep it free of
// React, `window` and content imports.
import { MAX_MESSAGE_CHARS } from "./chatLimits";

// Visitors get this many uses of each tool a day; the owner has a looser limit.
export const VISITOR_DAILY_LIMIT = 3;
export const MIN_ENHANCE_CHARS = 3;
export const MAX_SUGGESTION_CHARS = 120;
// Conversation sent to write a suggestion: the last few turns, each shortened.
export const SUGGEST_TURNS = 4;
export const SUGGEST_TURN_CHARS = 600;

export const enhanceSystemPrompt = `You rewrite a chat message that a person is about to send to an AI assistant.
Rules:
- The message may be typed fast, with typos that hide words. Work out the words the person most likely meant (for example "tak nay project thta recently" means "take any project that I recently worked on").
- Fix spelling, grammar and punctuation, and make it clear and easy to understand.
- Keep the meaning, intent, language, tone and first person. A request stays a request, a question stays a question. Keep it about the same length.
- Do not answer the message, ask anything back, or add facts, names, details or requests that are not in it.
- Keep URLs, code, numbers, names and anything starting with "/" exactly as written.
- If the message is already clear and correct, return it unchanged.
Output only the rewritten message: no quotes, labels, explanations or markdown.`;

export const suggestSystemPrompt = `You predict how a person will reply in a chat with an AI assistant.
The assistant's last message asks the person a question.
Write the single most likely short reply the person would send, in their voice (first person), at most ${MAX_SUGGESTION_CHARS} characters.
- Never invent names of companies, people, products, places, numbers or dates that are not in the conversation.
- If the question asks for details you don't know, answer only the parts you can (for example a choice between options the assistant offered), or reply with a short, natural next step.
- Do not repeat the question or address the assistant by name.
Example: if the assistant asks "Which company and job title should I use, and should it focus on React or Next.js?" and the conversation names no company, a good reply is "Focus on React. I'll share the company and role next." A bad reply is "XYZ Corp, Frontend Engineer, focus on React." because it makes up a company.
Output only the reply text: no quotes, labels or explanations.`;

// What can trail a question without changing it: spaces, markdown (bold, code spans,
// quotes, links) and emoji, as in "**Which one?**" or "Want me to draft it? 🙂".
const trailingNoise = /[\s*_`~)\]"'”’>\p{Extended_Pictographic}\uFE0F]+$/u;

// True when the answer's last paragraph ends with a question, i.e. the AI is waiting
// for the person to choose or answer something. Code blocks and tables don't count.
export const endsWithQuestion = (answer: string) => {
  const withoutCode = answer.replace(/```[\s\S]*?```/g, "").trim();
  const lastLine = withoutCode.split("\n").at(-1)?.trim() ?? "";
  if (!lastLine || lastLine.startsWith("|")) return false;
  return lastLine.replace(trailingNoise, "").endsWith("?");
};

const URL_PATTERN = /https?:\/\/[^\s)>\]]+/g;

// Removes what models wrap answers in: code fences, "Here's the rewritten message:",
// labels like "Rewritten:", and surrounding quotes.
const unwrap = (output: string) => {
  let text = output.trim();
  text = text.replace(/^```\w*\n?([\s\S]*?)\n?```$/, "$1").trim();
  text = text
    .replace(
      /^(here(?:'s| is)[^:\n]*:|(?:rewritten|improved|revised|corrected|suggested)(?: message| reply| version)?\s*:|reply\s*:|message\s*:)\s*/i,
      "",
    )
    .trim();
  const quoted = /^(["“'])([\s\S]*)(["”'])$/.exec(text);
  if (quoted) text = quoted[2].trim();
  return text;
};

export type RewriteResult = { text: string; changed: boolean };

// Accepts the model's rewrite only if it looks like a rewrite: not empty, not much
// longer, under the message limit, and keeping every URL from the original.
export const cleanRewrite = (original: string, output: string): RewriteResult => {
  const text = unwrap(output);
  const urls = original.match(URL_PATTERN) ?? [];
  const valid =
    text.length > 0 &&
    text.length <= Math.min(original.length * 2 + 200, MAX_MESSAGE_CHARS) &&
    urls.every((url) => text.includes(url));
  if (!valid) return { text: original, changed: false };
  return { text, changed: text !== original.trim() };
};

// One line, short, and not just the question repeated back. Empty when unusable.
export const cleanSuggestion = (output: string, lastQuestion = "") => {
  // First line only, then unwrap it on its own, so quotes around it come off too.
  const line = unwrap(unwrap(output).split("\n")[0] ?? "");
  if (!line || line.length > MAX_SUGGESTION_CHARS) return "";
  if (lastQuestion && line.toLowerCase() === lastQuestion.trim().toLowerCase())
    return "";
  return line;
};

export type PromptTurn = { role: "user" | "assistant"; content: string };

// Text for ✨: a non-empty string within the message limit that isn't a slash command.
export const parseEnhanceText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (
    text.length < MIN_ENHANCE_CHARS ||
    text.length > MAX_MESSAGE_CHARS ||
    text.startsWith("/")
  )
    return null;
  return text;
};

// Conversation for a suggestion: the last few turns, shortened, ending with the
// assistant's question.
export const parseSuggestTurns = (value: unknown): PromptTurn[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const turns: PromptTurn[] = [];
  for (const entry of value.slice(-SUGGEST_TURNS)) {
    if (
      !entry ||
      (entry.role !== "user" && entry.role !== "assistant") ||
      typeof entry.content !== "string"
    )
      return null;
    const content = entry.content.trim();
    if (!content) continue;
    turns.push({
      role: entry.role,
      content:
        content.length > SUGGEST_TURN_CHARS
          ? `…${content.slice(-SUGGEST_TURN_CHARS)}`
          : content,
    });
  }
  return turns.at(-1)?.role === "assistant" ? turns : null;
};

// The conversation as one block for the suggestion model, so it can't be mistaken
// for instructions to follow.
export const formatTurnsForSuggestion = (turns: PromptTurn[]) =>
  turns
    .map(
      (turn) =>
        `${turn.role === "user" ? "Person" : "Assistant"}: ${turn.content}`,
    )
    .join("\n\n");
