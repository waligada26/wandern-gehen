# NOTES — ideas parked for later (not the current session)

## ═══ CHAPTER MARKER — 11 July 2026 ═══

**State of the game:** the procedural spine is DONE and machine-verified
— every hike is a shuffled deal (opener → fork at 2–3 → dealt middle,
targetDeals 8–14 → gate ending) under SEGMENT-TABLE's rules 1–7, over
46 nodes / 20 segments with weighted rares, flags, and weather timers.
Everything runs on placeholder art. Saves are compatible throughout
(SAVE_VERSION still 1). Nothing since the Session 8 push is
phone-verified — that backlog lives in HANDOVER.md.

**The next chapter is the ART PASS**, worked strictly from ART-QUEUE.md
starting at **GATE 0** (Pixel Lab MCP smoke test), then GATE 1 (the
hiker / style lock, against ART-BIBLE.md).

**Expect at load, always:** exactly one validator warning — "dealable
deck has only 7 repeatable segments" — the authoring signal, not a bug.

## ENGINE PARKS

- **Time-of-day read side** — the small session that brings seg_sunset
  and seg_stars back: expose the day-wash phase, gate their sky needs,
  fill stars' reserved closing slot (TODO comment in spine.js
  pickDeal). Also the home of the golden-hour blend fix: the wash is
  alpha-blend (no additive glow); a warm brightening needs
  screen/overlay (ART-BIBLE §7 NOTE).
- **Virtual setting drives scenery** — the locked end-state: the
  spine's setting replaces the meter-based biome palette cycle as the
  one authority on where you are. **A1 decision resolved (b), 11 Jul:
  per-setting painted sets; the multiply-tint is retired** (no-op
  `updateBiomeTint` carries the TODO(parked → Section D)). With the ¾
  recomposition, "a setting's set" = sky + far layer + horizon layer
  + ground-plane tile + planted-prop table — swap/crossfade THAT
  bundle on the spine's setting. Pulls forward at Section D.
- **TODO(parked) comments in code after the art chapter's day 1**:
  `Game.js updateBiomeTint` (setting→scenery, above) and the
  pre-existing `spine.js pickDeal` (seg_stars' reserved closing slot,
  time-of-day park). That is the complete list.
- **Creature journal biome tag** — meetCreature reads the upcoming
  node's `biome`; move to the spine's virtual setting when it becomes
  the authority.
- **Flags read side** — conditional prompts and flag requires; all
  five flags (hung_glove, trusted_sign, found_coin, restacked_cairn,
  signed_bothy) are write-only until this lands.
- **Per-exit successors** — revisit trigger unchanged (SEGMENT-TABLE
  REWIRING NOTES): build when a segment's point is divergent futures.
- **gapM feel** — payoff beats land ~10 s after their tap (7 s walk +
  ~3 s scroll-in). Drop gapM to ~1–3 for snappier; ~3 s is the floor.
- **Per-biome lazy loading** — deferred until real layer PNGs exist;
  load first setting + Wanda up front, stream the rest mid-walk
  (Phaser's loader runs mid-scene; the service worker caches after
  first fetch).

## CONTENT PARKS

- **More every_hike_ok segments** — THE authoring backlog: 7
  repeatable deck segments vs max targetDeals 14 (the standing
  warning). Long hikes lean on repeats until this pool grows.
- **Flag payoffs** (need the flags read side first): the glove gone
  from the fencepost on a later hike; stepping around the toppled
  cairn flavors a later junction; the bothy guestbook visibly filling
  across hikes (count, not boolean).
- **Session 6 rarity pass** — weighted-next placeholder numbers
  (feather 10%, echo 5%, rainbow 15%, fish 10%), the trail-cycling
  rare farm (once_per_hike resets each trail), and hat odds all tune
  together. hollow_rare's banded feather wants a journal home.
- **stars_clear_01** — future home of the shooting-star rare roll
  (returns with time-of-day).
- **painted_sign_01 A** — a real detour segment once per-exit
  successors exist.

## ART PARKS

The queue itself is ART-QUEUE.md (order authority); these are the
parked *ideas* it drew from, kept for context:

- Reactive poses for Wanda (drinking, picking-up, sitting,
  breathing-idle) → ART-QUEUE Section G, wiring = a `pose` field.
- Making branches visible (fork set-piece; scenery change is the
  important half → the setting→scenery engine park above).
- Ambience sprites that today are prose only: butterfly, fish, ripple
  rings, tumbling crisp packet, dog follower, distant ridge shape →
  all queued with † wiring flags in ART-QUEUE.

## POLISH, WHENEVER

- HUD value pulse when a stat changes (canteen fills → water number
  blinks) → also ART-QUEUE G.
- Stream stop: splash one-shot (Session 7 audio list).
- Tone.js logs a start-time complaint under superhuman automated
  tapping — cosmetic, tests only.
