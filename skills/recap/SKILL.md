---
name: recap
description: Use when the work of a task is complete - closes it out with a structured report covering the original ask, what was done, the evidence found along the way, and acceptance against the agreed criteria. Fires automatically on completion; it is not something to wait to be asked for.
---

# Recap

Close every completed task with a report they can read instead of re-reading the whole
conversation.

## The Rule

**This fires on its own.** Nobody asks for it. When the work of a task is finished, the
report is part of finishing.

The obligation is *any completed task*, not *any task driven by five-rules*. Work driven
by another skill, another plugin, or no skill at all is still a completed task.

## When It Fires

| Situation | Report? |
|---|---|
| Work agreed in a contract is finished | Yes |
| Stopping to ask a question | No — the work is not finished |
| A pure question answered under the short form | No — there is no contract to close |
| Work blocked partway | Yes. Mark section 4 ❌ and say in section 5 exactly where it stopped |

## The Block

Emit it in the language of the conversation.

```markdown
## 結案報告

**1. 你要的** — <contract rule 1, copied verbatim>
**2. 做了什麼** — <actual steps against rule 3; deviations marked>
**3. 中間證據** — <what was found, what decided it, which assumptions were disproved>
**4. 驗收** — <each rule-5 Scenario, ✅/❌, with checkable evidence>
**5. 沒做 / 待辦** — <out of scope, blocked, or deliberately skipped>
```

## Hard Requirements

**Section 1 copies the contract verbatim.** Do not re-describe the task. Re-describing
lets you back-derive "what they wanted" from "what you built", and the two silently
align. If there was no contract, quote their own words instead.

**Deviations are marked.** If the approach changed, say what changed and why. A report
that reads as though the plan was followed, when it was not, is worse than no report.

**Failed acceptance pastes raw output.** ❌ means ❌, with the real error text. Never
"should be fine", never "mostly working". If a check was not run, say it was not run —
do not imply a pass.

**Section 3 is not optional.** It is the section most easily compressed away and the one
with the longest shelf life: what you looked up, what it changed, which assumption turned
out wrong. Conclusions without their reasoning cannot be revised later, only re-argued.

## Subagents

A subagent's result comes back to the main agent and is folded into the single final
report. Subagents do not each emit their own.

## Red Flags

| Thought | Reality |
|---|---|
| "They watched me do it, they know" | They read the last message, not the whole turn |
| "I'll summarise what I built" | Section 1 is what they asked for, copied, not what you built |
| "The deviation was minor" | Mark it. Minor is their call, not yours |
| "Tests mostly pass" | Then some fail. Paste the failure |
| "Nothing interesting came up" | Then section 3 says exactly that, in one line |
