# Polaris v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and install the polaris plugin's v0.1 core loop — `five-rules` (contract before work), `recap` (report after work), `init-project` (write a project's guardrails) — then apply it to the Orion repo.

**Architecture:** A Claude Code plugin at `D:\Workspace\polaris\`, its own git repo, installed from a local marketplace. Three skills, each a single `SKILL.md` with YAML frontmatter. No hooks, no `settings.json` writes, no executable runtime — v0.1 is entirely instruction text plus a validator script. Enforcement in v0.1 is textual (always-loaded `AGENTS.md`); the deterministic hook layer is v0.2 and out of scope here.

**Tech Stack:** Markdown + YAML frontmatter, JSON manifests (tool-mandated), PowerShell 5.1 for the validator, git.

**Spec:** `docs/spec.md`. Section references below (§4, §5.1, …) point at it.

**Status:** executed. Tasks 1-5 shipped as commits `7ad4b89`..`22e35c1`. A final whole-branch review then found eleven defects, fixed in `1651605`; the `SKILL.md` content embedded in Tasks 2-4 below is the *as-planned* text and differs from what shipped wherever that commit touched it. The shipped files are ground truth. Tasks 6 and 7 require the user and were not executed.

## Global Constraints

- **Platform:** Windows 11, PowerShell 5.1. No `&&`, no `??`, no ternary. Chain with `A; if ($?) { B }`. Write files with `-Encoding utf8`.
- **v0.1 scope only.** Do NOT create `vibe-diff`, `spec-to-html`, `hooks/hooks.json`, or any `.claude/settings.json` entries. Spec §3 defers all of them to v0.2.
- **`SKILL.md` bodies are written in English.** Text a skill *emits to the user at runtime* follows the language of the conversation — that instruction lives inside the skill.
- **File formats:** prose → Markdown `.md`; structured data → YAML `.yaml`. Tool-mandated formats win: `plugin.json` and `marketplace.json` stay JSON because Claude Code requires it.
- **Plugin identity, exact values:** `name` `polaris`, `version` `0.1.0`, `author.name` `dev_fsk`, `license` `MIT`, marketplace plugin `source` `./`.
- **Skill directory name must equal the frontmatter `name`.** `scripts/check-skills.ps1` enforces this; every skill task runs it.
- **Never modify** `C:\Users\ghit4\.claude\plugins\cache\**` — that is the plugin cache and is overwritten on update (spec §11).
- Each task ends with a commit. Commit messages use Conventional Commits (`feat:`, `chore:`, `docs:`).

---

## File Structure

**New repo — `D:\Workspace\polaris\`:**

| Path | Responsibility |
| --- | --- |
| `.claude-plugin/plugin.json` | Plugin identity. Read by Claude Code on install |
| `.claude-plugin/marketplace.json` | Lets the local directory be added as a marketplace |
| `scripts/check-skills.ps1` | Validator. The only executable thing in v0.1; every skill task's test |
| `skills/five-rules/SKILL.md` | Contract-before-work protocol |
| `skills/recap/SKILL.md` | Report-after-work protocol |
| `skills/init-project/SKILL.md` | Interview + write a target project's guardrails |
| `AGENTS.md` | Canonical agent instructions for the polaris repo itself (dogfooding) |
| `CLAUDE.md` | `@AGENTS.md` and nothing else |
| `README.md` | Human-facing: what it is, how to install |
| `.gitignore` | `*.html` under spec dirs, OS cruft |

**Existing repo — `d:\Workspace\Orion\` (Task 7 only):**

| Path | Change |
| --- | --- |
| `AGENTS.md` | Create. Receives the current `CLAUDE.md` content plus the polaris sections |
| `CLAUDE.md` | Reduce to `@AGENTS.md` |

Each skill is one file because each is one protocol, read whole at invocation time. There is no shared runtime to factor out — the duplication between skills is conceptual (they reference the same contract), not textual.

---

### Task 1: Repo skeleton, manifests, and the validator

**Files:**
- Create: `D:\Workspace\polaris\.gitignore`
- Create: `D:\Workspace\polaris\.claude-plugin\plugin.json`
- Create: `D:\Workspace\polaris\.claude-plugin\marketplace.json`
- Create: `D:\Workspace\polaris\scripts\check-skills.ps1`

**Interfaces:**
- Consumes: nothing.
- Produces: `scripts/check-skills.ps1` — run as `powershell -File D:\Workspace\polaris\scripts\check-skills.ps1`. Exits `0` when every `skills/*/SKILL.md` is valid, `1` otherwise, printing one line per skill. Tasks 2, 3, 4 use it as their test.

- [ ] **Step 1: Create the directory and initialise git**

```powershell
New-Item -ItemType Directory -Force D:\Workspace\polaris\.claude-plugin
New-Item -ItemType Directory -Force D:\Workspace\polaris\skills
New-Item -ItemType Directory -Force D:\Workspace\polaris\scripts
git -C D:\Workspace\polaris init
```

- [ ] **Step 2: Write the validator — it must fail first**

Create `D:\Workspace\polaris\scripts\check-skills.ps1`:

```powershell
# Validates every skills/<dir>/SKILL.md in this repo.
# Exit 0 = all valid. Exit 1 = at least one problem, printed above.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$skillsDir = Join-Path $root 'skills'
$problems = @()

if (-not (Test-Path $skillsDir)) {
    Write-Output "FAIL: no skills directory at $skillsDir"
    exit 1
}

$dirs = Get-ChildItem $skillsDir -Directory
if ($dirs.Count -eq 0) {
    Write-Output "FAIL: skills directory is empty"
    exit 1
}

foreach ($d in $dirs) {
    $file = Join-Path $d.FullName 'SKILL.md'
    if (-not (Test-Path $file)) {
        $problems += "FAIL $($d.Name): no SKILL.md"
        continue
    }

    $lines = Get-Content $file -Encoding utf8
    if ($lines.Count -lt 4 -or $lines[0].Trim() -ne '---') {
        $problems += "FAIL $($d.Name): first line is not '---'"
        continue
    }

    $close = -1
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -eq '---') { $close = $i; break }
    }
    if ($close -lt 0) {
        $problems += "FAIL $($d.Name): frontmatter is not closed"
        continue
    }

    $fm = $lines[1..($close - 1)]
    $nameLine = $fm | Where-Object { $_ -match '^name:\s*(.+)$' } | Select-Object -First 1
    $descLine = $fm | Where-Object { $_ -match '^description:\s*(.+)$' } | Select-Object -First 1

    if (-not $nameLine) { $problems += "FAIL $($d.Name): no name in frontmatter"; continue }
    if (-not $descLine) { $problems += "FAIL $($d.Name): no description in frontmatter"; continue }

    $name = ([regex]::Match($nameLine, '^name:\s*(.+)$')).Groups[1].Value.Trim()
    $desc = ([regex]::Match($descLine, '^description:\s*(.+)$')).Groups[1].Value.Trim()

    if ($name -ne $d.Name) {
        $problems += "FAIL $($d.Name): frontmatter name '$name' does not match directory"
        continue
    }
    if ($desc.Length -lt 40) {
        $problems += "FAIL $($d.Name): description is too short to drive invocation ($($desc.Length) chars)"
        continue
    }
    if ($desc -notmatch '(?i)use when') {
        $problems += "FAIL $($d.Name): description does not say when to use the skill"
        continue
    }

    $body = ($lines[($close + 1)..($lines.Count - 1)] -join "`n").Trim()
    if ($body.Length -lt 200) {
        $problems += "FAIL $($d.Name): body is too short to be a real skill"
        continue
    }

    Write-Output "OK   $($d.Name)"
}

if ($problems.Count -gt 0) {
    $problems | ForEach-Object { Write-Output $_ }
    exit 1
}
Write-Output "All skills valid."
exit 0
```

- [ ] **Step 3: Run it to verify it fails**

Run: `powershell -NoProfile -File D:\Workspace\polaris\scripts\check-skills.ps1; $LASTEXITCODE`

Expected: prints `FAIL: skills directory is empty`, exit code `1`. There are no skills yet — this is the red state.

- [ ] **Step 4: Write `.claude-plugin/plugin.json`**

```json
{
  "name": "polaris",
  "description": "Working protocol: a five-rule contract before work, a structured report after it, and a project initialiser that writes both into a repo's guardrails",
  "version": "0.1.0",
  "author": {
    "name": "dev_fsk"
  },
  "license": "MIT",
  "keywords": [
    "skills",
    "workflow",
    "conventions",
    "guardrails"
  ]
}
```

- [ ] **Step 5: Write `.claude-plugin/marketplace.json`**

```json
{
  "name": "polaris",
  "description": "Local marketplace for the polaris working-protocol plugin",
  "owner": {
    "name": "dev_fsk"
  },
  "plugins": [
    {
      "name": "polaris",
      "description": "Working protocol: a five-rule contract before work, a structured report after it, and a project initialiser that writes both into a repo's guardrails",
      "version": "0.1.0",
      "source": "./",
      "author": {
        "name": "dev_fsk"
      }
    }
  ]
}
```

- [ ] **Step 6: Write `.gitignore`**

```gitignore
# Generated views of specs and plans — the .md is the source of truth
*.html

# OS cruft
Thumbs.db
desktop.ini
.DS_Store
```

- [ ] **Step 7: Verify both manifests are valid JSON and carry the exact values**

Run:

```powershell
$p = Get-Content D:\Workspace\polaris\.claude-plugin\plugin.json -Raw | ConvertFrom-Json
$m = Get-Content D:\Workspace\polaris\.claude-plugin\marketplace.json -Raw | ConvertFrom-Json
"plugin name=$($p.name) version=$($p.version) author=$($p.author.name) license=$($p.license)"
"marketplace name=$($m.name) plugins=$($m.plugins.Count) source=$($m.plugins[0].source)"
```

Expected output, exactly:

```
plugin name=polaris version=0.1.0 author=dev_fsk license=MIT
marketplace name=polaris plugins=1 source=./
```

If `ConvertFrom-Json` throws, the file is malformed — fix it before continuing.

- [ ] **Step 8: Commit**

```powershell
git -C D:\Workspace\polaris add .gitignore .claude-plugin scripts
git -C D:\Workspace\polaris commit -m @'
chore: scaffold polaris plugin with manifests and skill validator

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 2: The `five-rules` skill

**Files:**
- Create: `D:\Workspace\polaris\skills\five-rules\SKILL.md`
- Test: `D:\Workspace\polaris\scripts\check-skills.ps1`

**Interfaces:**
- Consumes: `scripts/check-skills.ps1` from Task 1.
- Produces: skill `five-rules`. Task 4's `## Skills` section lists it; Task 3's `recap` refers to "the contract" meaning this skill's block.

- [ ] **Step 1: Run the validator to confirm it fails for this skill**

```powershell
New-Item -ItemType Directory -Force D:\Workspace\polaris\skills\five-rules
powershell -NoProfile -File D:\Workspace\polaris\scripts\check-skills.ps1; $LASTEXITCODE
```

Expected: `FAIL five-rules: no SKILL.md`, exit code `1`.

- [ ] **Step 2: Write `skills/five-rules/SKILL.md`**

Content verbatim (spec §5.1 and §6.3):

````markdown
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
````

- [ ] **Step 3: Run the validator to verify it passes**

Run: `powershell -NoProfile -File D:\Workspace\polaris\scripts\check-skills.ps1; $LASTEXITCODE`

Expected: `OK   five-rules`, then `All skills valid.`, exit code `0`.

- [ ] **Step 4: Verify the block template survived the file write**

Run:

```powershell
$c = Get-Content D:\Workspace\polaris\skills\five-rules\SKILL.md -Raw -Encoding utf8
"契約 present: $($c.Contains('## 契約'))"
"closing line present: $($c.Contains('完成後會自動給結案報告'))"
"gherkin present: $($c.Contains('Scenario: <name>'))"
```

Expected: all three print `True`. If any is `False`, the encoding dropped the CJK text — rewrite the file with `-Encoding utf8`.

- [ ] **Step 5: Commit**

```powershell
git -C D:\Workspace\polaris add skills/five-rules/SKILL.md
git -C D:\Workspace\polaris commit -m @'
feat: add five-rules contract skill

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 3: The `recap` skill

**Files:**
- Create: `D:\Workspace\polaris\skills\recap\SKILL.md`
- Test: `D:\Workspace\polaris\scripts\check-skills.ps1`

**Interfaces:**
- Consumes: `scripts/check-skills.ps1` from Task 1. Refers to the contract block produced by `five-rules` (Task 2) — specifically its rule 1 and rule 5.
- Produces: skill `recap`. Task 4's `## Skills` and `## Reporting` sections both reference it.

- [ ] **Step 1: Run the validator to confirm it fails for this skill**

```powershell
New-Item -ItemType Directory -Force D:\Workspace\polaris\skills\recap
powershell -NoProfile -File D:\Workspace\polaris\scripts\check-skills.ps1; $LASTEXITCODE
```

Expected: `FAIL recap: no SKILL.md`, exit code `1`.

- [ ] **Step 2: Write `skills/recap/SKILL.md`**

Content verbatim (spec §5.2):

````markdown
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
````

- [ ] **Step 3: Run the validator to verify it passes**

Run: `powershell -NoProfile -File D:\Workspace\polaris\scripts\check-skills.ps1; $LASTEXITCODE`

Expected: `OK   five-rules`, `OK   recap`, `All skills valid.`, exit code `0`.

- [ ] **Step 4: Verify the report template survived the file write**

Run:

```powershell
$c = Get-Content D:\Workspace\polaris\skills\recap\SKILL.md -Raw -Encoding utf8
"heading present: $($c.Contains('## 結案報告'))"
"evidence section present: $($c.Contains('中間證據'))"
"fires-automatically stated: $($c.Contains('This fires on its own'))"
```

Expected: all three print `True`.

- [ ] **Step 5: Commit**

```powershell
git -C D:\Workspace\polaris add skills/recap/SKILL.md
git -C D:\Workspace\polaris commit -m @'
feat: add recap closing-report skill

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 4: The `init-project` skill

**Files:**
- Create: `D:\Workspace\polaris\skills\init-project\SKILL.md`
- Test: `D:\Workspace\polaris\scripts\check-skills.ps1`

**Interfaces:**
- Consumes: `scripts/check-skills.ps1` from Task 1. Reads the frontmatter `name` and `description` of the skills built in Tasks 2 and 3.
- Produces: skill `init-project`. Task 5 applies it by hand to the polaris repo; Task 7 runs it against Orion. The section templates it defines (`## Skills`, `## Never touch`, `## Critical actions`, `## File formats`, `## Reporting`) are the exact text Tasks 5 and 7 must produce.

- [ ] **Step 1: Run the validator to confirm it fails for this skill**

```powershell
New-Item -ItemType Directory -Force D:\Workspace\polaris\skills\init-project
powershell -NoProfile -File D:\Workspace\polaris\scripts\check-skills.ps1; $LASTEXITCODE
```

Expected: `FAIL init-project: no SKILL.md`, exit code `1`.

- [ ] **Step 2: Write `skills/init-project/SKILL.md`**

Content verbatim (spec §5.3, §5.3.1, §6):

`````markdown
---
name: init-project
description: Use when setting up a project to use the polaris protocol, or after adding a new skill to polaris - interviews the user about the project's hard limits, then writes the guardrail sections into that project's AGENTS.md and points CLAUDE.md at it.
---

# Init Project

Write a project's guardrails so every later session inherits them.

Everything this skill produces is configuration for the target project. In v0.1 it writes
`AGENTS.md` and `CLAUDE.md`, and nothing else.

## Steps

1. Enumerate `skills/*/SKILL.md` in the polaris plugin. Read each `name` and `description`.
2. Run the interview below, one question at a time.
3. Ensure `AGENTS.md` exists in the target project root and carries every section under
   "Sections written".
4. Ensure `CLAUDE.md` exists and contains the line `See AGENTS.md.` Preserve every other
   line already in it.
5. Report what was added and what was already present — through `recap`, like any task.

## Idempotent

Sections and entries that already exist are left alone. Add only what is missing. Never
duplicate an entry, never rewrite one that is already there. A second run on the same
project must find nothing to do and say so.

## Prohibited

- Do not create `CONTEXT.md`, `docs/adr/`, `.scratch/`, or `.gitignore`
- Do not run `git init`
- Do not move or delete existing content

Those files get created lazily, when something actually needs them. A bootstrap skill that
creates them upfront contradicts that.

## The Interview

Five fixed questions, asked one at a time. Fixed rather than open-ended because "what
should I never touch?" asked cold produces either silence or an essay.

1. Which paths hold credentials and keys? (`.env`, `secrets/`, certificate files)
2. Which data is production, or which databases must never be written to?
3. Which commands must never run? (deploy, migrate, drop, force push)
4. Which branches must never be pushed to directly?
5. Which actions have external side effects? (sending mail, posting, payments, outbound
   API calls)

Answers to 1–4 become `## Never touch`. Answers to 5 become `## Critical actions`.

