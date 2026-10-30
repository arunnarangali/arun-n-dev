import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "../Icon";
import { verifyOwner } from "../../../../portfolio/ai/chatClient";
import { aboutContent } from "../../../../portfolio/content";
import {
  readVoiceOn,
  saveVoiceOn,
} from "../../../../portfolio/ai/voicePreference";

const firstName = aboutContent.name.split(" ")[0];
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30_000;
const GRANTED_DELAY_MS = 1800;

type Phase = "idle" | "verifying" | "granted" | "denied" | "lockout";
type Tone = "info" | "success" | "error";
type Line = { id: number; text: string; tone: Tone; delay: number };

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// Browser text-to-speech. Prefers a calm British English voice.
const speak = (text: string) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const voice =
    voices.find((entry) =>
      /daniel|uk english male|george|arthur/i.test(entry.name),
    ) ??
    voices.find((entry) => entry.lang === "en-GB") ??
    voices.find((entry) => entry.lang.startsWith("en"));
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.rate = 1.02;
  utterance.pitch = 0.9;
  synth.cancel();
  synth.speak(utterance);
};

// Types `text` out one character at a time after `delay` ms.
const TypeLine = ({
  text,
  delay,
  tone,
}: {
  text: string;
  delay: number;
  tone: Tone;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let interval = 0;
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((current) => {
          if (current >= text.length) window.clearInterval(interval);
          return Math.min(current + 1, text.length);
        });
      }, 22);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [delay, text]);

  if (count === 0) return null;
  const color =
    tone === "success"
      ? "text-accent"
      : tone === "error"
        ? "text-error"
        : "text-on-surface";
  return (
    <p className={`font-mono text-[12px] leading-relaxed ${color}`}>
      <span className="akaza-tone mr-2">›</span>
      {text.slice(0, count)}
      {count < text.length && (
        <span className="akaza-tone animate-pulse">▌</span>
      )}
    </p>
  );
};

const ring = (
  inset: string,
  duration: string,
  classes: string,
): { className: string; style: CSSProperties } => ({
  className: `akaza-ring ${classes}`,
  style: { inset, "--ring-duration": duration } as CSSProperties,
});

type OwnerVerificationProps = {
  onGranted: (passcode: string) => void;
  onCancel: () => void;
};

