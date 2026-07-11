# HANDOVER — state of the repo as of 11 July 2026 (spine sessions done)

Everything through **spine session 2 (the dealer)** is committed and
pushed. Four working sessions happened on 11 July:

1. **Choice-integrity pass** — the hat became a real two-option choice
   ("Wear it" / "Leave it on the bramble"), vista's silent morale moved
   onto the fork tap, and the first content validator landed (effects
   only live on options).
2. **World-texture content + engine features** — 13 new choices + 21
   payoff beats (46 nodes total), the single advance funnel
   (`advanceTo`), weighted `next` (rolled at tap, reload-safe), flags
   (cross-trail, write-only), per-node `gapM`, and a validator suite.
3. **Spine session 1 (plumbing)** — content-load stage, 20-segment
   manifest in content.json, all terminal pointers → `"@exit"`,
   spine.js with a fixed-order stub. Game played identically.
4. **Spine session 2 (the dealer)** — SEGMENT-TABLE rules 1–7 live:
   every hike is now a shuffled deal (opener → fork at 2–3 → dealt
   middle to targetDeals 8–14 → gate ending), with weather timers,
   virtual-setting gate, recency, heavy-adjacency, and a deck-
   exhaustion ladder. sunset/stars are HELD OUT until time-of-day.

## Read these before working

**ENGINE-STATE.md is the reality doc** — read it first, it's current
(11 Jul, post-dealer) and wins over the design docs. CONTENT-INVENTORY
(46 nodes, 20 segments, dealer flow), SEGMENT-TABLE v1.1 (the dealer's
tag/spec authority), NOTES.md (parked backlog).

## Verified vs not

- Everything above is machine-verified: seeded 60-hike dealer suites +
  headless browser playthroughs (weighted persistence, reload paths,
  gap discipline, rule compliance). Two dealer bugs were caught and
  fixed by those tests before they ever ran on a device.
- **NOTHING since the Session 8 push has been verified on a real
  phone.** The backlog: Session 9's lingers/day-night/biome fades and
  iPhone audio fix, the hat choice, the 13 world-texture stops, and —
  the big one — whether two consecutive dealt hikes FEEL different
  (session 2's success criterion) and whether the dealt rhythm stays
  calm. PWA caveat: fully close and reopen to skip the cached build.
  `?fast` compresses gaps; `?fast&deal=seg_dog` forces specific
  segments for testing.

## Known intentional oddities (not bugs)

- **A standing validator warning fires on every load**: "dealable deck
  has only 7 repeatable segments — below max targetDeals (14)". It's
  the authoring signal to write more every_hike_ok segments.
- Declined hats never return (roll spent — anti-reload-fishing).
- Flags are write-only; five exist, payoffs parked.
- Tone.js logs a start-time complaint under superhuman tap speed
  (automated tests only).

## NEXT TASKS (in order)

1. **Phone-verify the whole backlog above** — especially two
   back-to-back hikes for variety + calm.
2. **The ART PASS chapter is open** — work ART-QUEUE.md strictly top
   to bottom, starting at GATE 0 (Pixel Lab MCP smoke test), then
   GATE 1 (the hiker / style lock, against ART-BIBLE.md). Engine and
   content parks wait in NOTES.md; the setting→scenery park gets
   pulled forward by ART-QUEUE's A1 decision at the latest by
   Section D.
3. Music remains the parallel track (Jimmy composes stems → Tone.js
   replaces the placeholder synths).

## Open items

- iPhone audio fix still untested on the phone (deployed since S9).
- Stray repo `caniplantit42/wandern-gehen` still awaiting manual
  deletion in the browser. Never touch that account.
- Pixel Lab art pass still parked until the game is proven fun.
- Save compatibility: all of today's fields (flags, spine) ride
  reader-side defaults — old saves load fine; SAVE_VERSION is still 1.
