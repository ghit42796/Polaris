#!/usr/bin/env node
//
// inject-skills.js -- UserPromptSubmit hook (cross-platform).
//
// Injects the full text of every skill in SKILLS into context on every user
// prompt, so those rules hold for the whole session instead of only where a
// model remembers them. For every skill in TRIGGERS it injects only the
// frontmatter description: one line saying when to load it.
//
// Reads each skill from disk rather than embedding it: one copy, no drift.
//
// Output: JSON with hookSpecificOutput on stdout.
// Exit code: always 0. This hook must never block a prompt.

"use strict";

const fs = require("fs");
const path = require("path");

// Skills that govern every reply. Each is injected as <polaris-NAME>...</polaris-NAME>.
const SKILLS = ["plain-answer", "no-bare-codes"];

// Skills that fire once per task, not on every reply. Paying for their full text
// on every turn buys nothing; the moment to load them is what gets forgotten.
const TRIGGERS = ["adversarial-review"];

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

function block(root, name) {
  try {
    const skill = path.join(root, "skills", name, "SKILL.md");
    const body = stripFrontmatter(fs.readFileSync(skill, "utf8")).trim();
    return body ? `<polaris-${name}>\n${body}\n</polaris-${name}>` : "";
  } catch {
    // Skill unreadable, moved, or renamed. Skip it; the others still go in.
    return "";
  }
}

function trigger(root, name) {
  try {
    const skill = path.join(root, "skills", name, "SKILL.md");
    const lines = fs.readFileSync(skill, "utf8").split(/\r?\n/);
    if (lines[0].trim() !== "---") return "";
    for (let i = 1; i < lines.length && lines[i].trim() !== "---"; i++) {
      const m = lines[i].match(/^description:\s*(.+)$/);
      if (m) return `- /polaris:${name} — ${m[1].trim()}`;
    }
    return "";
  } catch {
    // Same as block(): a missing skill is skipped, never fatal.
    return "";
  }
}

try {
  // Drain the hook payload so the caller never sees a broken pipe. Unused:
  // these skills are injected unconditionally, so the prompt text is irrelevant.
  if (!process.stdin.isTTY) {
    try {
      fs.readFileSync(0, "utf8");
    } catch {
      /* no payload is fine */
    }
  }

  const root = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, "..");
  const blocks = SKILLS.map((name) => block(root, name)).filter(Boolean);
  const triggers = TRIGGERS.map((name) => trigger(root, name)).filter(Boolean);

  const parts = [];
  if (blocks.length) {
    parts.push(`The full skills below govern the reply you are about to write, and every reply after
it. They are injected on every turn precisely because the replies that skip them are
the ones that felt too small to need them.

${blocks.join("\n\n")}`);
  }
  if (triggers.length) {
    parts.push(`<polaris-triggers>
Load each skill below with the Skill tool the moment its condition holds. Nobody will
ask for it; the condition is the request.

${triggers.join("\n")}
</polaris-triggers>`);
  }

  emit(parts.length ? `<system-reminder>\n${parts.join("\n\n")}\n</system-reminder>` : "");
} catch {
  // Never block the prompt.
  emit("");
}

process.exit(0);
