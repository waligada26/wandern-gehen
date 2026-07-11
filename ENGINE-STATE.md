# ENGINE-STATE — what the code actually does

A living reality document. The design docs (GAME-DESIGN.md etc.) describe
**intent**; this file describes the **code as it is**. Where they disagree,
this file wins. Re-read at the start of a session; update at the end of any
session that changes engine behavior, schema, save format, or validation.

Last verified against the code: 11 July 2026, world-texture session
(advance funnel, weighted next, flags, gapM, validator suite; content
grown to 46 nodes). Line numbers drift — trust the named function over
the number.

## 1. MODULE MAP

| File | Owns |
|---|---|
| `src/main.js` | DOM boot, service-worker registration (skipped on dev server) |
| `src/game/main.js` | Phaser config: 360×640 portrait, `pixelArt: true`, FIT scaling, scene order `[Camp, Game]` |
| `src/game/scenes/Camp.js` | The campfire scene. Runs first; no save → hands straight to Game (Camp.js:23–28) |
| `src/game/scenes/Game.js` | Everything else: world, distance clock, stops, cards, lingers, rare encounters, journal UI, day/night wash, biome tints, placeholder texture painters |
| `src/game/content.json` | The content graph: `start`, `creatures`, `nodes` |
| `src/game/content-validate.js` | Load-time content guardrails (see §7) |
| `src/game/save.js` | One localStorage save slot, versioned |
| `src/game/photos.js` | Polaroids in IndexedDB (`wandern-gehen`/`photos`), Web Share / download fallback |
| `src/game/audio.js` | Tone.js: synthesized placeholder stems, shimmer layer, one-shots, footsteps, mute |

## 2. CONTENT SCHEMA (AS IMPLEMENTED)

