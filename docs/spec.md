# Polaris — a Claude Code skills plugin

**Status:** Design agreed 2026-08-04. Ready for an implementation plan.
**Slug:** `polaris`
**Artifact location:** `D:\Workspace\polaris\` — a sibling of `D:\Workspace\Orion\`, its own git repo. Not inside the Orion repo.

Written in English to match the existing `.scratch/orion-harness/spec.md` and `docs/agents/*.md`. Conversation about it happens in Traditional Chinese.

---

## 1. What this is

A Claude Code **plugin** carrying the working protocol used across every project on this machine — not just Orion.

The protocol is a loop with two gates and a close:

```
                      ┌──────────────── task ────────────────┐
  new discussion  →   │  five-rules      work      vibe-diff │  →  recap
  or extra need       │  (intent gate)             (action   │     (close)
                      │                             gate)    │
                      └──────────────────────────────────────┘
```

| Skill | Invoked as | Moment | Job |
| --- | --- | --- | --- |
| `five-rules` | `/polaris:five-rules` | Before work | State the work as a five-rule contract; wait for confirmation |
| `recap` | `/polaris:recap` | After work | Close the contract out with evidence, automatically |
| `init-project` | `/polaris:init-project` | Project setup | Interview the user, then write the project's guardrails |
| `vibe-diff` | `/polaris:vibe-diff` | Before a critical action | Translate the concrete action into plain language; get explicit consent |
| `spec-to-html` | `/polaris:spec-to-html` | On request | Render a spec or plan as a self-contained HTML page |

The file-format convention (Markdown for prose, YAML for structured data) is **not** a skill — it is text `init-project` writes into `AGENTS.md`. See §6.2.

## 2. Why a plugin rather than `.claude/skills/`

Project skills in `.claude/skills/` are visible only inside the repo that contains them. That is fatal for `init-project`, whose entire purpose is to operate on *other* projects (`LiteKan`, `LTC`, `DailyWinLoop`, `iot-health-api`, …). A user-level plugin is installed once and is available everywhere.

A plugin also gives namespacing (`/polaris:five-rules`, mirroring `/superpowers:brainstorming`) and a version number.

**Accepted cost:** a plugin requires a one-time interactive install by the user (`/plugin marketplace add`, `/plugin install`), which an agent cannot perform on their behalf. Editing skill content afterwards requires a reload to take effect.

**Name:** `polaris`. Chosen over `houserules` / `canon` because plugin namespaces age better as brand names than as content descriptions — the precedents (`superpowers`, `mattpocock-skills`) describe an owner or an idea, not a fixed content list. Polaris sits in the same navigational-star vocabulary as Orion without colliding with the Orion butler project, and stays correct as the plugin grows.

## 3. Release waves

Five skills built at once, none of them ever used, is the failure mode `.scratch/orion-harness/spec.md` §2.5 already names: *a beautiful abstraction with no user, accreting generality nobody asked for*. So the protocol ships in two waves, and wave 1 gets used before wave 2 is designed in detail.

| Wave | Contents | Why here |
| --- | --- | --- |
| **v0.1** | `five-rules`, `recap`, `init-project` (text guardrails only) | The core loop: contract → work → report. Pure text, no hooks, installable and usable the day it is written |
| **v0.2** | `vibe-diff`, `spec-to-html`, `Stop` hook, `PreToolUse` hook, `permissions.deny` wiring | Everything with hook-mechanics risk. Gated behind §9 verification |

Wave 2's design will be revised by what wave 1 teaches. That is the point of splitting them.

**The implementation plan that follows this spec covers v0.1 only.** Wave 2 gets its own plan, written after wave 1 has been used and after the §9 spike returns answers.

## 4. Repository layout

```
D:\Workspace\polaris\
├── .claude-plugin\
│   ├── plugin.json          # plugin manifest
│   └── marketplace.json     # lets the local directory be installed as a marketplace
├── skills\
│   ├── five-rules\SKILL.md
│   ├── recap\SKILL.md
│   ├── init-project\SKILL.md
│   ├── vibe-diff\SKILL.md         # v0.2
│   └── spec-to-html\SKILL.md      # v0.2
├── hooks\                          # v0.2
│   └── hooks.json
├── AGENTS.md                # canonical agent instructions for this repo
├── CLAUDE.md                # one line: @AGENTS.md
├── README.md                # human-facing: what it is, how to install
└── .gitignore
```

`plugin.json` and `marketplace.json` are JSON because Claude Code mandates it — which is exactly the tool-mandated-format exception in §6.2.

Manifest values: `name` `polaris`, `version` `0.1.0`, `author.name` `dev_fsk`, `license` `MIT`. `marketplace.json` names one plugin whose `source` is `./`, mirroring how the superpowers plugin declares itself.

### 4.1 Install procedure (user runs this once, interactively)

```
/plugin marketplace add D:\Workspace\polaris
/plugin install polaris@polaris
```

## 5. The skills

`SKILL.md` bodies are written in **English** — they are instructions read by the model, and this matches `docs/agents/*.md`. Text a skill *emits to the user* follows the language of the conversation.

### 5.1 `five-rules` (v0.1)

**Frontmatter description:** use when a new discussion starts, or when the user adds a new or extra requirement mid-task — states the work as a five-rule contract and waits for confirmation before acting.

**Behaviour:** announce the skill, post one Markdown block with all five rules filled in, then **stop and wait**. Do not begin work until the user says go or supplies corrections. On correction, reissue the block rather than arguing outside it.

**The block:**

```markdown
## 契約

**1. What** — <the task in one line, in the user's own framing>
**2. Why** — <the purpose it serves>
**3. How** — <numbered steps; name the files that will be touched>
**4. Prohibited** — <standing never-touch list applies by reference; then task-specific items>
**5. Done**

Scenario: <name>
  Given <precondition>
  When <action>
  Then <observable result>

完成後會自動給結案報告。
```

The closing line is not decoration — it is what puts the reporting obligation (§5.2) into the conversation for the whole task.

**Per-rule guidance carried in the skill:**

- **What** — restate in the user's framing. Do not quietly widen or narrow the scope while paraphrasing.
- **Why** — if the *How* does not serve the *Why*, say so before proceeding.
- **How** — numbered steps, and the files that will be touched. Naming the files is the cheapest blast-radius check available.
- **Prohibited** — see §6.3. Reference the never-touch list, do not copy it; then add task-specific items.
- **Never cite a never-touch list that has not been read.** If the project has no `## Never touch` section, say so in rule 4 — 「本專案尚未定義標準禁區;本次僅適用下列限制:…」— and suggest `/polaris:init-project`.
- **Done** — Gherkin. `Then` must name something checkable: a command that exits zero, a file that exists, output that matches. "Code is clean" and "it works" are not valid `Then` clauses. More than one scenario when the task has distinct success paths.

**Scaling.** The full block is required for anything that writes code, changes files, or spans more than one step.

For a pure question or lookup — nothing written, one step — use the short form instead: a single line naming what is being answered (What) and what a complete answer must contain (Done), with no Gherkin and no wait for confirmation. Example: *「回答:polaris 要怎麼安裝 — 完成條件:給出可直接貼進終端機的指令」*. Ceremony must not cost more than the answer.

### 5.2 `recap` (v0.1)

**Frontmatter description:** use when the work of a task is complete — closes it out with a structured report. Fires automatically on completion; it is not something the user has to ask for.

**Universality.** The obligation is *"any completed task ends with a report"*, not *"any task driven by five-rules"*. Work driven by `/superpowers:executing-plans`, by another plugin, or by no skill at all is still a completed task. The rule lives in `AGENTS.md`, which belongs to no skill, precisely so it applies regardless of what drove the work.

**When it fires:**

| Situation | Report? |
| --- | --- |
| Work agreed in a contract is finished | Yes |
| Stopping to ask the user a question | No — the work is not finished |
| A pure question answered under the short form | No — nothing was written and no work was done |
| Work blocked partway | Yes — mark §4 ❌ and state in §5 exactly where it stopped |

**The block:**

```markdown
## 結案報告

**1. 你要的** — <contract rule 1, copied verbatim>
**2. 做了什麼** — <actual steps against rule 3; deviations marked>
**3. 中間證據** — <what was found, what decided it, which assumptions were disproved>
**4. 驗收** — <each rule-5 Scenario, ✅/❌, with checkable evidence>
**5. 沒做 / 待辦** — <out of scope, blocked, or deliberately skipped>
```

**Four hard requirements carried in the skill:**

| Requirement | The failure it prevents |
| --- | --- |
| §1 copies the contract's rule 1 **verbatim**, never re-describes it | Back-deriving "what you wanted" from "what I built", so the two silently align |
| Deviations from rule 3 are **marked** | Pretending the plan was followed. If the approach changed, say what changed and why |
| Failed acceptance pastes **raw output** | "Should be fine." ❌ means ❌, with the real error text |
| §4 works **without a contract** — if there were no rule-5 Scenarios, state the acceptance criteria you actually held the work to (the commands you ran, the files you checked), one line each, with checkable evidence | "There was no contract, so nothing to verify" is not an acceptable §4 |

§3 (中間證據) is the section most easily compressed away and the one with the longest shelf life — it is the same argument `.scratch/orion-harness/spec.md` opens with: *reasoning is what is expensive to reconstruct*.

**Subagents.** A subagent's result returns to the main agent and is folded into the single final report. Subagents do not each emit their own.

**Enforcement:** text in v0.1, `Stop` hook in v0.2. See §8.

### 5.3 `init-project` (v0.1 text; settings and hooks land in v0.2)

**Frontmatter description:** use when setting up a project to use the polaris protocol, or after adding a new skill to polaris — interviews the user about the project's hard limits, then writes its guardrails into `AGENTS.md` and `CLAUDE.md`; `.claude/settings.json` follows in v0.2.

**Scope:** everything it produces is configuration for the target project. In v0.1 it writes `AGENTS.md` and `CLAUDE.md`, and nothing else; `.claude/settings.json` is v0.2 (step 5 below).

**Steps:**

1. Enumerate the sibling skill directories next to this `SKILL.md` — `../*/SKILL.md` relative to its own location, not a glob against the target project — and read each `name` and `description`. If they cannot be read, fall back to the skills listed in §6.7 and say in the report that the list was not enumerated.
2. **Interview the user** — the five questions in §5.3.1, asked one at a time. Answers are what §6.1 and §6.4 are built from. If the user skips a question, write nothing for it rather than guessing.
3. Ensure `AGENTS.md` exists in the target project root and contains the sections in §6.
4. Ensure `CLAUDE.md` contains `@AGENTS.md` as its first line — an import directive, not a prose pointer; a prose pointer imports nothing (see §7). Preserve every other line already in the file. If `CLAUDE.md` already holds real content, still add `@AGENTS.md` as the first line if missing and leave every existing line in place below it — moving that content elsewhere is a deliberate migration (§7), not something this step does. Report that `CLAUDE.md` holds content a human should migrate deliberately.
5. **v0.2:** write `permissions.deny` entries into `.claude/settings.json` from the §6.1 answers, and register the hooks from §8.
6. **Idempotent.** Idempotency is per *entry*, not per section: an existing section is scanned and only its missing entries are appended; never duplicate, never rewrite what is already present. A second run finds nothing to add unless polaris itself gained a skill since the last run, in which case the only change is the new `## Skills` bullet.
7. Report what was added and what was already present — via `recap`, like any other task. State plainly in the report that in v0.1 `## Never touch` and `## Critical actions` are instruction text the model reads, not harness-level deny rules; `permissions.deny` and the `PreToolUse` gate land in v0.2.