**If they skip a question, write nothing for it.** Never guess a project's hard limits — a
guessed never-touch entry is worse than none, because it looks authoritative.

## Sections Written

### `## Skills`

One line per polaris skill. `<summary>` is the first clause of that skill's frontmatter
`description`, trimmed to one line. Do not invent a summary.

```markdown
## Skills

- **`/polaris:five-rules`** — <summary>
- **`/polaris:recap`** — <summary>
- **`/polaris:init-project`** — <summary>
```

### `## Never touch`

From interview answers 1–4. Include the reason. The reason is what lets a limit be routed
around intelligently instead of merely hit and reported.

```markdown
## Never touch

- `<path or command>` — <why>

These are not waivable inside a contract. If a task requires one, stop and ask whether to
lift it for that task.
```

Omit the section entirely if every one of questions 1–4 was skipped.

### `## Critical actions`

From interview answer 5. Omit the section entirely if that question was skipped.

```markdown
## Critical actions

- `<action>` — <why it is critical>
```

### `## File formats`

Verbatim:

```markdown
## File formats

- Explanatory and prose documentation → Markdown (`.md`)
- Structured data → YAML (`.yaml`): config files, API field definitions, DB field definitions
- **Tool-mandated formats win.** `package.json`, `tsconfig.json`, `.claude-plugin/plugin.json`
  and lockfiles stay as they are. This rule governs only files whose format we choose.
- Do not introduce a third format (TOML, INI, ad-hoc JSON) for files we control. YAML
  frontmatter inside a `.md` file is consistent with these rules, not an exception.
```

