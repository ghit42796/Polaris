# Polaris

A Claude Code plugin carrying a working protocol: state the work as a contract before
starting, report it with evidence when finished, and write both rules into a project so
every session inherits them.

## Skills

| Skill | When it fires | What it does |
| --- | --- | --- |
| `/polaris:five-rules` | A discussion starts, or a new requirement arrives mid-task | Posts a five-rule contract — What / Why / How / Prohibited / Done as Gherkin — and waits for confirmation |
| `/polaris:recap` | Work finishes | Posts a closing report covering the whole task from the message that first raised it: the original ask and its reasons, the contract verbatim, evidence and decisions along the way, what was done, what exists now, acceptance, and what was left out |
| `/polaris:init-project` | Setting a project up | Interviews you about the project's hard limits, then writes them into `AGENTS.md` and `CLAUDE.md` |
| `/polaris:plain-answer` | Every reply | Carries what you read and what you inferred into the reply itself, in plain words — and turns 「你決定」 into options with costs and a recommendation |
| `/polaris:no-bare-codes` | Every reply | Gives every code in a reply — P7, D1, option A/B — its meaning right beside it at first use, so the reader never has to decode one |

## Design

- [`docs/spec.md`](docs/spec.md) — the design and the reasoning behind it.
- [`docs/plan.md`](docs/plan.md) — the record of how v0.1 was built.

## Install

```
/plugin marketplace add ghit42796/Polaris
/plugin install polaris@polaris
```

`polaris@polaris` is plugin-name@marketplace-name. Both are `polaris`; it is not a typo.

To work on the plugin itself, point the marketplace at your own clone instead — the path
is wherever you cloned it:

```
/plugin marketplace add /path/to/your/Polaris
/plugin install polaris@polaris
```

Editing a skill afterwards needs a reload before the change takes effect.

## Hooks

`hooks/hooks.json` registers one `UserPromptSubmit` hook: every prompt you send,
`hooks/inject-skills.js` reads every skill in its `SKILLS` list — `plain-answer` and
`no-bare-codes` — and injects them into context. The skills that govern every reply are the
ones a model cannot be trusted to remember to load, so they are not left to memory.

The script reads the skills from disk rather than embedding copies, costs roughly 1.5k
tokens per turn, and skips any skill it cannot read — it must never block a prompt.
Hooks are Claude Code only; under any other harness the rule falls back to the
`## Answering` section in `AGENTS.md`.

## Development

```
powershell -NoProfile -File scripts\check-skills.ps1
```

Validates every `skills/*/SKILL.md`. Exit code 0 means all valid.

## Status

v0.2.0. The first piece of the enforcement layer has landed — the `UserPromptSubmit` hook
above. The rest — a `Stop` hook for `recap`, a `PreToolUse` hook plus `vibe-diff` for
critical actions, `.claude/settings.json` `permissions.deny` generation from the
never-touch list, and `spec-to-html` — is still pending, gated behind verifying what
Claude Code hooks can actually do.