**Prohibited (stated inside the skill):** do not create `CONTEXT.md`, `docs/adr/`, `.scratch/`, or `.gitignore`; do not run `git init`; do not move or delete existing content. `docs/agents/domain.md` requires those files to be created lazily, and a bootstrap skill that creates them upfront directly contradicts it.

#### 5.3.1 The interview

Five fixed questions. Fixed, not open-ended, because "what should I never touch?" asked cold produces either silence or an essay.

1. Which paths hold credentials and keys? (`.env`, `secrets/`, certificate files)
2. Which data is production, or which databases must never be written to?
3. Which commands must never run? (deploy, migrate, drop, force push)
4. Which branches must never be pushed to directly?
5. Which actions have external side effects? (sending mail, posting, payments, outbound API calls)

Answers to 1–4 become the **never-touch** list (§6.1, tier 🔴). Answers to 5 become the **critical actions** list (§6.4, tier 🟡).

### 5.4 `vibe-diff` (v0.2)

**Frontmatter description:** use immediately before a critical action runs — translates the concrete proposed action into plain language and obtains explicit consent before it executes.

**Why it exists alongside `five-rules`.** They are the same mechanism at two moments: the contract checks *intent* before the task; the vibe diff checks *the actual command* before it runs. Drift between them is real — the contract is agreed, and the command that eventually gets generated is not quite the thing the contract described. This closes that gap.