The tool-mandated bullet is load-bearing. Without it, "structured data → YAML" reads as an
instruction to convert every JSON file in the repo.

### `## Reporting`

Verbatim:

```markdown
## Reporting

Every completed task ends with a 結案報告 — regardless of which skill, plugin, or none at
all drove the work. Format: /polaris:recap.
```

Deliberately not scoped to polaris skills. Work driven by any other skill is still a
completed task, and this section is what makes the rule reach it.

## `CLAUDE.md`

It holds `See AGENTS.md.` plus anything genuinely Claude-specific, and nothing else. Two
instruction files with overlapping content will drift; `AGENTS.md` is the one with content.

If `CLAUDE.md` already holds real content, **do not move it** — that is a migration, not an
initialisation, and it belongs to whoever is doing it deliberately. Report the situation
and leave the file alone.
`````

- [ ] **Step 3: Run the validator to verify it passes**

Run: `powershell -NoProfile -File D:\Workspace\polaris\scripts\check-skills.ps1; $LASTEXITCODE`

Expected: `OK   five-rules`, `OK   init-project`, `OK   recap`, `All skills valid.`, exit code `0`.

- [ ] **Step 4: Verify every section template is present**

Run:

```powershell
$c = Get-Content D:\Workspace\polaris\skills\init-project\SKILL.md -Raw -Encoding utf8
foreach ($s in '## Skills','## Never touch','## Critical actions','## File formats','## Reporting') {
  "$s -> $($c.Contains($s))"
}
"interview has 5 questions: $(([regex]::Matches($c, '(?m)^\d\. Which ')).Count -eq 5)"
```

Expected: all five sections print `True`, and the question count prints `True`.

- [ ] **Step 5: Commit**

```powershell
git -C D:\Workspace\polaris add skills/init-project/SKILL.md
git -C D:\Workspace\polaris commit -m @'
feat: add init-project guardrail initialiser skill

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 5: The polaris repo's own docs (dogfooding)

