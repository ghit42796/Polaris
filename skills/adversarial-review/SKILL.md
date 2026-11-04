---
name: adversarial-review
description: Use when the work of a task is finished, before its 結案報告 is written - has reviewers other than the author try to break the deliverable, so "done" is never the author grading their own work. Fires automatically on completion, scaled to what changed - none for a lookup, two critics for non-production changes and for follow-ups inside already-reviewed work, five critics and a judge for production-facing ones.
---

# Adversarial Review

The author does not grade the work. Before a task is reported done, other models try to
break it, and what they find is settled by something other than the author's opinion: a
separate judge, or evidence that reproduces.

## The Rule

**This fires on its own.** When the work of a task is finished, the review runs before
the 結案報告, at the strength the table below sets. Nobody asks for it.

Your Done checks test what you thought of. The critics exist for what you did not. A
check that passes while the work is broken is the ordinary case, not the rare one: the
check and the bug come from the same blind spot.

## How Much Review

What the change touches sets the strength — not its size, and not how the request was
worded. Read the table top to bottom; the first row that matches decides.

| Situation | Review | Cost |
|---|---|---|
| The user asks for a review | The strength they name; full if they name none | 2 or 6 subagents |
| Nothing was changed — no file, no data, nothing deployed: a question or a lookup | None | 0 |
| The only writes are values the user dictated verbatim (an ID, a name, a number — not a block of code or config), memory files, or the 結案報告 itself | None | 0 |
| The user said earlier in this session to skip the review, or stopped one | None, for the rest of the session unless they limited it to one task. Section 6 of the report says so | 0 |
| A follow-up to a piece of work that had a full review in this session, wholly inside what that review covered (see below) | Light, whatever its size | 2 subagents |
| A change to something where a mistake reaches real people with no human in between: production code paths or config, deploy or CI, writes to or migrations of real data, auth or permissions, money or calculation rules | Full | 6 subagents |
| Any other change: docs, scripts or SQL run by hand against non-production data, tests, non-production config, skill or prompt text | Light | 2 subagents |

"Keep it quick", a deadline, or a diff you have read in full does not lower the strength.
Three lines of production auth get the full review; forty files of docs get light.

Whether a follow-up is inside is checked, not felt. A full review here means five critics
and a judge that ran to the end — not a 非獨立審查. When one runs, record what it was
handed (the files and code paths, or the commit range) in its report. Compare the
follow-up's diff with that record:

- **Inside** — it tunes what the review saw: a value, a threshold, wording, a condition
  adjusted within the same code path.
- **Outside** — anything the review never saw: a new code path, a new file, a new setting,
  or logic rewritten rather than tuned. Also outside, even on a reviewed line: a change to
  who may do what (auth, permissions) or to how money or a calculation comes out. These
  win over the inside list: a threshold that changes a price is outside.

If any part is outside, the whole follow-up falls to the rows below, so production-facing
work gets a full review of its own. If you cannot show the record — it was never kept, or
the context that held it is gone — treat the follow-up as outside.

A user who stopped a review has answered until they ask for one. Do not restart it after a
fix, and do not offer it again.

## The Critics

Each critic is a fresh subagent — not a fork, not this conversation. A critic that
inherits your reasoning inherits your blind spots. Dispatch them all in one message, so
they run in parallel: the wait is the slowest critic, not the sum.

Each critic gets:

- **What was asked** — the contract verbatim, or the user's own words if there was none
- **Where the work is** — paths, the diff command, how to run it
- **One assignment** from the table below
- **The limits** — the project's never-touch and critical-actions lists, and: the real
  system is read-only. Experiment on a copy, with stubs or fake hosts for anything that
  reaches outside it. A check that needs a live system is reported as "needs a live
  system", not run.
- **The stance** — the work is presumed broken; find where. Every finding carries
  evidence: file and line, or the command and its actual output. A finding without
  evidence is thrown out.

Each critic does not get your self-assessment, your Done results, or why you think it
works. Hand over the work, not your conclusion.

Give an assignment, not a persona. "You are a senior reviewer" changes the voice, not what
gets checked. Tell the critic what to do.

| Critic | Assignment |
|---|---|
| Done | Run every Done check yourself, then try to make one fail: other inputs, a clean environment, the path no check exercises |
| Breaker | Find one input, state, or order of events under which the work gives a wrong result or does damage |
| Contract | Compare the work to what was asked. Find what is missing, what was widened, what was quietly reinterpreted |
| Evidence | Find a claim in the work — a number, a quote, a citation, "verified", "passes" — that its source does not support |
| Blast radius | Find what this breaks elsewhere: callers, docs that are now wrong, configs, installs, other skills |

For a document rather than code, "run" means check against the source, and "an input"
means a reader or a case the document gets wrong.

Critics may run on a cheaper model. Finding a flaw is easier than making the thing.

## Light Review

Two critics, dispatched together:

- **Evidence** — the assignment from the table above, unchanged
- **Contract and Breaker** — compare the work to what was asked, and find one input,
  state, or order of events under which it gives a wrong result

In the reviews this pairing came from (see Source), Evidence was the critic most often
alone in catching a real defect, and Contract caught work that went beyond or short of
what was asked. Done and Blast radius mostly found again what the others had found.

