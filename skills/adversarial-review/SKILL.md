---
name: adversarial-review
description: Use when the work of a task is finished, before its 結案報告 is written - has reviewers other than the author try to break the deliverable, so "done" is never the author grading their own work. Fires automatically on completion; it is not something to wait to be asked for.
---

# Adversarial Review

The author does not grade the work. Before a task is reported done, other models try to
break it, and a separate judge rules on every attack.

## The Rule

**This fires on its own.** When the work of a task is finished, the review runs before
the 結案報告. Nobody asks for it.

Your Done checks test what you thought of. The critics exist for what you did not. A
check that passes while the work is broken is the ordinary case, not the rare one: the
check and the bug come from the same blind spot.

## How Much Review

| Situation | Review | Cost |
|---|---|---|
| No file was changed — a question answered under five-rules' short form | None | 0 |
| The user said, for this task, to skip the review | None. Section 6 of the report says so | 0 |
| Anything else | All five critics, then the judge | 6 subagents |

A three-line diff gets the same review. "Keep it quick", a deadline, or a diff you have
read in full is not the user saying to skip it.

## The Critics

Each critic is a fresh subagent — not a fork, not this conversation. A critic that
inherits your reasoning inherits your blind spots. Dispatch them all in one message, so
they run in parallel: the wait is one subagent, not five.

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

## The Judge

One more fresh subagent. It gets what was asked, where the work is, the limits, and every
critic's findings verbatim — have each critic write its findings to a file and hand the
judge the paths, so nothing passes through your hands. It is not you: ruling on attacks
against your own work is the self-grading this skill exists to stop.

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
- When only "plausible but beside the point" or "hard to carry out" survives, the work is
  sound. Say so and stop hunting.

## In the Report

The 對抗式審查 slot in section 5 of the 結案報告 (see `/polaris:recap`) carries, in order:

- **Strength** — full, skipped, or 非獨立審查, and why
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
| "The diff is three lines and I read all of it" | Reading it yourself is the author grading the work. Three lines get the same review |
| "No time — they said keep it quick" | Critics run in parallel; the wait is one subagent. Only an explicit "skip the review" skips it |
| "My extra test covers the risk" | Your test checks what you thought of. Critics exist for what you did not |
| "I'll offer a review afterwards" / "I'll say it wasn't reviewed" | Disclosure is not review. Run it now |
| "I'll pass along my analysis to save them time" | That is anchoring. Hand over the work, not the conclusion |
| "I'll judge the findings myself, I know the work best" | Knowing it best is why you cannot judge it |
| "Another skill's code reviewer already looked" | One reviewer and no judge is not this review. Fold its findings in as one more critic |
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
