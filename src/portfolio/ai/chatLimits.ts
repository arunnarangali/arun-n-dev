// Shared by the chat panel and the Worker, so both agree on what a request may hold.
// Longest new question.
export const MAX_MESSAGE_CHARS = 4000;
// Longest earlier turn sent as context (job lists and long answers); longer ones are shortened.
export const MAX_CONTEXT_MESSAGE_CHARS = 8000;
export const MAX_MESSAGES = 20;
// Total characters of conversation history sent with one request.
export const MAX_HISTORY_CHARS = 24000;
// Turns of history sent with each request.
export const HISTORY_LIMIT = 12;
