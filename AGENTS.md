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
