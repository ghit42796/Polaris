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
| `/polaris:owner-review` | A plan, contract, or option list is about to be shown; work is about to be reported done | Reads the draft as the person who answers for the result: fixes and reverts what it can, decides what the evidence settles, and brings only the questions only you can answer |
| `/polaris:adversarial-review` | Work finishes, before the closing report | Has fresh subagents try to break the work, each with one assignment, and a separate judge rule on every attack, so "done" is never the author grading their own work. Costs six subagents per finished task; skipped only for a pure question, or when you say so |

## Design

- **A plugin, not project skills.** Skills in a repo's `.claude/skills/` are visible only
  inside that repo, and `init-project` exists to work on other projects. A user-level
  plugin installs once, works everywhere, and gets a namespace (`/polaris:…`) and a version.
- **`AGENTS.md` holds the content; `CLAUDE.md` holds `@AGENTS.md`.** Two files with
  overlapping content drift. Here and in every project `init-project` sets up.
- **The file-format rule is always-loaded text, not a skill.** A skill applies only when
  the model loads it; `AGENTS.md` applies every session. So the rule is a section
  `init-project` writes.
- **`recap` is separate from `five-rules`.** One description covering both the start and
  the end of a task blurs both triggers, and the end is the one that gets missed.
- **Other plugins are never edited.** Their skills live in the plugin cache and are
  overwritten on update. `recap` instead covers any completed task, whatever drove it.
- **`init-project` never moves existing content**, which keeps it safe to re-run.
  Migrating an old `CLAUDE.md` into `AGENTS.md` is a deliberate manual step.
- **Skill bodies are in English**, because the model reads them. What a skill says to
  the user follows the language of the conversation.

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

Skills in its `TRIGGERS` list — `adversarial-review` — fire once per task, not on every
reply, so only their frontmatter `description` goes in: one line saying when to load the
skill, about 120 tokens, instead of its full text.

The script reads the skills from disk rather than embedding copies, costs roughly 1.6k
tokens per turn, and skips any skill it cannot read — it must never block a prompt.
Hooks are Claude Code only; under any other harness the rule falls back to the
`## Answering` section in `AGENTS.md`.

## Development

```
powershell -NoProfile -File scripts\check-skills.ps1
```

Validates every `skills/*/SKILL.md`. Exit code 0 means all valid.