**Files:**
- Create: `D:\Workspace\polaris\AGENTS.md`
- Create: `D:\Workspace\polaris\CLAUDE.md`
- Create: `D:\Workspace\polaris\README.md`

**Interfaces:**
- Consumes: the section templates defined in Task 4's `SKILL.md`. This task produces by hand exactly what `init-project` would produce, which is how the templates get proofread before they are ever run against a real project.
- Produces: nothing later tasks import. Task 7 mirrors this structure for Orion.

- [ ] **Step 1: Write `AGENTS.md`**

```markdown
# Polaris

The working protocol this repo defines, applied to this repo.

## Skills

- **`/polaris:five-rules`** — use when a new discussion starts, or when the user adds a new or extra requirement mid-task
- **`/polaris:recap`** — use when the work of a task is complete
- **`/polaris:init-project`** — use when setting up a project to use the polaris protocol, or after adding a new skill to polaris

## Never touch

- `C:\Users\ghit4\.claude\plugins\cache\**` — the installed plugin cache. Edits there are overwritten on update and silently lost
- `.claude-plugin/plugin.json` `name` and `.claude-plugin/marketplace.json` `plugins[0].name` — changing either breaks every existing install

These are not waivable inside a contract. If a task requires one, stop and ask whether to
lift it for that task.

## File formats

- Explanatory and prose documentation → Markdown (`.md`)
- Structured data → YAML (`.yaml`): config files, API field definitions, DB field definitions
- **Tool-mandated formats win.** `package.json`, `tsconfig.json`, `.claude-plugin/plugin.json`
  and lockfiles stay as they are. This rule governs only files whose format we choose.
- Do not introduce a third format (TOML, INI, ad-hoc JSON) for files we control. YAML
  frontmatter inside a `.md` file is consistent with these rules, not an exception.

## Reporting

Every completed task ends with a 結案報告 — regardless of which skill, plugin, or none at
all drove the work. Format: /polaris:recap.

## Checks

Before committing a change to any skill:

    powershell -NoProfile -File scripts\check-skills.ps1

Exit code 0 means every `skills/*/SKILL.md` has valid frontmatter, a `name` matching its
directory, and a description that says when to use it.
```

- [ ] **Step 2: Write `CLAUDE.md`**

```markdown
@AGENTS.md
```

- [ ] **Step 3: Write `README.md`**

````markdown
# Polaris

A Claude Code plugin carrying a working protocol: state the work as a contract before
starting, report it with evidence when finished, and write both rules into a project so
every session inherits them.

## Skills

| Skill | When it fires | What it does |
| --- | --- | --- |
| `/polaris:five-rules` | A discussion starts, or a new requirement arrives mid-task | Posts a five-rule contract — What / Why / How / Prohibited / Done as Gherkin — and waits for confirmation |
| `/polaris:recap` | Work finishes | Posts a closing report: the original ask verbatim, what was done, the evidence found along the way, acceptance, and what was left out |
| `/polaris:init-project` | Setting a project up | Interviews you about the project's hard limits, then writes them into `AGENTS.md` |

## Install

```
/plugin marketplace add D:\Workspace\polaris
/plugin install polaris@polaris
```

Editing a skill afterwards needs a reload before the change takes effect.

## Development

```
powershell -NoProfile -File scripts\check-skills.ps1
```

Validates every `skills/*/SKILL.md`. Exit code 0 means all valid.

## Status

v0.1. The enforcement layer — a `Stop` hook for `recap`, a `PreToolUse` hook plus
`vibe-diff` for critical actions, and `spec-to-html` — is v0.2, gated behind verifying
what Claude Code hooks can actually do.
````

- [ ] **Step 4: Verify the docs are consistent with the skills that exist**

Run:

```powershell
$agents = Get-Content D:\Workspace\polaris\AGENTS.md -Raw -Encoding utf8
$dirs = (Get-ChildItem D:\Workspace\polaris\skills -Directory).Name
foreach ($d in $dirs) { "$d listed in AGENTS.md: $($agents.Contains("/polaris:$d"))" }
"CLAUDE.md is the pointer: $((Get-Content D:\Workspace\polaris\CLAUDE.md -Raw -Encoding utf8).Trim() -eq '@AGENTS.md')"
powershell -NoProfile -File D:\Workspace\polaris\scripts\check-skills.ps1; $LASTEXITCODE
```

Expected: three `True` lines for the skills, `True` for the pointer, then `All skills valid.` and exit code `0`.

- [ ] **Step 5: Commit**

```powershell
git -C D:\Workspace\polaris add AGENTS.md CLAUDE.md README.md
git -C D:\Workspace\polaris commit -m @'
docs: add polaris AGENTS.md, CLAUDE.md pointer, and README

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 6: Install and smoke-test

