# CONTENT INVENTORY — read-only report

Generated 10 July 2026 from the live data file. Reference for authoring new
stops; regenerate after content changes.

## The file

**Path:** `src/game/content.json`

Top-level shape:

- `start` — id of the node every new trail begins at (`fork_cairn_01`)
- `creatures` — the field-journal roster (`fox`, `deer`, `yeti`), each `{ "name": ... }`
- `nodes` — the stop graph, keyed by node id

## Node fields as actually implemented

**Choice node:**

```
type      "choice"
trigger   informational only — see "hardcoded" notes below
biome     used as the biome tag on journal entries / photo captions
prompt    the card text
landmark  texture key for the prop that scrolls in (unknown key → signpost fallback)
options   exactly 2 of:
  label      button text
  effects    { stateKey: +/-n } applied on tap (optional in practice; {} is fine)
  requires   { stateKey: min } — option greys out and is untappable below this (OPTIONAL)
  next       id of the node this branch goes to
```

**Beat node:** same as choice, minus `options`, plus:

```
effects   applied when "Walk on" is tapped — or, on a linger beat, when the hold begins (optional)
next      single onward pointer
linger    OPTIONAL — { "ms": n, "tint": "#rrggbb" }, both sub-fields optional.
          Presence = a HELD SCENE MOMENT instead of a card: the world eases to
          a stop (~0.5s), the prompt fades in as a buttonless caption, the
          optional tint overlays the scene at ~0.25 alpha, it holds `ms`
          (default 3000), reverses, and auto-advances to `next`. The distance
          clock (and everything on it) pauses during the hold.
```

**Ending node:** `type`, `trigger`, `biome`, `prompt`, `landmark` only. Shows the
JOURNEY'S END screen; "Begin a new trail" resets distance + state and returns to
`start`. (The `setpiece` field from GAME-DESIGN.md's sketch is **not implemented**.)

## State keys

Defined in `src/game/scenes/Game.js` (`STATE_START` / `STATE_MAX`):

- `water`, `energy`, `morale` — all start at 3, clamped 0–5, usable in `effects`
  and `requires`.
- `distance` is **not** part of the effects system — it's the distance clock
  (`distanceM` in Game.js), advanced only by walking. An `effects: { distance: n }`
  would silently create a new state key, not move the hiker.

## Choice logic still hardcoded in engine code (not in the data file)

- **`trigger` is decorative.** The engine spaces every stop by the distance roll
  and ignores this field entirely (`authored` on the ending changes nothing).
- **The lucky-hat pickup card** ("A lucky hat, snagged on a bramble…") is a
  hardcoded moment in `Game.js` (`meetHat`), outside the content graph — as is
  the whole rare-encounter flow (fox, polaroid).
- **Button labels for non-choices** are fixed in code: "Walk on" (beats),
  "Begin a new trail" (endings), "Wear it" (hat). A tactile beat like the gate
  can't say "Open the gate" yet.
- The stop *prompts and options themselves* are fully data-driven — no leftover
  hardcoded choices from Session 3 remain.
- There is **no hardcoded trail-end or distance cap** — a trail ends only when
  the graph reaches a `type: "ending"` node.

## The nodes (in trail order)

### fork_cairn_01 — choice · distance · forest · landmark: cairn

> "The trail splits at a cairn."

| Option | Effects | Next |
|---|---|---|
| Take the high ridge | energy −1 | vista_overlook_01 |
| Follow the low path | (none) | stream_crossing_01 |

**Diverges:** YES — different effects *and* different next (the only true route branch).

### vista_overlook_01 — beat · distance · forest · landmark: signpost · **linger 3500ms**

> "The trees open up. Below, the whole valley is holding still in the light."

Effects: morale +1 · Next: stream_crossing_01. High-ridge branch only.

### stream_crossing_01 — choice · distance · forest · landmark: stream

> "A shallow stream chatters across the path."

| Option | Effects | Next |
|---|---|---|
| Stop and refill the canteen | water +2 | encounter_hiker_01 |
| Hop across and press on | energy −1 | encounter_hiker_01 |

**Diverges:** effects only — both options converge on encounter_hiker_01.

### encounter_hiker_01 — choice · distance · forest · landmark: signpost

> "Another walker comes the other way, pack worn soft with miles."

| Option | Effects | Next |
|---|---|---|
| Say hello | morale +1 | sunset_pause_01 |
| Nod and pass | (none) | sunset_pause_01 |

**Diverges:** effects only (one side is a no-op) — a mood/encounter stop.

### sunset_pause_01 — choice · distance · forest · landmark: signpost

> "The light has gone long and golden behind the treeline."

| Option | Effects | Next |
|---|---|---|
| Stop and watch a while | morale +1 | pond_stones_01 |
| Walk on through the gold | (none) | pond_stones_01 |

**Diverges:** effects only (one side is a no-op) — fine for a mood-and-pace stop.

### pond_stones_01 — choice · distance · forest · landmark: signpost

> "The path edges a still pond, flat as glass."

| Option | Effects | Next |
|---|---|---|
| Skip a stone | morale +1 | pond_stones_beat_01 |
| Keep going | (none) | marker_read_01 |

**Diverges:** YES — skipping the stone routes through a linger beat; both paths
rejoin at marker_read_01.

### pond_stones_beat_01 — beat · distance · forest · landmark: null (signpost fallback) · **linger 3000ms**

> "The stone skips once, twice — rings spreading out across the quiet."

No effects · Next: marker_read_01. Only reached via "Skip a stone".

### marker_read_01 — choice · distance · forest · landmark: signpost

> "A weathered marker leans at the junction, letters half-worn."

| Option | Effects | Next |
|---|---|---|
| Read it | (none) | marker_read_beat_01 |
| Walk past | (none) | log_rest_01 |

**Diverges:** next only — the FLATTEST choice in the file effects-wise (both
no-ops), but the payoff is the discovery beat, not a stat.

### marker_read_beat_01 — beat · distance · forest · landmark: null (signpost fallback) · **linger 3500ms**

> "'Old Miller's Track — 2 miles.' Someone carved a small bird beneath it."

No effects · Next: log_rest_01. Only reached via "Read it".

### log_rest_01 — choice · distance · forest · landmark: signpost

> "A mossy log sits at a bend, exactly bench-shaped."

| Option | Effects | Next |
|---|---|---|
| Sit, sip, and watch a while | water −1, energy +1, morale +1 · requires water ≥ 1 | gate_01 |
| Keep a good rhythm going | (none) | gate_01 |

**Diverges:** effects only — same next. Only node using `requires`.

### gate_01 — beat · distance · forest · landmark: signpost

> "A wooden gate crosses the path, latched against the wind."

No effects · Next: trail_end_01. Normal "Walk on" card — the tactile micro-beat,
and the last stop before the ending.

### trail_end_01 — ending · authored · forest · landmark: cairn

> "The path climbs one last rise and opens onto a quiet overlook. That's the trail for today."

No options; resets to a fresh trail. No setpiece (field unsupported).

## Count

**7 choices · 4 beats (3 linger, 1 card) · 1 ending** — every choice diverges by
effects or by routing into a beat; fork_cairn_01 is still the only biome-scale
route branch. Longest possible trail: 12 stops (high ridge + both discovery
beats); shortest: 9 (low path, no detours).
