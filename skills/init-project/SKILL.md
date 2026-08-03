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
