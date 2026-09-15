---
name: recap
description: Use when the work of a task is complete - closes it out with a structured report covering the original ask, what was done, the evidence found along the way, and acceptance against the agreed criteria. Fires automatically on completion; it is not something to wait to be asked for.
---

# Recap

Close every completed task with a report that someone who was not in the room can act
on, instead of re-reading the whole conversation.

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
| A pure question answered under the short form | No — nothing was written and no work was done |
| Work blocked partway | Yes. Mark section 5 ❌ and say in section 6 exactly where it stopped |

## What One Report Covers

One task, from the first message that raised it to now. The contract is a checkpoint
inside that span, not its start: the ask and its reasons were said before the contract
was posted, and so was the design discussion.

- **Start** — the first message that raised this task, or the previous 結案報告,
  whichever is later.
- **End** — now.
- **Inside** — everything in between that served this task: the discussion before the
  contract, every contract revision, every wave of execution, every review, every fix.
  Replanned twice and reviewed three times is still one task and one report.
- **If earlier turns survive only as a context summary**, say so in section 0 and report
  what the summary retains. Do not present a summary as if it were the transcript.

## The Block

Emit it in the language of the conversation. Every section is present. A section with
nothing to report holds the word 「無」; it is never omitted.

```markdown
## 結案報告

**0. 範圍** — 從 <起點：哪一則訊息，或上一份結案報告> 到現在。<n> 版契約、<n> 波執行、<n> 次 review。

**1. 你要的**
- **起點** — <第一次提出時的原話（引用）與當時給的理由，附回合>
- **契約** — <契約第 1 條逐字；每一版各列一次>
- **中途加的** — <每一次追加或改動：原話、回合、進了哪一版契約；無則「無」>

**2. 過程：證據與討論** — 依時間順序，每一項三段：
- 看到什麼 — <檔案:行／指令與輸出原文>
- 它推翻或確認了什麼 — <哪個假設、計畫的哪一步>
- 討論與決定 — <選項、選了哪個、誰決定：「你決定」或「我裁的」＋理由＋錯了的代價>

**3. 做了什麼** — <對照契約第 3 條逐步；偏離標記＋原因；subagent 的結果併在這裡>

**4. 現在的狀態** — <寫給沒看過對話的人：現在存在什麼（檔案、函式、旗標、設定、測試）、怎麼用、怎麼驗。每個名詞第一次出現附半句：在哪、做什麼>

**5. 驗收** — <每個 rule-5 Scenario，✅/❌，附可查證的原文證據>

**6. 沒做 / 待辦** — <範圍外、卡住、刻意跳過、我裁了但你尚未定案的>
```

## What Each Section Is

**Section 0 is one line.** It tells the reader how much ground the report covers before
they start reading it.

**Section 1 has three slots.** The contract's rule 1 is copied verbatim, never
re-described: re-describing lets you back-derive "what they wanted" from "what you
built", and the two silently align. But rule 1 carries neither the reason nor anything
they added after it was posted, so the other two slots exist — the words they first
used, with the reason they gave, and every change they made along the way. If there was
no contract, the 契約 slot quotes their own words instead.

**Section 2 is a sequence of three-part entries**, one per finding that changed
something: an assumption disproved, a plan step rewritten, a choice made between
options. Each entry carries the raw evidence (file and line, the command and its
output), what it changed, and the decision it led to, with who made it. A decision you
made yourself carries its reason and the cost if it turns out wrong. This is the section
with the longest shelf life: a conclusion without its evidence cannot be revised later,
only re-argued.

**Section 3 marks deviations.** If the approach changed, say what changed and why. A
report that reads as though the plan was followed, when it was not, is worse than no
report.

**Section 4 is written for someone who has not read the conversation.** It describes
what exists now, not what was done: where each piece lives, what it is for, how to
invoke it, how to check it. A file, a function, a flag, an internal name is jargon to
that reader; the first time each appears it gets half a sentence of location and
purpose.

**Section 5 pastes raw output on failure.** ❌ means ❌, with the real error text. Never
"should be fine", never "mostly working". If a check was not run, say it was not run —
do not imply a pass. Section 5 works without a contract: if there were no rule-5
Scenarios, state the criteria you actually held the work to — the commands you ran, the
files you checked — one line each, ✅/❌, with evidence.

**Section 6 repeats your unratified rulings.** Anything you decided that they have not
confirmed appears here as well as in section 2, so they can find it without reading the
whole report.

## Length

A report is long because the task was long, never because items were padded — and short
because the items were few, never because items were shortened. A section 2 entry keeps
all three parts. A section 4 item keeps its location and purpose. What gets cut is
narration of your own tool calls, restatement of their question, and apology. Evidence
stays.

## Subagents

A subagent's result comes back to the main agent and is folded into the single final
report. Subagents do not each emit their own.

## Red Flags

| Thought | Reality |
|---|---|
| "They watched me do it, they know" | They read the last message, not the whole turn |
| "I'll summarise what I built" | Section 1 is what they asked for, copied, not what you built |
| "The brainstorm was before the contract, so it's out of scope" | The contract is a checkpoint. The task started when they first raised it |
| "That wave was done by another skill / a subagent, not me" | One task, one report. Whatever drove a wave, its results are in scope |
| "The report is already too long" | Then cut narration, not entries. Length follows the task |
| "The deviation was minor" | Mark it. Minor is their call, not yours |
| "Tests mostly pass" | Then some fail. Paste the failure |
| "Nothing interesting came up" | Then section 2 holds the word 無, in one line |
| "They know what that file is" | The reader of section 4 does not. Half a sentence |
