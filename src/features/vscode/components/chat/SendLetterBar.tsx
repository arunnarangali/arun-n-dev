import { useState } from "react";
import { Icon } from "../Icon";
import {
  buildGmailComposeUrl,
  composeCoverLetterEmail,
  MAX_COMPOSE_URL_CHARS,
  ownerEmail,
  type CoverLetterTarget,
} from "../../../../portfolio/ai/coverLetter";
import type { HrEmailResult } from "../../../../portfolio/ai/chatClient";
import { isEmail } from "../../../../portfolio/ai/jobs";
import {
  findApplication,
  formatAppliedDate,
} from "../../../../portfolio/ai/applications";
import {
  markApplied,
  unmarkApplied,
  useApplications,
} from "../../../../portfolio/ai/useApplications";

type Lookup =
  | { state: "idle" | "searching" | "none" }
  | { state: "found"; source: string }
  | { state: "error"; message: string };

type SendLetterBarProps = {
  letter: string;
  target: CoverLetterTarget;
  onFindHrEmail: (company: string) => Promise<HrEmailResult>;
};

// "Send now": opens Gmail compose with the letter. Gmail is the review step; nothing is sent from here.
export const SendLetterBar = ({
  letter,
  target,
  onFindHrEmail,
}: SendLetterBarProps) => {
  const [to, setTo] = useState(target.email);
  const [lookup, setLookup] = useState<Lookup>(
    target.email
      ? { state: "found", source: "the job posting" }
      : { state: "idle" },
  );
  const [notice, setNotice] = useState("");
  // Gmail opened; only Arun knows whether he actually pressed Send there.
  const [sent, setSent] = useState<{ to: string; subject: string } | null>(
    null,
  );
  const applications = useApplications();
  const applied = findApplication(applications, target);
  const recipientInvalid = to.trim() !== "" && !isEmail(to.trim());

  const findHr = async () => {
    setLookup({ state: "searching" });
    try {
      const result = await onFindHrEmail(target.company);
      if (result.email) {
        setTo(result.email);
        setLookup({ state: "found", source: result.source });
      } else {
        setLookup({ state: "none" });
      }
      return result.email;
    } catch (caught) {
      setLookup({
        state: "error",
        message: caught instanceof Error ? caught.message : "Lookup failed.",
      });
      return "";
    }
  };

  const sendNow = async () => {
    setNotice("");
    const { subject, body } = composeCoverLetterEmail(letter, target);
    const needsLookup = !to.trim() && lookup.state === "idle";
    // Decide on the clipboard fallback now: the copy only works while this page has
    // focus and the click, i.e. before the Gmail tab opens. Leave room for an HR address.
    const tooLong =
      buildGmailComposeUrl({ from: ownerEmail, to: to.trim(), subject, body })
        .length +
        (needsLookup ? 120 : 0) >
      MAX_COMPOSE_URL_CHARS;
    const copied = tooLong
      ? navigator.clipboard.writeText(body).then(
          () => true,
          () => false,
        )
      : null;

    // Open the tab during the click so the popup blocker allows it, then fill it in.
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      setNotice(
        "Your browser blocked the Gmail tab. Allow pop-ups for this site, then click Send now again.",
      );
      return;
    }
    tab.opener = null;
    const recipient = needsLookup ? await findHr() : to.trim();

    tab.location.href = buildGmailComposeUrl({
      from: ownerEmail,
      to: recipient,
      subject,
      body: tooLong ? "" : body,
    });
    setSent({ to: recipient, subject });
    if (copied) {
      setNotice(
        (await copied)
          ? "The letter is long, so it was copied. Paste it into the email body."
          : "The letter is too long for a Gmail link. Copy it from above and paste it in.",
      );
    } else if (!recipient) {
      setNotice("No HR email found. Add the recipient in Gmail.");
    }
  };

  const isSearching = lookup.state === "searching";

  return (
    <div className="ml-7 mt-2 space-y-1.5 rounded-md border border-outline-variant bg-surface-container p-2 text-[11px]">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={`to-${target.url}`}
          className="shrink-0 font-semibold text-on-surface-variant"
        >
          To
        </label>
        <input
          id={`to-${target.url}`}
          type="email"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="recruiter@company.com"
          className={`min-w-0 flex-1 rounded border bg-surface-container-low px-1.5 py-1 text-[12px] text-on-surface outline-none focus:border-primary ${recipientInvalid ? "border-error" : "border-outline-variant"}`}
        />
        <button
          onClick={() => void findHr()}
          disabled={isSearching}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-outline-variant px-1.5 py-1 text-on-surface hover:border-primary hover:text-accent disabled:opacity-40"
          title={`Search the web for ${target.company}'s HR or careers email`}
        >
          <Icon
            name={isSearching ? "progress_activity" : "person_search"}
            className={`text-[13px] ${isSearching ? "animate-spin" : ""}`}
          />
          HR email
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => void sendNow()}
          disabled={isSearching || recipientInvalid}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded bg-primary px-2 py-1 font-semibold text-on-primary hover:opacity-90 disabled:opacity-40"
          title="Open Gmail with this letter ready to review and send"
        >
          <Icon name="send" className="text-[13px]" /> Send now
        </button>
        <span className="min-w-0 flex-1 leading-snug text-on-surface-variant">
          {lookup.state === "found" &&
            `Email from ${lookup.source}. Check it before sending.`}
          {lookup.state === "none" &&
            "No HR email found. Enter one or add it in Gmail."}
          {lookup.state === "error" && (
            <span className="text-error">{lookup.message}</span>
          )}
          {lookup.state === "idle" &&
            "Opens Gmail. Attach your CV before sending."}
          {isSearching && `Searching for ${target.company}'s HR email…`}
        </span>
      </div>
      {notice && <p className="text-tertiary">{notice}</p>}
      {applied ? (
        <p className="flex items-center gap-1.5 text-accent">
          <Icon name="task_alt" className="text-[14px]" />
          Applied · {formatAppliedDate(applied.appliedAt)}
          <button
            onClick={() => unmarkApplied(applied.id)}
            className="text-on-surface-variant underline hover:text-on-surface"
          >
            Undo
          </button>
        </p>
      ) : (
        sent && (
          <p className="flex flex-wrap items-center gap-1.5 text-on-surface-variant">
            Sent it from Gmail?
            <button
              onClick={() =>
                markApplied(target, {
                  email: sent.to,
                  subject: sent.subject,
                  via: "gmail",
                })
              }
              className="flex items-center gap-1 rounded border border-accent/60 px-1.5 py-0.5 font-semibold text-accent hover:bg-accent/10"
            >
              <Icon name="check" className="text-[13px]" /> Mark as applied
            </button>
          </p>
        )
      )}
    </div>
  );
};
