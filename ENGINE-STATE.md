# ENGINE-STATE — what the code actually does

A living reality document. The design docs (GAME-DESIGN.md etc.) describe
**intent**; this file describes the **code as it is**. Where they disagree,
this file wins. Re-read at the start of a session; update at the end of any
session that changes engine behavior, schema, save format, or validation.

Last verified against the code: 11 July 2026, spine build session 1 of 2
(content-load stage, segments manifest, @exit sentinel, spine.js with a
FIXED-ORDER dealer stub). The game plays the historical trunk; shuffling
is session 2. Line numbers drift — trust the named function over the
number.

## 1. MODULE MAP

| File | Owns |
|---|---|
| `src/main.js` | DOM boot, service-worker registration (skipped on dev server) |
| `src/game/main.js` | Phaser config: 360×640 portrait, `pixelArt: true`, FIT scaling, scene order `[Camp, Game]` |
| `src/game/scenes/Camp.js` | The campfire scene. Runs first; no save → hands straight to Game |
| `src/game/scenes/Game.js` | World, distance clock, stops, cards, lingers, rare encounters, journal UI, day/night wash, biome tints, placeholder painters |
| `src/game/content.json` | The content data: `start`, `creatures`, `nodes`, **`segments`** |
| `src/game/content-load.js` | **The load stage**: imports content.json, validates once, exports it. Game/Camp import from HERE, never the raw JSON |
| `src/game/content-validate.js` | All content + segment guardrails (§7) |
| `src/game/spine.js` | The spine: segment lookup, dealing, per-hike history, world-state timers. **Session 1: fixed-order stub** reproducing the historical trunk. Pure module, Node-testable |
| `src/game/save.js` | One localStorage save slot, versioned |
| `src/game/photos.js` | Polaroids in IndexedDB, Web Share / download fallback |
| `src/game/audio.js` | Tone.js: synthesized stems, shimmer, one-shots, footsteps, mute |

## 2. CONTENT SCHEMA (AS IMPLEMENTED)

Top level: `start`, `creatures`, `nodes`, `segments`.

**Nodes** (choice/beat/ending) as before — `trigger` decorative, `biome`
journal-tag only, landmark falls back to signpost, beats can't carry
effects, beat/ending button labels hardcoded — with one addition:

