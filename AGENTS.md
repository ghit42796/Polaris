# Polaris

The working protocol this repo defines, applied to this repo.

## Skills

- **`/polaris:five-rules`** — Use when a new discussion starts, or when the user adds a new or extra requirement mid-task - states the work as a five-rule contract (What / Why / How / Prohibited / Done as Gherkin) and waits for confirmation before acting.
- **`/polaris:recap`** — Use when the work of a task is complete - closes it out with a structured report covering the original ask, what was done, the evidence found along the way, and acceptance against the agreed criteria. Fires automatically on completion; it is not something to wait to be asked for.
- **`/polaris:init-project`** — Use when setting up a project to use the polaris protocol, or after adding a new skill to polaris - interviews the user about the project's hard limits, then writes the guardrail sections into that project's AGENTS.md and points CLAUDE.md at it.

## Never touch

- `C:\Users\ghit4\.claude\plugins\cache\**` — **do not edit.** Reading is fine. Edits there are overwritten on update and silently lost
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