Top level: `start` (id), `creatures` (`{ id: { name } }` — journal roster),
`nodes` (map keyed by id; **there is no `id` field inside a node**, unlike
GAME-DESIGN.md's sketch).

**choice** — `type`, `trigger`, `biome`, `prompt`, `landmark`, `options` (exactly 2):
- option: `label`, `effects` (optional; keys limited to water/energy/morale,
  validator-warned), `requires` (optional, `{ stat: min }`), `flags`
  (optional, `["name", ...]` — set true on tap, write-only), `next`
  (a node id OR a weighted array `[{ id, weight }, ...]`)

**beat** — same minus `options`, plus `next` (id or weighted array) and:
- `linger { ms, tint }` optional → held scene moment, no button, timer
  auto-advance. Absent → card with hardcoded **"Walk on"** button.
- `gapM` optional (any node type, in practice beats): fixed spawn distance
  in walked meters replacing the random gap when this node is upcoming.
  **Not scaled by `?fast`.** All follow-up beats use 10 (≈10 s to arrival
  including the ~3 s landmark scroll-in).
- Beats may NOT carry `effects` — validator strips them (§7).

**ending** — `type`, `trigger`, `biome`, `prompt`, `landmark`. Button text
"Begin a new trail" hardcoded (`buildEnding`). `setpiece` not implemented.

Decorative / fallback facts: `trigger` never read; `biome` only tags
journal/photo captions; unknown/`null` `landmark` → signpost fallback;
`requires`/`linger`/`gapM`/`flags`/weighted-next are all real but absent
from GAME-DESIGN.md's sketch.

## 3. RESOLUTION FLOW

Tap on a choice option → `buildCard` wires
`onTap: () => resolveStop(opt.effects, opt.next, opt.flags)` →
`resolveStop`: `applyEffects` → `applyFlags` → `dismissCard` →
`resumeWalk` → `advanceTo(next)`.

**`advanceTo(next)` is the single advance funnel** — card taps, linger
ends (`endLinger` calls it), and `startNewTrail` all go through it. It
does: `currentId = pickNext(next)` → `rollNextLandmark()` → `saveNow()`.
The old dual-path hazard (resolveStop vs endLinger duplicating advance
logic) is gone.

- **Weighted next**: `pickNext` rolls a weighted array with
  `Math.random()` **at resolve time** and the result is saved in the same
  call — reloading before the follow-up arrives replays the same outcome.
  Weights are placeholders; rarity tuning is Session 6.
- **Per-node spawn gap**: `rollNextLandmark` checks the upcoming node for
  numeric `gapM` and uses `distanceM + gapM` instead of the random roll
  (floor 30 s + avg of two 60 s rolls, ÷10 under `?fast`; `gapM` is NOT
  ÷10'd).
- **Missing/bad `next` still crashes at runtime** (TypeError at the next
  spawn, 30–90 s later) — but the validator now warns about every dangling
  pointer at load (§7), so the console tells you at boot, not mid-walk.
- Still not possible: "resume with no follow-up" resolution; conditional
  (non-random) branching; reading flags or time-of-day in content.

## 4. SAVE & PERSISTENCE

Save object (`saveNow`; `writeSave` adds `v: 1`):
`{ v, distanceM, state, currentId, nextLandmarkAtM, journal, hatRemainingM, flags }`.

- `flags` added 11 Jul 2026 WITHOUT a version bump — the reader defaults it
  (`save.flags || {}`), so pre-flags saves still load (verified in test).
- `loadSave(validIds)` rejects `v !== 1` or unknown `currentId`.
  **Bumping SAVE_VERSION wipes every save.**
- `startNewTrail` resets `distanceM`, `lastRollM`, `state` only.
  **`flags`, `journal`, `hatRemainingM` persist across trails** — flags are
  deliberately cross-trail (commented in code; future payoffs depend on it).
- Outside the save: mute flag (localStorage `wandern-gehen-muted`), photos
  (IndexedDB).
- Restore quirk (intended): a save pointing at an unresolved stop re-scrolls
  the landmark and re-asks. Randomize at tap (persisted) — never at arrival.
- Save triggers: every resolved stop, 5 s autosave tick, tab hidden.

## 5. STATS & GATING

- Stats: `water`, `energy`, `morale` — start 3, clamped 0–5 in
  `applyEffects`. Read only by the HUD and `requires` gating. `distance`
  is the clock, not a stat.
- Flags: separate `this.flags` bag — booleans, no clamp, not shown in HUD,
  set via option `flags` arrays in `applyFlags`. **Write-only**: no engine
  read side yet (conditional prompts / flag requires are parked).
- `requires` failure: option greyed (fill α 0.35, text α 0.5), not hidden,
  not tappable.
- Hazard status: unknown effects/requires keys and both-options-gated
  choices are now **warned at load** (§7) but NOT auto-fixed — `applyEffects`
  itself still accepts any key at runtime. The warnings only help if the
  console is read.

## 6. RANDOMNESS

Every `Math.random()` in game logic:
- `rollNextLandmark` — landmark gap (skipped when the upcoming node has `gapM`).
- `rollForSpecials` — hat/fox dice per 10 walked meters.
- `pickNext` — **weighted-next roll at resolve time** (new; the only
  randomness in content routing). 4 weighted options exist (coin B 90/10,
  rain B 85/15, hollow A 90/10, whistle A 95/5).
- audio.js — melody/shimmer drift only.

No seeded RNG. Anti-reroll: `advanceTo` saves immediately after the roll
(verified: reload before the follow-up replays the same outcome).

## 7. VALIDATION

`validateContent(content)` (content-validate.js) runs once as an import
side effect of Game.js. All checks WARN (naming the node) and continue;
only the effects-strip actually modifies data:

1. Optionless node with non-empty `effects` → warn + **strip** (the one
   destructive check). Invariant: effects only live on options.
2. `start` id must be a node.
3. Every `next` — plain or every id in a weighted array — must exist;
   missing `next` and empty weighted arrays are warned; weights must be
   positive numbers. (Turns §3's delayed crash into a load-time warning.)
4. Every choice has exactly 2 options.
5. At least one option per choice is un-gated (soft-lock warning).
6. effects/requires keys must be water/energy/morale (warn-only — typo'd
   keys still apply at runtime if the warning is ignored).

Not validated: reachability/orphans, flag-name typos, `linger`/`gapM`
value sanity, unknown node types.

## 8. AUDIO & TIME-OF-DAY

Implemented (synthesized placeholders, Tone.js): decision/arrival chimes,
sighting sting, footstep loop, hat shimmer stem, iOS `audioSession`
playback fix, `window.__wgAudio` debug meter.

Limits unchanged: **content cannot request sounds** (no per-node sound
field), and **time-of-day is visual-only** — the wash is a pure function
of `distanceM % DAY_CYCLE_M`; nothing reads it for decisions. Biome
scenery likewise cycles on walked meters, unrelated to the graph's
`biome` field.

## 9. KNOWN HAZARDS & QUIRKS

- ~~Dual resolution paths~~ **RESOLVED**: `advanceTo` is the single funnel.
  Keep it that way — new resolution semantics go there and nowhere else.
- **Randomize at tap or lose it on reload** — arrival-time decisions
  re-roll; `advanceTo` already does this correctly for weighted next.
- **Validator warns, it doesn't fix** (except the effects strip). A
  dangling `next` still crashes at the spawn if the console warning is
  ignored; typo'd stat keys still create silent fake stats at runtime.
- **`gapM` is not `?fast`-scaled** — deliberate (it's already short).
- **Follow-up arrival ≈ gapM/1.4 s + ~3.3 s scroll-in** — at gapM 10
  that's ~10 s, not "instant". Drop gapM to ~1–3 for a snappier feel;
  ~3.3 s is the floor.
- **Flags are cross-trail AND write-only** — nothing reads them yet; don't
  promise payoffs in prompts until the read side exists.
- **Both-options-gated soft-lock** still possible at runtime (warned at
  load only). De-facto rule: at most one `requires` per choice.
- **SAVE_VERSION bump wipes saves**; add fields with reader-side defaults
  instead (flags did exactly this).
- **`cardKind` is write-only** — set in 7 places, read nowhere.
- **Validation is an import side effect** of Game.js, not a loader stage.
- **`window.__wg` / `window.__wgAudio`** — live debug handles. Force a
  stop: `__wg.currentId = 'id'; __wg.nextLandmarkAtM = __wg.distanceM`.
  Kill rare dice in tests: `__wg.rollForSpecials = () => {}`. The
  visibilitychange hook saves on reload — stub `__wg.saveNow` before
  injecting a hand-written save in tests.
- **Hat/fox flow is engine code, not content** (`meetHat`, `meetCreature`);
  hat is a real two-option choice; declined hats never return.
- Beat/ending button labels are hardcoded ("Walk on", "Begin a new trail").

## 10. CURRENT CONTENT

46 nodes in `src/game/content.json` — **20 choices, 25 beats (24 linger,
1 card: gate_01), 1 ending**. All reachable from `start`
(`butterfly_pack_01`); longest walk ≈ 36 stops, shortest ≈ 24.

- Branch-local choices: `painted_sign_01` (high ridge only),
  `cairn_topple_01` / `whistle_valley_01` (one per pond option).
- Weighted options: 4. Flag-setting options: 5 (`hung_glove`,
  `trusted_sign`, `found_coin`, `restacked_cairn`, `signed_bothy`).
- Follow-up beats all carry `gapM: 10` (incl. retrofitted
  `pond_stones_beat_01`, `marker_read_beat_01`).
- creatures: fox (spawnable), deer/yeti (journal silhouettes only).

Detailed per-node reference: **CONTENT-INVENTORY.md** (regenerated
11 Jul 2026 — current, including the two-button hat note). Parked
follow-ups live in NOTES.md ("Parked from the world-texture session").
