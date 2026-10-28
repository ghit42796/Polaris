---
name: five-rules
description: Use when a new discussion starts, or when the user adds a new or extra requirement mid-task - states the work as a five-rule contract (What / Why / How / Prohibited / Done as Gherkin) and waits for confirmation before acting.
---

# Five Rules

Before doing work, state it as a contract and wait. The contract is what lets your
partner catch a misunderstanding in thirty seconds instead of after a wasted turn.

## The Rule

Announce the skill, post the block below with every rule filled in, then **stop and
wait**. Do not begin work until they say go or supply corrections.

**REQUIRED:** run `polaris:owner-review` on the draft before posting it.

On correction, reissue the block. Do not argue outside it.

## The Block

Emit it in the language of the conversation.

```markdown
## 契約

**1. What** — <the task in one line, in their own framing>
**2. Why** — <the purpose it serves>
**3. How** — <numbered steps; name the files that will be touched>
**4. Prohibited** — <never-touch list by reference; then task-specific items>
**5. Done**

Scenario: <name>
  Given <precondition>
  When <action>
  Then <observable result>

完成後會自動給結案報告。
```

The closing line is load-bearing: it puts the reporting obligation into the conversation
for the whole task. Do not drop it.

## Per-Rule Requirements

**1. What** — restate in their framing. Do not quietly widen or narrow scope while
paraphrasing. If their wording is ambiguous, the contract is where you say so.

**2. Why** — the purpose the task serves. Why is the judge of How: if the approach does
not serve the purpose, say so here, before working, not after.

**3. How** — numbered steps, and the files that will be touched. Naming the files is the
cheapest blast-radius check available. "Refactor the module" is not a step.

**4. Prohibited** — the only field that can carry a negative requirement, which is the
kind that costs most when discovered late.

- Read the project's `AGENTS.md` / `CLAUDE.md` and reference the standing never-touch
  list: 「標準禁區(見 AGENTS.md ## Never touch)全部適用。本次額外:…」
- **Reference it, never copy it.** Ten unchanging lines per contract is how a block
  stops being read.
- **A never-touch entry can never be waived inside the contract.** If the task requires
  touching one, do not post a contract at all. Stop and ask whether to lift that entry
  for this task. Lifting is a separate, one-off act. If rule 4 could waive it in
  passing, the entry would degrade into an ordinary rule 4 item — and those you wrote
  yourself.
- **Never cite a list you have not read.** If the project has no `## Never touch`
  section, say so in rule 4 — 「本專案尚未定義標準禁區;本次僅適用下列限制:…」— and
  suggest `/polaris:init-project`.

**5. Done** — Gherkin. `Then` must name something checkable: a command that exits zero,
a file that exists, output that matches. "Code is clean", "it works", and "should be
fine" are not `Then` clauses. Write more than one scenario when the task has distinct
success paths.

## Scaling

**Full block:** anything that writes code, changes files, or spans more than one step.

**Short form:** a pure question or lookup — nothing written, one step. One line naming
what is being answered and what a complete answer must contain. No Gherkin, no waiting.

> 回答:polaris 要怎麼安裝 — 完成條件:給出可直接貼進終端機的指令

Ceremony must not cost more than the answer.

## Red Flags

These thoughts mean stop — you are rationalising your way out of the contract.

| Thought | Reality |
|---|---|
| "This is obvious, just do it" | Obvious to you. The contract costs thirty seconds |
| "I'll write the contract after I look around" | Exploring is work. Contract first |
| "They already explained it clearly" | Restating is how they discover you heard it wrong |
| "I'll fold the extra requirement in silently" | A new requirement is a new contract |
| "Rule 5 is obviously 'it works'" | Then it is not a rule 5. Name what you would run |
| "I only need to peek at .env once" | Stop. Ask. Do not post a contract |
