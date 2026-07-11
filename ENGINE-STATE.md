# ENGINE-STATE — what the code actually does

A living reality document. The design docs (GAME-DESIGN.md etc.) describe
**intent**; this file describes the **code as it is**. Where they disagree,
this file wins. Re-read at the start of a session; update at the end of any
session that changes engine behavior, schema, save format, or validation.

Last verified against the code: 11 July 2026, art-chapter close-out.
The dealer (rules 1–7 + skeleton) is unchanged and live. **The scene
is now a shallow ¾ view** (Stage M of the Section A recomposition —
see §8b): sky / far hills / horizon treeline / one ground plane with
a planted-prop system. Art status: Wanda is real (G1 locked); clouds
and far hills are real generations; the horizon treeline is processed
generated art; **the ground plane and all props are mock/recovered
placeholders pending Stage N**. Other engine changes this chapter:
biome multiply-tint neutralized (§8), day-wash render bug fixed (§8),
service-worker caching strategy rewritten (§1, main.js row). A1
decision resolved as (b): per-setting painted sets; setting→scenery
wiring parked to Section D. Line numbers drift — trust the named
function.

## 1. MODULE MAP

| File | Owns |
|---|---|
| `src/main.js` | DOM boot, service-worker registration (skipped on dev server). `public/sw.js` strategy: network-first pages · cache-first ONLY Vite-hashed bundles · stale-while-revalidate for un-hashed assets (`cache:'no-cache'` refresh, awaited puts) — a deploy reaches clients one launch later. Cache name `wandern-gehen-v2` |
| `src/game/main.js` | Phaser config: 360×640 portrait, `pixelArt: true`, FIT scaling, scene order `[Camp, Game]` |
| `src/game/scenes/Camp.js` | The campfire scene. Runs first; no save → hands straight to Game |
| `src/game/scenes/Game.js` | World (¾-view scene — §8b), distance clock, stops, cards, lingers, rare encounters, journal UI, day/night wash, planted-prop system, prop placeholder painters (scenery painters removed except `paintPlane`, the mock ground plane) |
| `src/game/content.json` | The content data: `start`, `creatures`, `nodes`, **`segments`** |
| `src/game/content-load.js` | **The load stage**: imports content.json, validates once, exports it. Game/Camp import from HERE, never the raw JSON |
| `src/game/content-validate.js` | All content + segment guardrails (§7) |
| `src/game/spine.js` | The spine: segment lookup, **the dealer** (SEGMENT-TABLE rules 1–7 + skeleton), per-hike history, world-state timers, virtual-setting ring. Pure module, Node-testable; rng injectable; guarded `?deal=` dev override |
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

`needs`/`sets`/`weight`/`frequency`/`heldOut` are **live** — the dealer
enforces all of them. heldOut (sunset, stars) genuinely leaves the
trail until the time-of-day session.

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

- **The dealer** (spine.js `pickDeal`/`drawFromDeck`): each `@exit`
  deal filters the deck — once_per_hike spent, no back-to-back, heavy
  adjacency (heavies only ever touch light — bidirectional, includes
  the ending and the fork slot), setting gate vs the virtual setting,
  sky gates ("clear" blocked while wet/misty; night/goldenhour
  undealable until time-of-day), self-exclusion while own `sets` state
  active — then draws weighted (recency penalty `RECENCY_PENALTY` over
  last `RECENCY_N`=5 deals; light preferred ×2 after a medium+).
  **Skeleton**: butterfly opens (= `start`), fork_vista slots at rolled
  position 2–3 (`forkAt`, saved), middle deals until `targetDeals`
  (avg of two rolls across 8–14, the duration dial), then the gate
  ending — with one light buffer first if the previous deal wasn't
  light. **Exhaustion**: relaxation ladder (drop recency → drop
  setting → drop back-to-back; NEVER once_per_hike/heldOut/sky/heavy),
  then the ending deals early — a short hike, never a crash
  (`console.debug` logs relaxation stages, `console.warn` logs early
  endings). Virtual setting: shuffled 5-ring advanced every
  `SETTING_STRIDE`=2 deals, reshuffled per lap — placeholder until it
  drives scenery.
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

- **`spine`** (no version bump, reader defaults): `{ history, world:
  { wet, misty }, setting, targetDeals, settingRing, settingIndex,
  forkAt }`. `history` is the full per-hike deal order (used-list +
  recency + count derive from it); `targetDeals` rolls at trail start
  (pre-dealer saves carry null → rolled lazily on the first deal);
  ring/index/forkAt persist so a reload never reshuffles mid-hike.
  Mid-hike reload restores byte-identical deck state (verified).
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
- **spine.js** — the dealer: weighted deck draw, `targetDeals` roll,
  fork-slot roll (2 vs 3), setting-ring shuffles. All through
  `this.rng` — **injectable** (constructor opts, default Math.random),
  so tests run seeded and deterministic. Deal randomness happens at
  resolve time inside `advanceTo` → persists like everything else.
- audio.js — melody/shimmer drift only.

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

Deck-viability checks (session 2): an always-legal segment must exist
(setting any + no sky + every_hike_ok) or relaxation may not terminate;
the ending segment must keep `needs.setting: "any"`; **an intentional
standing warning fires on every load** — only 7 repeatable
(every_hike_ok) deck segments vs max targetDeals 14, so long hikes lean
on repeats. That warning is a content-authoring signal, not a bug; it
clears when more every_hike_ok segments are written.