**Files:** none created or modified. This task verifies Tasks 1–5 against a live Claude Code.

**Interfaces:**
- Consumes: the complete repo from Tasks 1–5.
- Produces: a confirmed install. Task 7 needs `/polaris:init-project` to actually be callable.

**This task contains steps only the user can run.** `/plugin` is interactive; an agent cannot execute it. Stop and hand these to them.

- [ ] **Step 1: Ask the user to add the marketplace and install**

They run, in Claude Code:

```
/plugin marketplace add D:\Workspace\polaris
/plugin install polaris@polaris
```

- [ ] **Step 2: Ask the user to confirm the three skills are listed**

They run `/help` or open the skills list, and confirm all three appear:

```
/polaris:five-rules
/polaris:recap
/polaris:init-project
```

Expected: all three present. If none appear, the marketplace path or `marketplace.json` is wrong — re-check Task 1 Step 7 output before changing anything else.

- [ ] **Step 3: Behavioural smoke test — the contract gate**

In a fresh session, the user asks for something small that writes a file, e.g. *"在 polaris 加一個 docs/notes.md,寫一行 hello"*.

Expected: a `## 契約` block appears with all five rules, rule 5 in Gherkin, and **no file is written** until they confirm.

Actual failure to watch for: work starts immediately. That means the skill did not fire — the fix is the `AGENTS.md` pointer, not the skill body.