export const OwnerVerification = ({
  onGranted,
  onCancel,
}: OwnerVerificationProps) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [value, setValue] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [voiceOn, setVoiceOn] = useState(readVoiceOn);
  const [lines, setLines] = useState<Line[]>(() => [
    { id: 1, text: `${greeting()}, ${firstName}.`, tone: "info", delay: 200 },
    {
      id: 2,
      text: "Identity verification required.",
      tone: "info",
      delay: 900,
    },
    {
      id: 3,
      text: "Please state your access code.",
      tone: "info",
      delay: 1800,
    },
  ]);
  const timersRef = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (voiceOn)
      speak(
        `${greeting()}, ${firstName}. Identity verification required. Please state your access code.`,
      );
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.speechSynthesis?.cancel();
    };
    // Speak the greeting once, when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const element = logRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [lines]);

  const say = (text: string, tone: Tone) => {
    setLines((current) => [
      ...current,
      { id: Date.now() + current.length, text, tone, delay: 0 },
    ]);
    if (voiceOn) speak(text);
  };

  const later = (callback: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(callback, ms));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = value.trim();
    if (
      !code ||
      phase === "verifying" ||
      phase === "granted" ||
      phase === "lockout"
    )
      return;
    setPhase("verifying");
    say("Analyzing credentials…", "info");

    const result = await verifyOwner(code);
    if (result === "granted") {
      setPhase("granted");
      say(
        `Access granted. Welcome back, ${firstName}. All systems online.`,
        "success",
      );
      later(() => onGranted(code), GRANTED_DELAY_MS);
      return;
    }

    setValue("");
    setShowCode(false);
    if (result === "rate-limited") {
      setPhase("lockout");
      say(
        "Too many requests. Secure channel throttled for one minute.",
        "error",
      );
      later(() => setPhase("idle"), 60_000);
      return;
    }
    if (result === "offline") {
      setPhase("denied");
      say(
        "I am unable to reach the secure server. Please try again later.",
        "error",
      );
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= MAX_ATTEMPTS) {
      setPhase("lockout");
      say("Access denied. Security lockout engaged for 30 seconds.", "error");
      later(() => {
        setAttempts(0);
        setPhase("idle");
        say("Lockout lifted. You may try again.", "info");
        inputRef.current?.focus();
      }, LOCKOUT_MS);
      return;
    }
    setPhase("denied");
    say(`Access denied. Attempt ${nextAttempts} of ${MAX_ATTEMPTS}.`, "error");
    inputRef.current?.focus();
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    saveVoiceOn(next);
    if (!next) window.speechSynthesis?.cancel();
    setVoiceOn(next);
  };

  const isLocked = phase === "lockout" || phase === "granted";
  const statusLabel = {
    idle: "Awaiting credentials",
    verifying: "Verifying",
    granted: "Access granted",
    denied: "Access denied",
    lockout: "Locked",
  }[phase];

  return (
    <div
      className="akaza-hud relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-container-lowest"
      data-phase={phase}
    >
      <div className="akaza-scan pointer-events-none absolute inset-x-0 top-0 h-24" />
      {(phase === "denied" || phase === "granted") && (
        <div
          key={`flash-${attempts}-${phase}`}
          className="akaza-flash pointer-events-none absolute inset-0"
        />
      )}

      <div className="relative flex items-center justify-between gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className="akaza-tone truncate whitespace-nowrap">
          Akaza · Secure channel
        </span>
        <div className="flex items-center gap-1 tracking-normal">
          <button
            onClick={toggleVoice}
            className="rounded p-1 text-on-surface-variant transition-colors hover:text-accent"
            title={voiceOn ? "Mute Akaza voice" : "Unmute Akaza voice"}
          >
            <Icon
              name={voiceOn ? "volume_up" : "volume_off"}
              className="text-[15px]"
            />
          </button>
          <button
            onClick={onCancel}
            className="rounded p-1 text-on-surface-variant transition-colors hover:text-accent"
            title="Cancel (Esc)"
          >
            <Icon name="close" className="text-[15px]" />
          </button>
        </div>
      </div>

      <div className="vscode-scrollbar relative flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-4">
        <div className="relative my-5 h-36 w-36 shrink-0" aria-hidden="true">
          <span {...ring("0", "14s", "border-2 border-dashed")} />
          <span
            {...ring(
              "10px",
              "7s",
              "akaza-ring-reverse border border-t-transparent",
            )}
          />
          <span {...ring("22px", "3.5s", "border-4 border-x-transparent")} />
          <span
            {...ring("36px", "9s", "akaza-ring-reverse border border-dotted")}
          />
          <span className="akaza-core" style={{ inset: "46px" }} />
        </div>

        <p
          className="akaza-tone mb-3 font-mono text-[10px] uppercase tracking-[0.35em]"
          role="status"
        >
          {statusLabel}
        </p>

        <div
          ref={logRef}
          className="vscode-scrollbar mb-4 max-h-40 w-full space-y-1 overflow-y-auto"
        >
          {lines.map((line) => (
            <TypeLine
              key={line.id}
              text={line.text}
              delay={line.delay}
              tone={line.tone}
            />
          ))}
        </div>

        <form
          key={`form-${attempts}`}
          onSubmit={handleSubmit}
          className={`w-full ${phase === "denied" ? "akaza-shake" : ""}`}
        >
          <label
            htmlFor="akaza-access-code"
            className="akaza-tone mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em]"
          >
            Access code
          </label>
          <div className="relative">
            <input
              id="akaza-access-code"
              ref={inputRef}
              type={showCode ? "text" : "password"}
              autoFocus
              autoComplete="current-password"
              spellCheck={false}
              value={value}
              disabled={isLocked}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") onCancel();
              }}
              className="akaza-input w-full rounded border bg-transparent py-2 pl-3 pr-9 font-mono text-[14px] tracking-[0.4em] text-on-surface outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => {
                setShowCode((current) => !current);
                inputRef.current?.focus();
              }}
              disabled={isLocked}
              aria-label={showCode ? "Hide access code" : "Show access code"}
              aria-pressed={showCode}
              title={showCode ? "Hide access code" : "Show access code"}
              className="absolute inset-y-0 right-1 my-auto flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:text-accent disabled:opacity-40"
            >
              <Icon
                name={showCode ? "visibility_off" : "visibility"}
                className="text-[16px]"
              />
            </button>
          </div>
          <div className="mt-1 h-[2px] w-full overflow-hidden rounded">
            {phase === "verifying" && (
              <div className="akaza-progress h-full w-full" />
            )}
          </div>
          <button
            type="submit"
            disabled={isLocked || phase === "verifying" || !value.trim()}
            className="akaza-input akaza-tone mt-3 w-full rounded border py-2 font-mono text-[11px] font-bold uppercase tracking-[0.35em] transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {phase === "verifying" ? "Authenticating…" : "Authenticate"}
          </button>
        </form>
      </div>
    </div>
  );
};