Not validated: flag-name typos, linger-value sanity.

## 8. AUDIO & TIME-OF-DAY

Audio unchanged (see prior entries): synthesized one-shots + shimmer +
footsteps exist; content cannot request sounds. Blend-mode reality
(updated mid-Section A):

- **The biome multiply-tint is RETIRED** (A1 decision (b)): painted
  layers can't be multiply-tinted, so `updateBiomeTint` is a no-op
  carrying the TODO(parked → Section D) — scenery will switch on the
  spine's virtual setting with crossfades instead of walked meters.
  `BIOME_PALETTES` remains in the file as reference only.
- **The day-wash WORKS now** — it had never rendered (Session 9 bug:
  rectangle created at object alpha 0 while updateDayWash drove only
  the fill alpha; product = invisible). Fixed in Section A; golden
  hour and dusk visibly tint, ceiling `DAY_WASH_MAX_ALPHA` 0.35.
- Day-wash and linger tints are alpha-blended rectangles (mute and
  shift, no additive glow — a true golden-hour brightening still
  needs a screen/overlay blend, parked with the time-of-day session).
- Time-of-day remains distance-driven and unreadable by content.

Known cosmetic quirk: rapid automated tapping can outrun Tone's chime
scheduler ("start time must be strictly greater…" — one chime skipped,
no game effect).

## 8b. SCENE COMPOSITION (¾ VIEW — Stage M mock, 11 Jul 2026)

The side-on band layout is GONE (the dirt cutaway with it). The scene
is a shallow ¾ view (ART-BIBLE §8): a visible ground plane recedes
upward from the bottom of the screen to a horizon.

**Bands** (`LAYERS`, draw order = array order; beyond-horizon layers
keep parallax speeds, the plane and everything planted on it move at
ONE speed):

| Band | Top..Bottom | Speed | Notes |
|---|---|---|---|
| clouds | 26..206 | 6 | sparse strip; wrap-duplication rule |
| far hills | 70..190 | 14 | sky flood-keyed to transparency (clouds pass behind real silhouettes, not a painted sky wall); bg color `#e9edfd` = its old sky tone |
| ground plane | 190..640 | 70 | `HORIZON`=190; one big tileable band; worn trail strip at Wanda's row (GROUND_Y 478); currently `paintPlane()` MOCK |
| horizon treeline | 120..220 | 32 | draws AFTER the plane so its undulating shadow base sits ON the meadow |

`PATH_SPEED` is looked up by key (`'plane'`), not index.

**Planted props** (`PROP_TYPES`, `spawnProp`, `propDepth`): spawn on
walked meters (avg-of-two-rolls gap), at a random row inside a
per-type band, ride the plane at plane speed, culled off the left
edge. **Scale-by-row**: higher rows use smaller source sprites (the
mock's distant trees are 2:1 NN downscales — a pixel-density
violation tolerated ONLY as mock). **Depth = row** (painter's
algorithm, fractional Phaser depths): rows above the trail →
`5 + (y−HORIZON)/1000` (behind Wanda at 10); the trail row and below
→ `12 + (y−HORIZON)/1000` (in front of her and the worn hat 11,
beneath the day-wash 15). **Landmarks route through propDepth too**
(spawn on the trail row exactly as before — arrival/card flow
verified unchanged). Specials (hat/fox) keep flat depth 6.

**Props are NOT persisted** — decorative only; a reload replants.
Day-wash and linger tints are full-screen rectangles and cover the
new layout unchanged. Prop spawn randomness is Math.random like the
other scene dice (§6) — not part of the dealer's injectable rng.

## 9. KNOWN HAZARDS & QUIRKS

- **`@exit` never survives into `currentId`** (substituted pre-
  assignment, verified) — saves and the spawn check only see node ids.
- **advanceTo remains the single funnel** — new resolution semantics go
  there and nowhere else; interrupts bypass it by design.
- **Deck exhaustion is handled, not crashing**: relaxation ladder, then
  an early ending (verified on a scarce-deck manifest). With current
  content the repeatable segments make true exhaustion unreachable —
  the marathon test (target 100) completes on repeats.
- **`?deal=seg_a,seg_b`** in the URL forces the first deals (dev-only;
  the one guarded impurity in spine.js — tests inject `opts.forcedDeals`
  instead). Composes with `?fast`: `?fast&deal=seg_dog`.
- **The standing validator warning** (7 repeatable segments < 14) is
  intentional — see §7. Tests expecting zero warnings must expect
  exactly this one.
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

**Every hike is now a shuffled deal**: butterfly opener → fork at
position 2–3 → a dealt middle of `targetDeals` 8–14 total deals
(16-segment deck; sunset/stars held out) → gate ending, with rules 1–7
enforced. Two consecutive hikes differ in segment order, length, and
weather — the mirror of session 1's sameness.

References: CONTENT-INVENTORY.md (regenerated 11 Jul 2026 post-dealer),
SEGMENT-TABLE.md v1.1 (the tag/spec authority; implementation status in
its header), NOTES.md ("Parked" sections) for the follow-up backlog.