- **`next` may be the sentinel `"@exit"`** (exported as `EXIT` from
  spine.js): "this segment is done — the spine deals what follows."
  Legal as a plain next or as an id inside a weighted array
  (coin_stream's decline: `[{id:"@exit",weight:90},{id:"fish_look_beat",weight:10}]`).
  Internal pointers stay literal node ids and must stay inside the
  segment (validated). 42 `@exit` pointers exist.

**Segments** (`content.segments`, 20 entries — SEGMENT-TABLE.md v1.1):

```json
"seg_rain": {
  "entry": "rain_shower_01",
  "members": ["rain_shower_01", "pine_shelter_beat", ...],
  "weight": "light",                      // light|medium|heavy
  "needs": { "setting": "any", "sky": ["clear"] },
  "sets": { "state": "wet", "stops": 3 },  // optional
  "frequency": "every_hike_ok",           // |once_per_hike|rare
  "skeleton": "opening",                  // optional: opening|closing|ending
  "heldOut": true                          // optional (sunset, stars)
}
```

`needs`/`sets`/`weight`/`frequency`/`heldOut` are **data only this
session** — the fixed-order dealer ignores them; session 2's dealer
consumes them.

## 3. RESOLUTION FLOW

`resolveStop(effects, next, flags)` → applyEffects → applyFlags →
dismissCard → resumeWalk → **`advanceTo(next)`** — still the single
funnel (endLinger and startNewTrail route through it). advanceTo now:

1. `spine.onStopResolved()` — one resolved stop = one tick of the
   wet/misty stop-counted timers (nothing sets them yet). Interrupts
   (hat, fox) bypass advanceTo and correctly don't tick.
2. `pickNext(next)` — weighted arrays roll here, at resolve time.
3. **If the rolled id is `"@exit"`**: replaced with
   `spine.nextEntry(spine.segmentOf(currentId))` — the deal. Happens
   AFTER the roll (exits can live inside weighted arrays) and BEFORE
   assignment — **`currentId` never holds the sentinel** (verified).
4. `currentId = id` → `rollNextLandmark()` → `saveNow()` — the deal
   persists atomically with the resolution.

- **Dealer (session 1)**: FIXED_ORDER in spine.js — the historical
  trunk. Two accepted micro-changes from the v1 single-successor
  collapse: everyone now walks BOTH cairn_topple and whistle (pond's
  divergence), and painted_sign (was high-ridge-only) is dealt to
  everyone. Trail: 20 segments, 26–38 stops.
- **Spacing**: rule 7 falls out of existing code — internal follow-up
  beats carry `gapM: 10` (fast arrival); segment entries carry no gapM
  → boundaries get the normal 30–90 s roll (÷10 under `?fast`; gapM is
  never scaled). Validator warns if an entry carries gapM.
- A typo'd literal next still crashes at the next spawn if the
  console warning is ignored — but the validator now catches every
  dangling pointer, cross-segment pointer, and exit problem at load.
- Still not possible: conditional (non-random) branching; content
  reading flags or time-of-day.

## 4. SAVE & PERSISTENCE

Save object: `{ v:1, distanceM, state, currentId, nextLandmarkAtM,
journal, hatRemainingM, flags, spine }`.

- **`spine`** (added 11 Jul 2026, session 1 — no version bump, reader
  defaults): `{ history: [segIds], world: { wet, misty }, setting,
  targetDeals }`. `history` is the full per-hike deal order (used-list +
  recency + count all derive from it); `targetDeals` is a reserved slot
  (null until session 2) so the save shape won't change again.
- **Current segment is never stored** — derived from `currentId` via the
  manifest (`spine.segmentOf`), so `__wg.currentId` teleports self-heal
  (verified).
- **Pre-spine saves** load fine: no `spine` key → history seeds from
  `currentId`'s segment alone (verified). Cosmetic consequence: earlier
  segments are forgotten, so a once_per_hike segment seen pre-update
  could repeat once (session 2 concern).
- `startNewTrail` resets: distance, lastRollM, stats, AND spine per-hike
  state (history, world timers, targetDeals). **LOCKED (v1): recency
  resets with the trail** — revisit if back-to-back hikes feel samey.
  `flags`, `journal`, `hatRemainingM` persist across trails.
- Restore quirk unchanged: an unresolved arrival re-scrolls and re-asks;
  a tap on a restored terminal node deals correctly because the spine is
  initialized in `create()` before input exists (verified).
- Save triggers: every resolved stop, 5 s autosave, tab hidden.

## 5. STATS & GATING

Unchanged: `water`/`energy`/`morale` start 3 clamp 0–5; read only by HUD
+ `requires` (greyed, not hidden); flags are a separate write-only bag
(cross-trail); no runtime key whitelist (load-time warnings only);
both-options-gated soft-lock warned at load only.

## 6. RANDOMNESS

- `rollNextLandmark` — boundary gaps (skipped when the upcoming node has
  `gapM`).
- `rollForSpecials` — hat/fox dice.
- `pickNext` — weighted-next rolls at resolve time (4 weighted options).
- **The dealer adds NO randomness this session** — fixed order. Session 2
  is where deal randomness arrives.
- audio.js — melody/shimmer drift only. No seeded RNG anywhere.

## 7. VALIDATION

**A real load stage now**: content-load.js imports the JSON, runs
`validateContent` once, exports the validated object; Game and Camp both
import from it (the old §9 import-side-effect wart is resolved). All
checks warn-and-continue (only the beat-effects strip modifies data):

Node checks (as before): effects-strip on optionless nodes; start
exists; nexts exist (**`"@exit"` is exempt from the existence check**);
weights positive; exactly 2 options; ≥1 un-gated option; stat-key
whitelist on effects/requires.

Segment checks (new): entry exists and is a member; every member
exists; **every node in exactly one segment** (no orphans/doubles);
internal walk from entry — literal nexts must stay inside the segment,
every member reachable, non-ending segments must reach `@exit`, the
ending segment must reach an ending node and contain no `@exit`; entry
nodes must not carry `gapM` (rule 7); vocab enums on
weight/frequency/needs/sets/skeleton; exactly one skeleton `opening`
and one `ending`; `start` === the opening segment's entry.

Not validated: flag-name typos, linger-value sanity, deck viability
(session 2's dealer needs its own exhaustion checks).

## 8. AUDIO & TIME-OF-DAY

Unchanged (see prior entries): synthesized one-shots + shimmer +
footsteps exist; content cannot request sounds; time-of-day and scenery
biome are distance-driven, unreadable and unwritable by content or
engine decisions. Known cosmetic quirk: rapid automated tapping can
outrun Tone's chime scheduler ("start time must be strictly greater…" —
one chime skipped, no game effect).

## 9. KNOWN HAZARDS & QUIRKS

- **The dealer is a stub.** FIXED_ORDER walks all 20 segments including
  the heldOut ones (sunset, stars) — heldOut/needs/sets/weight/frequency
  are inert data until session 2.
- **`@exit` never survives into `currentId`** (substituted pre-
  assignment, verified) — saves and the spawn check only see node ids.
- **advanceTo remains the single funnel** — new resolution semantics go
  there and nowhere else; interrupts bypass it by design.
- **Deck exhaustion will be a crash path in session 2** — "no legal
  deal" must be handled (relaxation order: recency first, then setting,
  never once_per_hike) before rules go live; the fixed order can't
  exhaust.