There is no judge: the judge is most of a full review's wait. In its place the evidence
decides, not you. Re-run every finding's evidence yourself — the command, or the file at
the line:

- **Reproduces** — 成立. Fix it, or put it in section 6 of the report with your reason.
  Do not rule a reproduced finding unimportant: that is the self-grading this skill
  exists to stop, and the call belongs to the user.
- **Does not reproduce** — 不成立. Counted, not acted on.
- **Cannot be checked here** — 無法判定, with what would settle it.

## The Judge

Full review only. One more fresh subagent. It gets what was asked, where the work is, the
limits, and every critic's findings verbatim — have each critic write its findings to a
file and hand the judge the paths, so nothing passes through your hands. It is not you:
ruling on attacks against your own work is the self-grading this skill exists to stop.

For each finding it rules, with evidence, running a command wherever one can settle it:

- **成立** — the evidence reproduces, or the source confirms it
- **不成立** — with the reason: does not reproduce, out of scope, or plausible but beside
  the point
- **無法判定** — and what would settle it

The judge runs on the default model. A wrong 不成立 throws away a real defect.

## Acting on the Verdicts

- Fix the 成立 findings, then re-run the Done checks.
- A 成立 finding you choose not to fix goes into section 6 of the report with your
  reason. That call is the user's to overrule.
- 不成立 findings are not acted on.
- One round. A second round only when a fix changed more than the spot that was attacked.
- Anything that changes the work after the review — another skill's pass, a late fix —
  means re-running the Done checks before the report. A fix for a 成立 finding is asked
  for by the review; it is not an unrequested change to revert.
- When only "plausible but beside the point" or "hard to carry out" survives a judge, or
  nothing reproduces in a light review, the work is sound. Say so and stop hunting.

## In the Report

The 對抗式審查 slot in section 5 of the 結案報告 (see `/polaris:recap`) carries, in order:

- **Strength** — full, light, skipped, or 非獨立審查, and the row of the table above that
  set it
- **Covered** — for a full review, what it was handed: files and code paths, or the commit
  range. A later follow-up is compared against this
- **Tally** — one line: critics run, findings, how many 成立 / 不成立 / 無法判定
- **Rows** — every 成立 and 無法判定 finding: critic, finding, verdict, what you did. 不成立
  findings are counted, not listed

## Without Subagents

- **You are a subagent.** Do not run it. The main agent runs one review over the folded
  result.
- **The harness cannot dispatch subagents.** Work through the assignments and the judging
  yourself, and label the review 「非獨立審查」(the author reviewed their own work) in
  section 5. It is weaker. Say so.

## Red Flags

| Thought | Reality |
|---|---|
| "The diff is three lines and I read all of it" | Size does not set the strength; what it touches does. Reading it yourself is the author grading the work |
| "No time — they said keep it quick" | "Keep it quick" does not lower the strength. Only "skip the review" skips it |
| "It touches production, but it is tiny — light will do" | A production-facing change gets the full review however small, unless it stays inside what a full review this session already covered |
| "This follow-up is big; I'll run the full review again" | Size is not the test. A follow-up wholly inside what the full review covered stays light, however many lines; a second full review there is the user's to ask for |
| "It's a follow-up, so it's light" | Only if all of it is inside what the full review covered. One part outside sends the whole follow-up to the rows below |
| "It's light, so one critic is enough" | Light is two critics. One is a different, weaker review |
| "They stopped the review, but my fix changed things — I'll restart it" | Stopped means stopped for the session |
| "My extra test covers the risk" | Your test checks what you thought of. Critics exist for what you did not |
| "I'll offer a review afterwards" / "I'll say it wasn't reviewed" | Disclosure is not review. Run it now |
| "I'll pass along my analysis to save them time" | That is anchoring. Hand over the work, not the conclusion |
| "I'll judge the findings myself, I know the work best" | Knowing it best is why you cannot judge it. In a light review the evidence judges, not you |
| "The finding reproduces, but it's minor — I'll call it 不成立" | In a light review, reproduced is 成立. Fix it or list it in section 6 |
| "Another skill's code reviewer already looked" | Another reviewer is not this review. Fold its findings in as one more critic |
| "Every finding needs a fix" | Only 成立 ones. The rest are counted and left |

## Source

Felix Rieseberg (Anthropic), [How to be more ambitious: a tutorial for humans with
models](https://felixrieseberg.com/how-to-be-more-ambitious-a-tutorial-for-humans-with-models/),
2026-10-13: "Do not ask the model to judge itself"; insist on outside validation, ideally a
tool the model can run; a red team does what a short seller does, rather than writing like
one.

The five critics, the separate judge, cheaper critic models, and "only plausible-but-beside-
the-point criticism left means the work is sound" come from an interview summary, not his
verbatim words: [SecondWave, note.com](https://note.com/startup_now0708/n/nedc4595d596e),
2026-10-21.

The strength table and the light review are polaris's own, not from the sources above.
They come from one project's day in which the same piece of work went through four full
reviews. Three reached a judge's ruling; each of those took 13 to 19 minutes, about ten
of them the judge's. In those three, the Evidence critic confirmed the most defects and
was the only one to catch a flaky test; the most serious defect was found by three
critics at once. The records are private and not published here. One project is a small
sample — revisit the light pair if other projects show a different pattern.
