# v0.1.2 announcement — ready to post

Written for the published `v0.1.2` release. Copy the block you need; nothing here has been posted.

**House rule:** every number below is checkable in the repo, and the images are labelled for what
they are. If you cut for length, cut a number before you cut the provenance line — an unsourced
claim in a post is the same defect as an unsourced claim in the skill.

Images: [`comparison-desktop.png`](../../assets/marketing/comparison-desktop.png) (1600×900, link
preview / wide feed) and [`comparison-phone.png`](../../assets/marketing/comparison-phone.png)
(1080×1350, portrait feed).

---

## The long version — LinkedIn / blog / dev.to

I rebuilt the same dashboard twice. Identical routes. Identical copy. Identical API calls.

The only thing that changed was conviction.

Here's the problem I kept hitting with AI-built UIs. They work. They pass. And then you show
someone and they say "is this a prototype?" — because it looks like every other Tailwind
dashboard: four flat stat boxes, a blue link color, 315px of the fold doing absolutely nothing.

The model didn't fail. Nothing in the loop ever asked it to have a point of view.

So I built **Glowup UI** — a skill for coding agents (Claude Code, Codex, and anything that reads
`SKILL.md`) that gives a UI an actual design direction *without touching how it works*.

**What makes it different from "make this pretty":**

**It preserves, and it proves it.** Before a redesign it snapshots the starting state — routes,
copy, handlers, data. After, it re-checks. Move a handler between files and it no longer shrugs:
it reports `moved (review)` with both paths. That check exists because the old one passed
silently while the wiring had moved.

**It refuses to lie about contrast.** This is the one I'm least proud of. The palette generator
never compared a filled button against the page it sits on. A white brand color produced a
`#ffffff` button on a `#ffffff` surface — **1.00:1** — and the report still printed *"19/19 pairs
pass."* Fixed: that pair is scored now, and a bright yellow seed that gives a 1.43:1 button is
reported as a failure instead of quietly passing.

**It audits accessibility for real.** `--a11y` runs 18 DOM rules — alt text, control and field
names, ARIA roles, `aria-hidden` containing focusable content, heading order, landmarks,
keyboard-reachable scroll regions, 24px targets, missing focus styling. Critical and serious
findings become **blockers**: a redesign cannot be reported complete while an unlabelled
control is still there.

**It tells you what it can't do.** The audit is DOM-only. No screen reader, no keyboard traps,
no contrast over imagery. The skill says so in its own output rather than implying a
certification.

**The engineering underneath**

- 189 tests, zero failing
- 10/10 CI jobs on Linux, macOS **and Windows** — the Windows job was red for a while because two tests
  used `chmod 000` and asserted `EACCES`, which Windows cannot produce. That's fixed.
- A scaffolded project is installed, built with Vite, and passes its own tests before release
- `npm pack` payload hash-compared against the tagged source, then installed from the tag and removed

**What I am not claiming**

The before/after images are an illustrative render of a controlled fixture — not a measured
design-quality win, and not a model A/B benchmark. Native agent activation is still unverified in
the repo's own evidence. I'd rather ship that sentence than a chart nobody can check.

MIT. No npm package. No paid service.

`npx --yes --package=git+https://github.com/avivgerz-hue/glowup-ui.git#v0.1.2 glowup-ui install --agent codex --scope project`

→ https://github.com/avivgerz-hue/glowup-ui

If you try it on a page and it comes out worse, I genuinely want to see it.

---

## The short version — X / Twitter

> AI-built UIs all look the same because nothing in the loop asks for a point of view.
>
> Glowup UI is a skill for coding agents that gives a UI a real design direction — while proving
> routes, copy and behaviour survived.
>
> Same app. Same data. Twice the conviction.
> https://github.com/avivgerz-hue/glowup-ui

Follow-up post for the thread (the honest one — this is the one that earns trust):

> The best bug I found was in my own tool.
>
> The palette generator never compared a button to the page behind it. White brand color →
> 1.00:1 button on a white card. The report still said "19/19 pairs pass."
>
> It doesn't say that any more. 18 a11y rules now block a redesign instead.
> https://github.com/avivgerz-hue/glowup-ui

---

## Hacker News — Show HN

Title: **Show HN: A design skill for coding agents that checks what it preserved**

URL: https://github.com/avivgerz-hue/glowup-ui

Author comment:

> I built this because "redesign my app" and "redesign my app without breaking it" are very
> different requests, and agents are much better at the first one.
>
> Glowup UI is an MIT skill (a `SKILL.md` plus Node helpers) for Claude Code, Codex and other
> Agent Skills hosts. CREATE, TRANSFORM and REFINE workflows, with checkpointing and re-checks
> so a redesign reports what changed rather than assuming nothing did.
>
> The interesting part is the failure modes it was built to catch. Two examples from this release:
> preservation checking used to compare aggregate counts, so moving a handler between files passed
> silently — it now reports the relocation. And the palette contrast checker never compared a filled
> action against its own surface, so a white seed produced a 1.00:1 button while the report claimed
> every pair passed. Both are fixed and both have regression tests.
>
> Honest scope: the before/after images are a rendered illustration of a controlled fixture edit,
> not a measured design-quality win. Native activation is unverified in the repo's evidence.
> 189 tests, CI green on Linux/macOS/Windows.
>
> Feedback I'd find most useful: pages where the transformation was superficial, or where something
> broke anyway.

---

## Reddit — r/webdev or r/ClaudeAI

Title: **I built an agent skill for redesigning existing apps — it fails loudly when it breaks your wiring**

> Spent a lot of this release on the boring half of "make my UI better": proving nothing broke.
>
> Glowup UI is an MIT skill for coding agents. The parts I'd actually defend:
>
> - Checkpoint/re-check on routes, copy, handlers and data. Relocations are reported, not smoothed over.
> - 18 DOM accessibility rules, where critical/serious findings block a "done".
> - It states its own scope: DOM-only, no screen reader, no contrast over imagery.
>
> The release notes also list the bugs found in the tool itself, including a contrast check that
> claimed every pair passed while a button sat at 1.00:1 on its own card.
>
> Images are an illustrative render of a controlled fixture, not a benchmark. Happy to answer
> specifics about the preservation approach. → https://github.com/avivgerz-hue/glowup-ui

---

## Notes for the owner before posting

- **Replace the images if you want real captures.** `assets/marketing/` is a render; `assets/examples/`
  holds the Chromium captures. Use the real ones and delete the provenance line — but only if you
  regenerate them, since the current examples predate the v0.1.2 fixes.
- **Check each venue's current rules.** These drafts were written without fetching them; the growth
  plan already notes Reddit and HN guidance were unreachable from this environment.
- **Don't post the same text across subreddits.**
- **The "189 tests" and "18 rules" figures are current at v0.1.2.** `tests/marketing-boards.test.mjs`
  fails the build if prose and the rule engine disagree, so re-run the suite before editing either number.