- [ ] **Step 4: Behavioural smoke test — the closing report**

They confirm the contract and let the task finish.

Expected: a `## 結案報告` block appears **without being asked**, whose section 1 repeats the contract's rule 1 verbatim.

- [ ] **Step 5: Behavioural smoke test — a mid-task extra requirement re-opens the contract**

Covers spec §10 scenario *"A mid-task extra requirement re-opens the contract"*.

While a contract is agreed and work is underway, the user adds a requirement, e.g. *"順便也加一個 docs/notes-2.md"*.

Expected: a revised `## 契約` block appears **before** the new requirement is acted on.

Failure to watch for: the extra file simply appears with no new contract. That means the skill's "or when the user adds a new or extra requirement mid-task" trigger is not reading as a trigger — the fix is the frontmatter `description`, not the body.

- [ ] **Step 6: Behavioural smoke test — a never-touch task gets no contract**

Covers spec §10 scenario *"A task in never-touch territory does not get a contract"*.

Temporarily add a never-touch entry to `D:\Workspace\polaris\AGENTS.md`:

```powershell
Add-Content D:\Workspace\polaris\AGENTS.md -Encoding utf8 -Value "- ``D:\Workspace\polaris\scripts\**`` — smoke test entry, remove after"
```

In a fresh session the user asks for a change to `scripts/check-skills.ps1`.

