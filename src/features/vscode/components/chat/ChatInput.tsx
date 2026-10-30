import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { matchSlashCommands } from "../../../../portfolio/ai/slashCommands";
import { MAX_MESSAGE_CHARS } from "../../../../portfolio/ai/chatLimits";
import type { EnhanceResult } from "../../../../portfolio/ai/chatClient";
import {
  MIN_ENHANCE_CHARS,
  VISITOR_DAILY_LIMIT,
} from "../../../../portfolio/ai/promptTools";

type ChatInputProps = {
  isBusy: boolean;
  placeholder: string;
  onSubmit: (text: string) => void;
  onStop: () => void;
  focusSignal?: number;
  // Likely reply to the assistant's question; shown as ghost text that Tab accepts.
  suggestion?: string;
  onDismissSuggestion?: () => void;
  // ✨ Improve my message.
  onEnhance?: (text: string) => Promise<EnhanceResult>;
  // Visitors' ✨ uses left today (null: not known yet). Undefined for the owner.
  enhanceRemaining?: number | null;
};

// What the line under the input says after ✨.
type EnhanceNote =
  | { kind: "improved"; original: string }
  | { kind: "unchanged" }
  | { kind: "error"; message: string };

// Touch screens have no Tab key, so the suggestion is also offered as a chip there.
const isTouchScreen = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(pointer: coarse)").matches === true;

// The textarea and the ghost-text mirror must lay text out identically.
const textClass = "text-[13px] leading-5 whitespace-pre-wrap break-words";

