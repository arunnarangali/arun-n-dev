import { describe, expect, it } from "vitest";
import {
  addJobFeedback,
  createJobFeedback,
  findFeedback,
  summarizeFeedback,
} from "./jobFeedback";
import { MAX_PREFERENCE_CHARS, MAX_PREFERENCES } from "./jobs";

const at = (day: number) =>
  new Date(`2026-10-${String(day).padStart(2, "0")}T00:00:00Z`);

describe("job feedback", () => {
  it("matches the same posting or the same role reposted elsewhere", () => {
    const list = [
      createJobFeedback(
        {
          company: "Acme",
          title: "Sr. Front End Engineer",
          url: "https://a.dev/1",
        },
        "above-experience",
      ),
    ];
    expect(
      findFeedback(list, {
        company: "acme",
        title: "Senior Frontend Engineer",
        url: "https://b.dev/9",
      }),
    ).toBeDefined();
    expect(
      findFeedback(list, {
        company: "Other",
        title: "x",
        url: "https://a.dev/1",
      }),
    ).toBeDefined();
    expect(
      findFeedback(list, {
        company: "Acme",
        title: "React Developer",
        url: "https://c.dev/3",
      }),
    ).toBeUndefined();
  });

  it("replaces the reason when a role is marked again", () => {
    const target = {
      company: "Acme",
      title: "Lead Engineer",
      url: "https://a.dev/1",
    };
    const list = addJobFeedback(
      [createJobFeedback(target, "salary")],
      createJobFeedback(target, "above-experience", "  needs   8 yrs "),
    );
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      reason: "above-experience",
      note: "needs 8 yrs",
    });
  });

  it("summarizes one line per reason plus each note, newest first, within limits", () => {
    const list = [
      createJobFeedback(
        { company: "A", title: "Staff Engineer", url: "u1" },
        "above-experience",
        "",
        at(1),
      ),
      createJobFeedback(
        { company: "B", title: "Principal Dev", url: "u2" },
        "above-experience",
        "",
        at(2),
      ),
      createJobFeedback(
        { company: "C", title: "Java Dev", url: "u3" },
        "wrong-stack",
        "I do React, not Java",
        at(3),
      ),
      createJobFeedback(
        { company: "D", title: "Misc", url: "u4" },
        "other",
        "",
        at(4),
      ),
    ];
    expect(summarizeFeedback(list)).toEqual([
      'Wrong tech stack: "I do React, not Java" (Java Dev at C)',
      "Above my experience, e.g. Principal Dev at B; Staff Engineer at A",
    ]);
    const many = Array.from({ length: 30 }, (_, index) =>
      createJobFeedback(
        { company: `Co${index}`, title: "T".repeat(200), url: `u${index}` },
        "location",
        `note ${index}`,
        at((index % 28) + 1),
      ),
    );
    const lines = summarizeFeedback(many);
    expect(lines).toHaveLength(MAX_PREFERENCES);
    lines.forEach((line) =>
      expect(line.length).toBeLessThanOrEqual(MAX_PREFERENCE_CHARS),
    );
  });
});