**A skill cannot intercept anything.** Skills are model-invoked; using one to police the model fails exactly when the model's judgement is off, which is the case it exists for. Enforcement therefore needs two parts:

| Part | Responsibility |
| --- | --- |
| `PreToolUse` hook | Guarantees the **stop**. Matches the critical-actions list and forces a confirmation. Runs in the harness, not through the model |
| `vibe-diff` skill | Supplies the **plain language**. A hook is a shell script and can only echo the raw command; translating it and stating the blast radius is the model's job |

**The block:**

```markdown
## Vibe Diff

**你要的** — <the original intent, in the user's words>
**要跑的** — <the literal command or change>
**白話翻譯** — <what that line actually does>
**影響範圍** — <what it touches, how many rows/files, reversible?>
**不可逆?** — 是 / 否
```

**Deferred from the source concept, deliberately:**

- **Evaluator Quorum** (several independent evaluators voting) — implementable with subagents, but it costs N extra model calls per critical action. Revisit once wave 2 is in use.
- **Cryptographic consent** — Claude Code has no signing mechanism. v0.2's "explicit consent" is the permission prompt plus, for irreversible actions, requiring the user to type a specified string. Real signatures need external tooling and are outside this plugin.

### 5.5 `spec-to-html` (v0.2)

**Frontmatter description:** use when a spec, design document, or implementation plan written by the superpowers skills should be read or shared as a web page — renders the Markdown source as a styled, self-contained HTML file.

