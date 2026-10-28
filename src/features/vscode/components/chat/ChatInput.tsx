import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { matchSlashCommands } from "../../../../portfolio/ai/slashCommands";
import { MAX_MESSAGE_CHARS } from "../../../../portfolio/ai/chatLimits";

type ChatInputProps = {
  isBusy: boolean;
  placeholder: string;
  onSubmit: (text: string) => void;
  onStop: () => void;
  focusSignal?: number;
};

export const ChatInput = ({
  isBusy,
  placeholder,
  onSubmit,
  onStop,
  focusSignal,
}: ChatInputProps) => {
  const [value, setValue] = useState("");
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
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, [focusSignal]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  const submit = () => {
    if (!value.trim() || isBusy) return;
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
      <div className="flex items-end gap-2 rounded-md border border-outline-variant bg-surface-container px-2 py-1.5 focus-within:border-primary">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          aria-controls={isListOpen ? "chat-slash-commands" : undefined}
          aria-activedescendant={
            active ? `chat-slash-${active.name}` : undefined
          }
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          aria-label="Chat message"
          maxLength={MAX_MESSAGE_CHARS}
          className="max-h-40 flex-1 resize-none bg-transparent text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant/60"
        />
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
            disabled={!value.trim()}
            className="rounded p-1 text-primary transition-colors hover:bg-surface-container-high disabled:text-on-surface-variant/40"
            title="Send (Enter)"
          >
            <Icon name="send" className="text-[18px]" />
          </button>
        )}
      </div>
      {value.length > MAX_MESSAGE_CHARS - 500 && (
        <p
          className={`mt-1 px-1 text-right text-[10px] ${value.length >= MAX_MESSAGE_CHARS ? "text-error" : "text-on-surface-variant"}`}
        >
          {value.length} / {MAX_MESSAGE_CHARS}
        </p>
      )}
      <p className="mt-1 px-1 text-[10px] text-on-surface-variant/70">
        Type / for commands · Shift+Enter for a new line · AI can make mistakes
      </p>
    </div>
  );
};
