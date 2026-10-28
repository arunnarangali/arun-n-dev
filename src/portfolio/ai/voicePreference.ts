// Whether the owner screen speaks out loud. Stored as "on"/"off"; default on.
const VOICE_KEY = "vscode-akaza-voice";
// Earlier name of the key, moved over once so a saved mute is kept.
const LEGACY_VOICE_KEY = "vscode-jarvis-voice";

export const readVoiceOn = () => {
  if (typeof window === "undefined") return true;
  const legacy = window.localStorage.getItem(LEGACY_VOICE_KEY);
  if (legacy !== null) {
    if (window.localStorage.getItem(VOICE_KEY) === null)
      window.localStorage.setItem(VOICE_KEY, legacy);
    window.localStorage.removeItem(LEGACY_VOICE_KEY);
  }
  return window.localStorage.getItem(VOICE_KEY) !== "off";
};

export const saveVoiceOn = (on: boolean) =>
  window.localStorage.setItem(VOICE_KEY, on ? "on" : "off");