**Input.** A path to a Markdown file. When none is given, pick the most recently modified match, in order: `.scratch/*/spec.md`, then `docs/superpowers/specs/*.md`, then `docs/superpowers/plans/*.md`. Always state which file was chosen before rendering.

**Output.** A sibling file, same basename, `.html` extension — `.scratch/polaris/spec.md` → `.scratch/polaris/spec.html`. Re-running overwrites it.

**The page must be:**

- **Self-contained** — all CSS inline; no external stylesheet, font, script, or image request. It has to open from `file://` with no network.
- **Theme-aware** — honour `prefers-color-scheme` in both directions.
- **Navigable** — a table of contents generated from the `##` headings, with anchor links.
- **Readable on a phone** — relative units; wide tables and code blocks scroll inside their own `overflow-x: auto` container, so the page body never scrolls sideways.
- **Faithful in structure** — tables stay tables; Gherkin blocks keep their `Scenario` / `Given` / `When` / `Then` shape and are styled distinctly from ordinary code blocks.

**Prohibited (stated inside the skill):**

- Do not summarise, reorder, reword, or omit anything. This is a rendering, not a rewrite — every heading, row, and sentence in the source appears in the output.
- Do not modify the source `.md`.
- Do not fetch anything at render time.

**Sharing is a separate, explicit act.** The skill writes a local file and nothing else. Publishing to a shareable URL sends content to an external service, so it happens only when the user asks for it by name — never as a side effect of rendering.

**Relationship to the file-format rule (§6.2).** The `.md` remains the single source of truth; the `.html` is a generated view, not an exception to "prose documentation → Markdown". Generated HTML is not committed; the plan adds an ignore entry for it.