Expected: **no contract is posted.** The reply says the task requires touching a never-touch entry and asks whether to lift it for this task.

Then remove the temporary line:

```powershell
git -C D:\Workspace\polaris checkout -- AGENTS.md
```

- [ ] **Step 7: Behavioural smoke test — work driven by another skill still gets reported**

Covers spec §10 scenario *"Work driven by another plugin still gets reported"*. This is the one that proves the reporting rule lives in `AGENTS.md` rather than inside `five-rules`.

In a fresh session the user runs a task through a superpowers skill instead — e.g. `/superpowers:brainstorming` on a throwaway idea — and lets it reach a completion point.

Expected: a `## 結案報告` still appears, with no polaris contract anywhere in the session.

Failure to watch for: no report. That means the obligation is being read as belonging to `five-rules`. The fix is the wording of `## Reporting` in `AGENTS.md` — it must not mention contracts as a precondition.

- [ ] **Step 8: Record the result**

Append what actually happened — including every smoke test that did **not** fire — to `.scratch/polaris/spec.md` under a new `## 12. v0.1 field notes` heading. Wave 2's design depends on this being honest rather than tidy: a skill that silently failed to trigger is the single most useful thing v0.1 can teach.

---

### Task 7: Migrate Orion to the canonical layout

**Files:**
- Create: `d:\Workspace\Orion\AGENTS.md`
- Modify: `d:\Workspace\Orion\CLAUDE.md` — replace all 17 lines with the pointer

**Interfaces:**
- Consumes: a working `/polaris:init-project` from Task 6.
- Produces: the first real project running the protocol.

The current `d:\Workspace\Orion\CLAUDE.md` holds real content (an `## Agent skills` section pointing at `docs/agents/issue-tracker.md`, `triage-labels.md`, `domain.md`). `init-project` deliberately refuses to move existing content — that is this task's job, done deliberately and by hand.

