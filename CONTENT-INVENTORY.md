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
effects   applied when "Walk on" is tapped (optional)
next      single onward pointer
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
  "Begin a new trail" (endings), "Wear it" (hat).
- The stop *prompts and options themselves* are fully data-driven — no leftover
  hardcoded choices from Session 3 remain.

## The nodes

### fork_cairn_01 — choice · distance · forest · landmark: cairn

> "The trail splits at a cairn."

| Option | Effects | Next |
|---|---|---|
| Take the high ridge | energy −1 | vista_overlook_01 |
| Follow the low path | (none) | stream_crossing_01 |

**Diverges:** YES — different effects *and* different next (the only true route branch).

### vista_overlook_01 — beat · distance · forest · landmark: signpost

> "The trees open up. Below, the whole valley is holding still in the light."

Effects: morale +1 · Next: stream_crossing_01

### stream_crossing_01 — choice · distance · forest · landmark: stream

> "A shallow stream chatters across the path."

| Option | Effects | Next |
|---|---|---|
| Stop and refill the canteen | water +2 | sunset_pause_01 |
| Hop across and press on | energy −1 | sunset_pause_01 |

**Diverges:** effects only — both options converge on sunset_pause_01.

### sunset_pause_01 — choice · distance · forest · landmark: signpost

> "The light has gone long and golden behind the treeline."

| Option | Effects | Next |
|---|---|---|
| Stop and watch a while | morale +1 | log_rest_01 |
| Walk on through the gold | (none) | log_rest_01 |

**Diverges:** effects only (one side is a no-op) — same next. Not flat, but the
thinnest divergence in the file; fine for a mood-and-pace stop, by design.

### log_rest_01 — choice · distance · forest · landmark: signpost

> "A mossy log sits at a bend, exactly bench-shaped."

| Option | Effects | Next |
|---|---|---|
| Sit, sip, and watch a while | water −1, energy +1, morale +1 · requires water ≥ 1 | trail_end_01 |
| Keep a good rhythm going | (none) | trail_end_01 |

**Diverges:** effects only — same next. Only node using `requires`.

### trail_end_01 — ending · authored · forest · landmark: cairn

> "The path climbs one last rise and opens onto a quiet overlook. That's the trail for today."

No options; resets to a fresh trail. No setpiece (field unsupported).

## Count

**4 choices · 1 beat · 1 ending · 0 flat choices** — every choice diverges at
least by effects; only fork_cairn_01 diverges by route.
