#!/usr/bin/env node
//
// inject-plain-answer.js -- UserPromptSubmit hook (cross-platform).
//
// Injects the full plain-answer skill into context on every user prompt, so the
// rule holds for the whole session instead of only where a model remembers it.
//
// Reads the skill from disk rather than embedding it: one copy, no drift.
//
// Output: JSON with hookSpecificOutput on stdout.
// Exit code: always 0. This hook must never block a prompt.

"use strict";

const fs = require("fs");
const path = require("path");

function emit(ctx) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: ctx,
      },
    })
  );
}

function stripFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0].trim() !== "---") return text;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") return lines.slice(i + 1).join("\n");
  }
  return text;
}

try {
  // Drain the hook payload so the caller never sees a broken pipe. Unused:
  // this skill is injected unconditionally, so the prompt text is irrelevant.
  if (!process.stdin.isTTY) {
    try {
      fs.readFileSync(0, "utf8");
    } catch {
      /* no payload is fine */
    }
  }

  const root = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, "..");
  const skill = path.join(root, "skills", "plain-answer", "SKILL.md");
  const body = stripFrontmatter(fs.readFileSync(skill, "utf8")).trim();

  emit(
    body
      ? `<system-reminder>
<polaris-plain-answer>
The full plain-answer skill follows. It governs the reply you are about to write, and
every reply after it. It is injected on every turn precisely because the replies that
skip it are the ones that felt too small to need it.

${body}
</polaris-plain-answer>
</system-reminder>`
      : ""
  );
} catch {
  // Skill unreadable, moved, or renamed. Inject nothing; never block the prompt.
  emit("");
}

process.exit(0);