## 6. What `init-project` writes into `AGENTS.md`

### 6.1 `## Never touch` — tier 🔴

Built from interview answers 1–4. Human-readable, **with reasons**, so the model can route around a limit and explain why rather than hitting it and reporting a refusal.

```markdown
## Never touch

- `<path or command>` — <why>

These are not waivable inside a contract. If a task requires one, stop and ask whether to
lift it for that task.
```

Written **twice**, deliberately:

| Destination | Audience | What it buys |
| --- | --- | --- |
| `AGENTS.md` | the model | Awareness at planning time, and the reason, so avoidance is intelligent |
| `.claude/settings.json` → `permissions.deny` | the harness | The tool call is refused before it reaches the model's judgement. **This one does not depend on the model** (v0.2) |

Text asks. Settings enforce. A list that exists only as prose is a request.

### 6.2 `## File formats`

Written verbatim:

```markdown
## File formats

- Explanatory and prose documentation → Markdown (`.md`)
- Structured data → YAML (`.yaml`): config files, API field definitions, DB field definitions
- **Tool-mandated formats win.** `package.json`, `tsconfig.json`, `.claude-plugin/plugin.json` and lockfiles stay as they are. This rule governs only files whose format we choose.
- Do not introduce a third format (TOML, INI, ad-hoc JSON) for files we control. YAML frontmatter inside a `.md` file is consistent with these rules, not an exception.
```

The tool-mandated bullet is load-bearing: without it, "structured data → YAML" reads as an instruction to convert every JSON file in the repo.

### 6.3 How never-touch interacts with contract rule 4

**By reference, not by copy, and never liftable inside the contract.**

Rule 4 reads: *「標準禁區(見 `AGENTS.md` `## Never touch`)全部適用。本次額外:…」* followed by the task-specific items.

Copying the full list into every contract would put ten unchanging lines in front of the user every time, which is exactly how a block stops being read.

**The two kinds of prohibition are escalated differently, and that difference is the whole point:**

| Kind | If the task needs to violate it |
| --- | --- |
| Task-specific rule 4 item | Raise it inside the contract; the user decides there |
| Never-touch item | **Do not post a contract at all.** Stop and say: *"this task requires touching `X`, which is on the never-touch list. Lift it for this task?"* Lifting is a separate, one-off act |

If a never-touch entry could be waived in passing inside rule 4, it would degrade into an ordinary rule 4 item — and ordinary rule 4 items are written by the model. The list would mean nothing.

### 6.4 `## Critical actions` — tier 🟡 (v0.2)

Built from interview answer 5. Feeds both the `PreToolUse` hook matcher and the `vibe-diff` skill.

### 6.5 `## Reporting`

```markdown
## Reporting

Every completed task ends with a 結案報告 — regardless of which skill, plugin, or none at all drove the work. Format: /polaris:recap.
```

Deliberately not scoped to polaris skills. See §5.2.

### 6.6 The three tiers

| Tier | Configured in | Behaviour |
| --- | --- | --- |
| 🔴 Never touch | `permissions.deny` + `AGENTS.md` §6.1 | Hard stop. Requires explicit lifting outside the contract |
| 🟡 Critical | `AGENTS.md` §6.4 + `PreToolUse` hook | Vibe Diff plus explicit consent before running |
| 🟢 Normal | — | Governed by the five-rule contract alone |

### 6.7 `## Skills`

One line per polaris skill. `<summary>` is that skill's frontmatter `description`
**verbatim, collapsed to one line** — trigger and action both. Do not shorten it, do not
split it, do not invent wording that is not in the description. A bullet that says only
when to invoke a skill, and never what it does, is not a summary.

```markdown
## Skills

- **`/polaris:five-rules`** — <summary>
- **`/polaris:recap`** — <summary>
- **`/polaris:init-project`** — <summary>
```

## 7. `AGENTS.md` as the canonical file

Two agent-instruction files with overlapping content will drift. Therefore:

