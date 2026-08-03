# Polaris

A Claude Code plugin carrying a working protocol: state the work as a contract before
starting, report it with evidence when finished, and write both rules into a project so
every session inherits them.

## Skills

| Skill | When it fires | What it does |
| --- | --- | --- |
| `/polaris:five-rules` | A discussion starts, or a new requirement arrives mid-task | Posts a five-rule contract — What / Why / How / Prohibited / Done as Gherkin — and waits for confirmation |
| `/polaris:recap` | Work finishes | Posts a closing report: the original ask verbatim, what was done, the evidence found along the way, acceptance, and what was left out |
| `/polaris:init-project` | Setting a project up | Interviews you about the project's hard limits, then writes them into `AGENTS.md` and `CLAUDE.md` |

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
`vibe-diff` for critical actions, `.claude/settings.json` `permissions.deny` generation
from the never-touch list, and `spec-to-html` — is v0.2, gated behind verifying what
Claude Code hooks can actually do.