- **Validator warns, it doesn't fix** (except the effects strip).
- **`gapM` not `?fast`-scaled**; arrival ≈ gapM/1.4 s + ~3.3 s scroll-in.
- **SAVE_VERSION bump wipes saves**; add fields with reader defaults
  (flags did it; spine did it).
- **Testing traps** (all hit and solved in harnesses): the
  visibilitychange saveNow resurrects a save after `localStorage.clear()`
  — stub `__wg.saveNow` first; `page.goto` resolves before Phaser
  finishes booting — wait before stubbing; kill rare dice with
  `__wg.rollForSpecials = () => {}`.
- **`window.__wg` / `__wg.spine`** — live handles; force a stop with
  `__wg.currentId = 'id'; __wg.nextLandmarkAtM = __wg.distanceM`
  (segment lookup self-heals).
- **meetCreature reads the upcoming node's `biome`** for journal/photo
  tags — must move to the spine's virtual setting when that becomes the
  scenery authority (parked).
- **Trail-cycling farms rares** — once_per_hike resets each trail
  (parked for Session 6 rarity tuning).
- Hat/fox flow engine-coded; beat/ending labels hardcoded; `cardKind`
  write-only.

## 10. CURRENT CONTENT

46 nodes · **20 segments** (manifest in content.json) · 42 `@exit`
pointers · 2 heldOut · skeleton roles opening/closing/ending assigned.
Node census unchanged: 20 choices, 25 beats (24 linger, 1 card),
1 ending; 4 weighted options; 5 flag options.

**The trail now deals all 20 segments in fixed order** (26–38 stops;
was 24–36): everyone meets painted_sign, cairn_topple AND whistle —
the two accepted single-successor micro-changes.

References: CONTENT-INVENTORY.md (regenerated 11 Jul 2026 post-spine),
SEGMENT-TABLE.md v1.1 (the dealer spec for session 2), NOTES.md
("Parked" sections) for the follow-up backlog.