- [ ] **Step 1: Branch — do not do this on `main`**

```powershell
git -C d:\Workspace\Orion checkout -b polaris-protocol
```

- [ ] **Step 2: Capture the current CLAUDE.md content**

```powershell
Get-Content d:\Workspace\Orion\CLAUDE.md -Raw -Encoding utf8
```

Keep the output. Every instruction line in it must survive into `AGENTS.md`.

- [ ] **Step 3: Create `d:\Workspace\Orion\AGENTS.md` with the existing content preserved**

```markdown
# Orion

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Skills

- **`/polaris:five-rules`** — Use when a new discussion starts, or when the user adds a new or extra requirement mid-task - states the work as a five-rule contract (What / Why / How / Prohibited / Done as Gherkin) and waits for confirmation before acting.
- **`/polaris:recap`** — Use when the work of a task is complete - closes it out with a structured report covering the original ask, what was done, the evidence found along the way, and acceptance against the agreed criteria. Fires automatically on completion; it is not something to wait to be asked for.
- **`/polaris:init-project`** — Use when setting up a project to use the polaris protocol, or after adding a new skill to polaris - interviews the user about the project's hard limits, then writes the guardrail sections into that project's AGENTS.md and points CLAUDE.md at it.

## File formats

- Explanatory and prose documentation → Markdown (`.md`)
- Structured data → YAML (`.yaml`): config files, API field definitions, DB field definitions
- **Tool-mandated formats win.** `package.json`, `tsconfig.json`, `.claude-plugin/plugin.json`
  and lockfiles stay as they are. This rule governs only files whose format we choose.
- Do not introduce a third format (TOML, INI, ad-hoc JSON) for files we control. YAML
  frontmatter inside a `.md` file is consistent with these rules, not an exception.

## Reporting

Every completed task ends with a 結案報告 — regardless of which skill, plugin, or none at
all drove the work. Format: /polaris:recap.
```

- [ ] **Step 4: Run the interview for `## Never touch` and `## Critical actions`**

Ask the user the five questions from Task 4's skill, one at a time. Append `## Never touch` and `## Critical actions` to `AGENTS.md` from their answers, using the exact templates in Task 4 Step 2.

**Write nothing for a skipped question.** Orion has no `.env` and no deploy pipeline yet (`.scratch/orion-harness/spec.md` §3.4 records no `ANTHROPIC_API_KEY` on this machine), so "none yet" is a legitimate and likely answer for several of them.

- [ ] **Step 5: Replace `CLAUDE.md`**

```markdown
@AGENTS.md
```

- [ ] **Step 6: Verify no instruction text was lost**

Run:

```powershell
$agents = Get-Content d:\Workspace\Orion\AGENTS.md -Raw -Encoding utf8
foreach ($s in 'issue-tracker.md','triage-labels.md','domain.md','.scratch/<feature-slug>/') {
  "$s survived: $($agents.Contains($s))"
}
"CLAUDE.md is the pointer: $((Get-Content d:\Workspace\Orion\CLAUDE.md -Raw -Encoding utf8).Trim() -eq '@AGENTS.md')"
```

Expected: five `True` lines. Any `False` means content was dropped in Step 3 — restore it from Step 2's output before committing.

- [ ] **Step 7: Commit**

```powershell
git -C d:\Workspace\Orion add AGENTS.md CLAUDE.md
git -C d:\Workspace\Orion commit -m @'
docs: adopt polaris protocol, move instructions to AGENTS.md

CLAUDE.md becomes a pointer so the two files cannot drift.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
'@
```

- [ ] **Step 8: Confirm idempotency**

The user runs `/polaris:init-project` against Orion a second time.

Expected: it reports every section already present and changes nothing. Verify with:

```powershell
git -C d:\Workspace\Orion status --short
```

Expected: empty output.

---

## Out of scope for this plan

Spec §3 defers these to v0.2, after v0.1 has been used and after the §9 spike answers what hooks can actually do:

- `vibe-diff` skill and its `PreToolUse` hook
- `spec-to-html` skill
- `Stop` hook enforcing `recap`
- `.claude/settings.json` `permissions.deny` entries generated from the never-touch list
- Evaluator Quorum, cryptographic consent