- `AGENTS.md` holds the content.
- `CLAUDE.md` holds `@AGENTS.md` plus anything genuinely Claude-specific.

Claude Code reads `CLAUDE.md`, not `AGENTS.md` (verified against
https://code.claude.com/docs/en/memory.md); `@AGENTS.md` is the import directive that
makes both files' content visible to a session, not a prose pointer, which imports
nothing — and it must not be wrapped in backticks or a fence, which would suppress the
import.

This applies to the polaris repo itself and to every project `init-project` touches.

**One-time Orion migration.** `d:\Workspace\Orion\CLAUDE.md` currently holds the real content (the `## Agent skills` section pointing at `docs/agents/*.md`). Moving it into a new `AGENTS.md` and reducing `CLAUDE.md` to the pointer is a **one-off manual step in the implementation plan**, not something `init-project` does. Keeping content migration out of the skill is what keeps its behaviour safe to re-run.

## 8. Triggering and enforcement

Skills are model-invoked; a skill alone guarantees nothing. Two mechanisms are skill-agnostic by construction, and both are used:

| Mechanism | Why it is universal |
| --- | --- |
| `AGENTS.md` text | Belongs to no skill. Loaded every session, so it applies whether the work was driven by polaris, by superpowers, or by nothing |
| Hooks | Fire in the harness. A hook does not know which skill was active and does not need to |

### 8.1 `Stop` hook for `recap` (v0.2)

The hard problem is not universality — it is that a script cannot tell "finished" from "pausing to ask you something". `/superpowers:brainstorming` ends by asking the user to review a spec; demanding a report there would be nagging.

Two cheap signals approximate it:

1. **Did the working tree change** — `git status` non-empty means this turn actually did something
2. **Does the last assistant message already contain `## 結案報告`** — the `Stop` hook receives the transcript path, so a script can check

**Changes present AND no report → block the stop and require one.** Pausing to ask a question usually leaves the tree untouched, so it does not misfire.

No marker file, and no cooperation required from any other skill or plugin. Editing another plugin's `SKILL.md` is explicitly rejected — it lives in the plugin cache and is overwritten on update.

### 8.2 `PreToolUse` hook for `vibe-diff` (v0.2)

Matches the §6.4 critical-actions list and forces a confirmation before the tool runs.

### 8.3 Deferred

A `SessionStart` hook injecting the rules verbatim. It guarantees the trigger but spends context every session including trivial ones. Adopt only if the `AGENTS.md` pointer proves leaky in practice.

## 9. Unverified assumptions — verify before building on them

These are **not** established facts. Wave 2's first implementation step is a minimal spike that pins each down; nothing else in wave 2 gets built until it does.

- [ ] `Stop` hook input actually carries a transcript path, and its output can block the stop
- [ ] `PreToolUse` hook output can force a confirmation (rather than only allow/deny outright)
- [ ] `permissions.deny` pattern syntax for paths and for command prefixes
- [ ] Hook registration from a plugin's `hooks/hooks.json` versus from the project's `.claude/settings.json`, and which wins

The only hook shape confirmed so far is superpowers' `SessionStart` entry in `hooks/hooks.json`, which establishes the file location and command-invocation form but nothing about `Stop` or `PreToolUse` semantics.

## 10. Done

```gherkin
Scenario: The v0.1 plugin installs and its skills are callable
  Given D:\Workspace\polaris exists with .claude-plugin\plugin.json and .claude-plugin\marketplace.json
  When the user runs /plugin marketplace add D:\Workspace\polaris and /plugin install polaris@polaris
  Then /polaris:five-rules, /polaris:recap and /polaris:init-project all appear in the skills list

Scenario: A new discussion produces a contract before any work
  Given the polaris plugin is installed and a project whose AGENTS.md carries the polaris sections
  When the user opens a new session and asks for a change that writes a file
  Then a five-rule block is posted with rule 5 as Gherkin, and no file is written until the user confirms

Scenario: A mid-task extra requirement re-opens the contract
  Given work is already underway under an agreed contract
  When the user adds a new requirement
  Then a revised five-rule block is posted before the new requirement is acted on

Scenario: A task in never-touch territory does not get a contract
  Given AGENTS.md lists .env under Never touch
  When the user asks for work that requires reading .env
  Then no contract is posted, and the reply asks whether to lift that entry for this task

Scenario: Completed work is reported without being asked
  Given a task was agreed under a contract and its work is finished
  When the agent finishes
  Then a 結案報告 is emitted whose section 1 is the contract's rule 1 verbatim
  And every rule-5 Scenario appears in section 4 marked with checkable evidence

Scenario: Work driven by another plugin still gets reported
  Given a task carried out under /superpowers:executing-plans with no polaris contract
  When the work completes
  Then a 結案報告 is still emitted, because the obligation lives in AGENTS.md rather than in five-rules

Scenario: init-project interviews before writing
  Given a project with no AGENTS.md
  When /polaris:init-project runs
  Then the five interview questions are asked one at a time
  And AGENTS.md afterwards contains Skills, File formats, Never touch and Reporting sections
  And CLAUDE.md contains the line "@AGENTS.md"

Scenario: Registration is idempotent
  Given a project whose AGENTS.md already contains every polaris section
  When /polaris:init-project runs again
  Then AGENTS.md is unchanged and the report states that every entry was already present

Scenario: A critical action is translated before it runs
  Given AGENTS.md lists a production migration command under Critical actions
  When that command is about to run
  Then execution stops, a Vibe Diff block is shown naming the blast radius and reversibility
  And the command runs only after the user consents explicitly

Scenario: A spec renders to a self-contained page
  Given .scratch/polaris/spec.md exists
  When /polaris:spec-to-html runs against it
  Then .scratch/polaris/spec.html exists, opens from file:// with the network disabled, and contains no external http/https resource reference
  And every "##" heading in spec.md appears both in the page's table of contents and in its body
  And spec.md is byte-for-byte unchanged

Scenario: Orion is migrated to the canonical layout
  Given Orion's CLAUDE.md currently holds the Agent skills section
  When the one-time migration is applied
  Then AGENTS.md holds that content, CLAUDE.md contains "@AGENTS.md", and no instruction text is lost
```

## 11. Rejected, and why

| Rejected | Why |
| --- | --- |
| Project skills in `.claude/skills/` | Invisible outside the containing repo; `init-project` would only ever see Orion |
| Naming the plugin `orion` | Collides with the Orion butler project |
| `houserules` / `canon` | Accurate today, wrong the moment the plugin grows non-convention skills |
| A standalone `file-formats` skill | One short rule whose whole job is to be text in `AGENTS.md`. A skill applies only when the model invokes it; always-loaded text applies unconditionally |
| Folding `recap` into `five-rules` | One description covering "at the start" and "at the end" blurs both triggers, and the end is the one that gets missed |
| A marker file to arm the `recap` `Stop` hook | Ties the trigger to five-rules, so work driven by any other skill escapes it. Working-tree diff plus transcript inspection is universal and needs no cooperation |
| Copying the never-touch list into every rule 4 | Ten unchanging lines per contract is how a block stops being read |
| Letting rule 4 waive a never-touch entry | It would degrade to an ordinary rule 4 item, and those are written by the model |
| Editing superpowers' `SKILL.md` to inject reporting | Lives in the plugin cache; overwritten on update |
| A `vibe-diff` skill with no hook | A model-invoked skill cannot intercept, and fails exactly when the model's judgement is off |
| Evaluator Quorum in v0.2 | N extra model calls per critical action. Revisit once wave 2 is in use |
| Cryptographic consent | Claude Code has no signing mechanism; real signatures need external tooling |
| Wide-scope `init-project` (CONTEXT.md, docs/adr/, git init) | Contradicts `docs/agents/domain.md`, which requires lazy creation |
| Duplicating content across `CLAUDE.md` and `AGENTS.md` | Guaranteed drift |
| `SessionStart` hook in v0.1 | Spends context every session; revisit only if the pointer approach leaks |
| Building all five skills before using any | The failure mode `.scratch/orion-harness/spec.md` §2.5 already names |
