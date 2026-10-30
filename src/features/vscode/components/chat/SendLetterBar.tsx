import { useState } from "react";
import { Icon } from "../Icon";
import {
  buildGmailComposeUrl,
  composeCoverLetterEmail,
  downloadResume,
  MAX_COMPOSE_URL_CHARS,
  ownerEmail,
  type CoverLetterTarget,
} from "../../../../portfolio/ai/coverLetter";
import type { HrEmailResult } from "../../../../portfolio/ai/chatClient";
import { isEmail } from "../../../../portfolio/ai/jobs";
import {
  matchApplication,
  formatAppliedDate,
} from "../../../../portfolio/ai/applications";
import {
  markApplied,
  unmarkApplied,
  useApplications,
} from "../../../../portfolio/ai/useApplications";
import {
  applyAnyway,
  useApplyAnyway,
} from "../../../../portfolio/ai/useApplyAnyway";

type Lookup =
  | { state: "idle" | "searching" | "none" }
  | { state: "found"; source: string }
  | { state: "error"; message: string };

type SendLetterBarProps = {
  letter: string;
  target: CoverLetterTarget;
  onFindHrEmail: (company: string) => Promise<HrEmailResult>;
  // Folds the letter into its summary card (shown once it's applied).
  onCollapse?: () => void;
};

// "Send now": opens Gmail compose with the letter. Gmail is the review step; nothing is sent from here.
export const SendLetterBar = ({
  letter,
  target,
  onFindHrEmail,
  onCollapse,
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
  const applyAnywayUrls = useApplyAnyway();
  const match = matchApplication(applications, target, {
    applyAnyway: applyAnywayUrls,
  });
  // Same rules as the job cards:
  // - "applied": this exact posting is done.
  // - "sameRole": most likely the same opening on another site, so it's treated as
  //   applied unless the user says it's a different opening (Apply anyway).
  // - "repost" / "applyAnyway": a new opening; marking it adds a separate entry.
  const applied = match?.status === "applied" ? match.entry : undefined;
  const sameRole = match?.status === "sameRole" ? match.entry : undefined;
  const earlier =
    match?.status === "repost" || match?.status === "applyAnyway"
      ? match.entry
      : undefined;
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
        <button
          onClick={downloadResume}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-outline-variant px-1.5 py-1 text-on-surface hover:border-primary hover:text-accent"
          title="Download ArunCV.pdf to attach in Gmail"
        >
          <Icon name="download" className="text-[13px]" /> CV
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
            "Opens Gmail. Use CV to download your resume and attach it."}
          {isSearching && `Searching for ${target.company}'s HR email…`}
        </span>
      </div>
      {notice && <p className="text-tertiary">{notice}</p>}
      {sameRole && (
        <p className="flex flex-wrap items-center gap-1.5 text-on-surface-variant">
          <Icon name="task_alt" className="text-[14px] text-accent" />
          You already applied to this role on{" "}
          {formatAppliedDate(sameRole.appliedAt)} (likely the same opening on
          another site).
          <button
            onClick={() => applyAnyway(target.url)}
            className="text-primary underline hover:text-accent"
            title="It's a different opening (another team, city or a new posting)"
          >
            Different opening? Apply anyway
          </button>
        </p>
      )}
      {earlier && (
        <p className="text-on-surface-variant">
          You applied to a {target.title} role at {target.company} on{" "}
          {formatAppliedDate(earlier.appliedAt)}. Check it's a different
          opening.
        </p>
      )}
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
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="ml-auto flex items-center gap-0.5 text-primary hover:text-accent"
            >
              <Icon name="expand_less" className="text-[14px]" /> Collapse
            </button>
          )}
        </p>
      ) : (
        sent &&
        !sameRole && (
          <p className="flex flex-wrap items-center gap-1.5 text-on-surface-variant">
            Sent it from Gmail?
            <button
              onClick={() =>
                markApplied(
                  target,
                  { email: sent.to, subject: sent.subject, via: "gmail" },
                  { separate: Boolean(earlier) },
                )
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