export const ChatInput = ({
  isBusy,
  placeholder,
  onSubmit,
  onStop,
  focusSignal,
  suggestion = "",
  onDismissSuggestion,
  onEnhance,
  enhanceRemaining,
}: ChatInputProps) => {
  const [value, setValue] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [note, setNote] = useState<EnhanceNote | null>(null);
  const [isTouch] = useState(isTouchScreen);
  const mirrorRef = useRef<HTMLDivElement>(null);
  // Highlighted suggestion, and whether Esc closed the list for the current text.
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = matchSlashCommands(value);
  const isListOpen = suggestions.length > 0 && !dismissed;
  const active = isListOpen
    ? suggestions[Math.min(activeIndex, suggestions.length - 1)]
    : undefined;

  const updateValue = (next: string) => {
    setValue(next);
    setActiveIndex(0);
    setDismissed(false);
    setNote(null);
  };

  // The rest of the suggestion after what's typed, if what's typed is its start.
  const ghost = (() => {
    if (!suggestion || isBusy || enhancing || isListOpen) return "";
    if (!value) return suggestion;
    return value.length < suggestion.length &&
      suggestion.toLowerCase().startsWith(value.toLowerCase())
      ? suggestion.slice(value.length)
      : "";
  })();

  const acceptSuggestion = () => {
    updateValue(value + ghost);
    textareaRef.current?.focus();
  };

  const isVisitor = enhanceRemaining !== undefined;
  const outOfEnhances = isVisitor && enhanceRemaining === 0;
  const canEnhance =
    Boolean(onEnhance) &&
    !isBusy &&
    !enhancing &&
    !outOfEnhances &&
    value.trim().length >= MIN_ENHANCE_CHARS &&
    !value.trimStart().startsWith("/");
  const enhanceTitle = outOfEnhances
    ? `Daily limit reached (${VISITOR_DAILY_LIMIT} a day)`
    : `Improve my message: fix spelling and make it clearer (Ctrl+I)${
        isVisitor
          ? ` · ${enhanceRemaining ?? VISITOR_DAILY_LIMIT} of ${VISITOR_DAILY_LIMIT} left today`
          : ""
      }`;

  // The text is read-only while ✨ runs, so the result can safely replace it.
  const runEnhance = async () => {
    if (!canEnhance || !onEnhance) return;
    const original = value;
    setEnhancing(true);
    setNote(null);
    try {
      const result = await onEnhance(original);
      if (result.changed) {
        setValue(result.text);
        setNote({ kind: "improved", original });
      } else setNote({ kind: "unchanged" });
    } catch (caught) {
      setNote({
        kind: "error",
        message:
          caught instanceof Error ? caught.message : "Couldn't improve right now.",
      });
    } finally {
      setEnhancing(false);
      textareaRef.current?.focus();
    }
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, [focusSignal]);

  // Grow with the text, or with the ghost text when it's longer.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const height = Math.max(
      textarea.scrollHeight,
      ghost ? (mirrorRef.current?.scrollHeight ?? 0) : 0,
    );
    textarea.style.height = `${Math.min(height, 160)}px`;
  }, [value, ghost]);

  const submit = () => {
    if (!value.trim() || isBusy || enhancing) return;
    onSubmit(value);
    updateValue("");
  };

  // Enter or click: run the command as if it had been typed in full.
  const runCommand = (name: string) => {
    if (isBusy) return;
    onSubmit(`/${name}`);
    updateValue("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
      event.preventDefault();
      void runEnhance();
      return;
    }
    if (ghost) {
      const atEnd = event.currentTarget.selectionStart === value.length;
      if ((event.key === "Tab" && !event.shiftKey) || (event.key === "ArrowRight" && atEnd)) {
        event.preventDefault();
        acceptSuggestion();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onDismissSuggestion?.();
        return;
      }
    }
    if (active) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex(
          (current) =>
            (current + step + suggestions.length) % suggestions.length,
        );
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        updateValue(`/${active.name} `);
        return;
      }
      if (event.key === "Escape") {
        // Close only the list, not panels that also listen for Escape.
        event.preventDefault();
        event.stopPropagation();
        setDismissed(true);
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        runCommand(active.name);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative border-t border-outline-variant p-2">
      {isListOpen && (
        <div className="absolute bottom-full left-2 right-2 mb-1 overflow-hidden rounded-md border border-outline-variant bg-surface-container-high text-[12px] shadow-xl">
          <ul
            id="chat-slash-commands"
            role="listbox"
            aria-label="Slash commands"
          >
            {suggestions.map((command, index) => {
              const isActive = command.name === active?.name;
              return (
                <li
                  key={command.name}
                  id={`chat-slash-${command.name}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runCommand(command.name)}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 transition-colors ${isActive ? "bg-surface-container-lowest text-accent" : ""}`}
                >
                  <span className="font-mono text-primary">
                    /{command.name}
                  </span>
                  <span className="text-on-surface-variant">
                    {command.description}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-outline-variant px-3 py-1 text-[10px] text-on-surface-variant">
            ↑↓ choose · Enter run · Tab add text · Esc close
          </p>
        </div>
      )}
      {ghost && isTouch && (
        <button
          onClick={acceptSuggestion}
          className="mb-1.5 flex max-w-full items-center gap-1 rounded-full border border-outline-variant px-2 py-0.5 text-left text-[12px] text-on-surface-variant hover:border-primary hover:text-accent"
        >
          <Icon name="subdirectory_arrow_right" className="text-[13px]" />
          <span className="truncate">{suggestion}</span>
        </button>
      )}
      <div className="flex items-end gap-2 rounded-md border border-outline-variant bg-surface-container px-2 py-1.5 focus-within:border-primary">
        <div className="relative min-w-0 flex-1">
          {ghost && (
            <div
              ref={mirrorRef}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 ${textClass}`}
            >
              <span className="invisible">{value}</span>
              <span className="text-on-surface-variant/50">{ghost}</span>
              <span className="ml-1.5 rounded border border-outline-variant px-1 align-middle text-[9px] text-on-surface-variant/70">
                Tab
              </span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => updateValue(event.target.value)}
            aria-controls={isListOpen ? "chat-slash-commands" : undefined}
            aria-activedescendant={
              active ? `chat-slash-${active.name}` : undefined
            }
            aria-describedby={ghost ? "chat-suggestion-hint" : undefined}
            onKeyDown={handleKeyDown}
            rows={1}
            readOnly={enhancing}
            placeholder={ghost ? "" : placeholder}
            aria-label="Chat message"
            maxLength={MAX_MESSAGE_CHARS}
            className={`relative block max-h-40 w-full resize-none bg-transparent text-on-surface outline-none placeholder:text-on-surface-variant/60 ${textClass} ${enhancing ? "opacity-60" : ""}`}
          />
          {ghost && (
            <span id="chat-suggestion-hint" className="sr-only">
              Suggested reply: {suggestion}. Press Tab to use it.
            </span>
          )}
        </div>
        {onEnhance && (
          <button
            onClick={() => void runEnhance()}
            disabled={!canEnhance}
            className="rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-accent disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
            title={enhanceTitle}
            aria-label={enhanceTitle}
          >
            <Icon
              name={enhancing ? "progress_activity" : "auto_awesome"}
              className={`text-[17px] ${enhancing ? "animate-spin" : ""}`}
            />
          </button>
        )}
        {isBusy ? (
          <button
            onClick={onStop}
            className="rounded p-1 text-error hover:bg-surface-container-high"
            title="Stop generating"
          >
            <Icon name="stop_circle" className="text-[18px]" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!value.trim() || enhancing}
            className="rounded p-1 text-primary transition-colors hover:bg-surface-container-high disabled:text-on-surface-variant/40"
            title="Send (Enter)"
          >
            <Icon name="send" className="text-[18px]" />
          </button>
        )}
      </div>
      {note && (
        <p
          className={`mt-1 flex items-center gap-1.5 px-1 text-[11px] ${note.kind === "error" ? "text-error" : "text-on-surface-variant"}`}
          role="status"
        >
          <Icon
            name={note.kind === "error" ? "error" : "auto_awesome"}
            className="text-[13px]"
          />
          {note.kind === "improved" && (
            <>
              Improved
              <button
                onClick={() => {
                  setValue(note.original);
                  setNote(null);
                  textareaRef.current?.focus();
                }}
                className="text-primary hover:text-accent"
              >
                Undo
              </button>
            </>
          )}
          {note.kind === "unchanged" && "Already looks good."}
          {note.kind === "error" && note.message}
        </p>
      )}
      {value.length > MAX_MESSAGE_CHARS - 500 && (
        <p
          className={`mt-1 px-1 text-right text-[10px] ${value.length >= MAX_MESSAGE_CHARS ? "text-error" : "text-on-surface-variant"}`}
        >
          {value.length} / {MAX_MESSAGE_CHARS}
        </p>
      )}
      <p className="mt-1 px-1 text-[10px] text-on-surface-variant/70">
        {ghost
          ? "Tab to use the suggestion · Esc to dismiss · AI can make mistakes"
          : "Type / for commands · Shift+Enter for a new line · AI can make mistakes"}
      </p>
    </div>
  );
};
