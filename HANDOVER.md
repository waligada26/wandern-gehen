# HANDOVER — state of the repo as of 11 July 2026, late (art chapter, day 1)

The art chapter opened and moved fast today. Where things stand:

- **GATE 0 [x]** — Pixel Lab MCP pipeline verified end-to-end
  (generation → PNG in `public/assets/` → rendered in Phaser, seen on
  screen).
- **GATE 1 [x]** — **Wanda is locked**: candidate C ("high contrast"),
  chosen from four rendering directions, walking in the deployed
  build. Reference image: `art-reference/wanda-reference.png`; her
  Pixel Lab character id lives in `art-reference/README.md` (future
  poses animate THAT character, never a fresh generation). ART-BIBLE
  §2 ramps are finalized from her extracted cluster centers.
- **Section A: Stage M (¾-view composition mock) at ~80% approval.**
  Mid-section, the scene was RECOMPOSED from side-on bands to a
  shallow ¾ view — sky / far hills / horizon treeline / one ground
  plane with a worn trail at Wanda's row and planted, row-depth-sorted
  props (ENGINE-STATE §8b is the definitive description). The mock
  spent ZERO generations (mock-before-generate is now the standing
  pattern). **Stage N (real art against the approved mock) has NOT
  started** — the ground plane is code-painted and the trees are
  recovered placeholders.

## Read these before working

**ENGINE-STATE.md first** (current as of tonight — §8b for the ¾
scene, §8 for the tint/wash reality, §1 for the new service-worker
strategy). Then ART-QUEUE.md (Section A respec'd for ¾; LEARNINGS
carries every scar D/E/F inherit) and ART-BIBLE.md (§8 + §3 carry the
¾ amendments; §2 ramps are Wanda-locked).

## NEXT TASKS (in order)

1. **Jimmy's phone notes on the remaining ~20%** of the Stage M
   composition → possibly one more zero-generation Stage M iteration.
2. **Stage N**: generate real art against the approved mock — the
   ground-plane tile (the headline), 2–3 hero tree variants, distant
   trees, regenerate far hills only if they read stretched. Then the
   usual lock: ART-QUEUE statuses, LEARNINGS, ENGINE-STATE touch-ups.
3. **Section B** (the every-hike cast, signpost first) on Jimmy's
   word.

Music remains the parallel track (Jimmy composes stems → Tone.js
replaces the placeholder synths).

## Credits

**1,671 of 2,000 monthly generations remaining** (Tier 1). The art
chapter has spent **24 total**: GATE 0 = 1, GATE 1 = 9, Section A = 14
(stage 1 + two iterations; Stage M spent zero).

## Bugs found & fixed today (by the screenshot pipeline)

- **Day-wash never rendered** since Session 9 (rectangle at object
  alpha 0). Fixed; golden hour and dusk actually tint now.
- **Service worker pinned un-hashed assets forever** (cache-first +
  verbatim `public/` filenames) — phones kept the placeholder Wanda
  while fetching new-name woodland files. Rewritten: SWR for un-hashed
  assets, cache-first only for Vite-hashed bundles, cache bumped to
  v2. Verified with cold-launch tests; deploys now reach the phone one
  launch later.

## Standing notes (still true)

- **The validator warning fires on every load** ("dealable deck has
  only 7 repeatable segments") — authoring signal, not a bug.
- Playwright is a devDependency now — the in-game screenshot pipeline
  (dev server + `__wg` handles) verifies every art change; keep using
  it before deploys.
- The dealer feel-test (two back-to-back hikes: different + calm)
  remains informally open — today's phone walks were composition
  checks, not a full feel pass.
- Stray repo `caniplantit42/wandern-gehen` still awaits manual
  deletion in the browser. Never touch that account.
- Save compatibility: SAVE_VERSION still 1; planted props are
  deliberately NOT persisted (decorative; a reload replants).
- `?fast` compresses gaps 10×; `?fast&deal=seg_x` forces segments.
