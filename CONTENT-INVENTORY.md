# CONTENT INVENTORY — read-only report

Generated 11 July 2026 from the live data file, after the world-texture
session (13 new choices + 21 follow-up beats). Reference for authoring new
stops; regenerate after content changes.

## The file

**Path:** `src/game/content.json`

Top-level shape:

- `start` — id of the node every new trail begins at (`butterfly_pack_01`)
- `creatures` — the field-journal roster (`fox`, `deer`, `yeti`), each `{ "name": ... }`
- `nodes` — the stop graph, keyed by node id

## Node fields as actually implemented

**Choice node:**

```
type      "choice"
trigger   informational only — the engine never reads it
biome     tags journal entries / photo captions ONLY — scenery biome cycles
          by walked distance (BIOME_LENGTH_M in Game.js), not by the graph
prompt    the card text
landmark  texture key for the prop that scrolls in (unknown/null → signpost)
options   exactly 2 of:
  label      button text
  effects    { stat: +/-n } applied on tap ({} fine; keys must be
             water/energy/morale — the validator warns on anything else)
  requires   { stat: min } — option greys out below this (OPTIONAL; at
             least one option must be un-gated or the validator warns)
  flags      [ "flag_name", ... ] — set true in the save's flags object on
             tap (OPTIONAL; write-only for now — no read side yet)
  next       node id, OR an array of weighted outcomes:
             [ { "id": ..., "weight": 90 }, { "id": ..., "weight": 10 } ]
             Rolled ONCE at tap time and saved immediately, so a reload
             replays the same outcome. Weights are placeholders until the
             Session 6 rarity pass.
```

**Beat node:** same minus `options`, plus:

```
next      single onward pointer (may also be a weighted array)
linger    OPTIONAL — { "ms": n, "tint": "#rrggbb" }. Presence = held scene
          moment instead of a card: world eases to a stop, prompt fades in
          as a buttonless caption, holds ms (default 3000), reverses,
          auto-advances. The distance clock pauses during the hold.
gapM      OPTIONAL — fixed spawn distance in walked meters, replacing the
          random 30–90s gap when THIS node is the upcoming one. All
          follow-up beats use 10 (≈10s to arrival incl. scroll-in).
          NOT scaled by ?fast.
effects   FORBIDDEN — the validator strips effects from any optionless
          node (effects only live on options; beats show, choices change
          state)
```

**Ending node:** `type`, `trigger`, `biome`, `prompt`, `landmark` only.
"Begin a new trail" resets distance + stats (NOT flags, NOT journal) and
returns to `start`.

## State keys & flags

- Stats: `water`, `energy`, `morale` — start 3, clamp 0–5. The ONLY legal
  effects/requires keys (validator-enforced with warnings). `distance` is
  the clock, not a stat.
- Flags: booleans in the save's `flags` object, set by option `flags`
  arrays. Cross-trail (survive "Begin a new trail") and cross-session.
  Currently write-only. In use: `hung_glove`, `trusted_sign`, `found_coin`,
  `restacked_cairn`, `signed_bothy`.

## Still hardcoded in engine code (not in the data file)

- **The lucky hat** is a real two-option choice ("Wear it" / "Leave it on
  the bramble") but lives in Game.js (`meetHat`), outside the graph, as
  does the fox/photo/journal flow. A declined hat never returns.
- **Beat/ending button labels**: "Walk on", "Begin a new trail" — fixed
  strings; a beat can't label its own button.
- **`trigger` is decorative**; stop spacing comes from the distance roll
  (or `gapM`).
- No hardcoded trail end — a trail ends only at a `type: "ending"` node.
- Scenery (day/night wash, biome palettes) is distance-driven; content
  cannot set time of day or scenery biome.

## The trail (46 nodes: 20 choices · 25 beats · 1 ending)

Every follow-up beat is a linger with `gapM: 10` unless noted. Weighted
branches shown as percentages of their two-outcome roll.

| # | Stop (choice unless noted) | A | B |
|---|---|---|---|
| 1 | **butterfly_pack_01** — "A butterfly lands on the hiker's pack and stays." | Walk gently (morale +1) → butterfly_ride_beat (3500) | Carry on as normal → butterfly_off_beat (3000) |
| 2 | **glove_fencepost_01** — "A knitted glove lies on the path, still holding its shape." | Hang it on the fencepost [flag hung_glove] → glove_hung_beat (3000) | Walk past → fork_cairn_01 |
| 3 | **fork_cairn_01** — "The trail splits at a cairn." (landmark: cairn) | Take the high ridge (energy −1, morale +1) → vista_overlook_01 (linger 3500, no gapM) → painted_sign_01 | Follow the low path → stream_crossing_01 |
| 3a | **painted_sign_01** (high-ridge branch only) — "A hand-painted sign points off-trail: 'worth it — 5 min.'" | Trust it [flag trusted_sign] → sign_vista_beat (3500) | Stay on the path → stream_crossing_01 |
| 4 | **stream_crossing_01** — "A shallow stream chatters across the path." (landmark: stream) | Stop and refill the canteen (water +2) → coin_stream_01 | Hop across and press on (energy −1) → coin_stream_01 |
| 5 | **coin_stream_01** — "Something glints under the current." (landmark: stream) | Fish it out [flag found_coin] → coin_beat (3000) | Let the water keep it → 90% encounter_hiker_01 / 10% fish_look_beat (3500) |
| 6 | **encounter_hiker_01** — "Another walker comes the other way…" | Say hello (morale +1) → litter_packet_01 | Nod and pass → litter_packet_01 |
| 7 | **litter_packet_01** — "A crisp packet turns over and over in the grass." | Pocket it → litter_pocketed_beat (3000) | Leave it turning → sunset_pause_01 |
| 8 | **sunset_pause_01** — "The light has gone long and golden…" | Stop and watch a while (morale +1) → rain_shower_01 | Walk on through the gold → rain_shower_01 |
| 9 | **rain_shower_01** — "Rain starts, soft and warm…" | Shelter under the pine → pine_shelter_beat (4000) | Walk on through it → 85% rain_walk_beat (3000) / 15% rainbow_beat (4000) |
| 10 | **mist_valley_01** — "Mist is rolling up from the valley floor." | Wait for it to pass → mist_wait_beat (4000) | Walk into it → mist_walk_beat (3500) |
| 11 | **hollow_tree_01** — "An old oak has a hollow at shoulder height, dark inside." | Reach in → 90% hollow_acorn_beat (3000) / 10% hollow_rare_beat (4000) | Best not → pond_stones_01 |
| 12 | **pond_stones_01** — "The path edges a still pond, flat as glass." | Skip a stone (morale +1) → pond_stones_beat_01 (3000) → cairn_topple_01 | Keep going → whistle_valley_01 |
| 12a | **cairn_topple_01** (skip-stone branch) — "A trail cairn has toppled at the bend." (landmark: cairn) | Restack the stones [flag restacked_cairn] → cairn_restacked_beat (3000) | Step around it → marker_read_01 |
| 12b | **whistle_valley_01** (keep-going branch) — "The valley below has the shape of an echo." | Whistle into it → 95% echo_beat (3000) / 5% echo_rare_beat (4000) | Keep your breath → marker_read_01 |
| 13 | **marker_read_01** — "A weathered marker leans at the junction…" | Read it → marker_read_beat_01 (3500) | Walk past → bothy_door_01 |
| 14 | **bothy_door_01** — "A stone shelter sits off the path, door ajar." | Look inside [flag signed_bothy] → bothy_beat (3500) | Leave it be → log_rest_01 |
| 15 | **log_rest_01** — "A mossy log sits at a bend, exactly bench-shaped." | Sit, sip, and watch a while (water −1, energy +1, morale +1; requires water ≥ 1) → dog_stile_01 | Keep a good rhythm going → dog_stile_01 |
| 16 | **dog_stile_01** — "A farm dog waits at the stile like it was expecting you." | Let it walk with you (morale +1) → dog_along_beat (3500) | Send it home → dog_home_beat (3000) |
| 17 | **stars_clear_01** — "The sky has gone impossibly clear." | Lie back a while → stars_beat (**5000**) | Keep to the trail → gate_01 |
| 18 | **gate_01** (beat, card) — "A wooden gate crosses the path, latched against the wind." → "Walk on" → trail_end_01 | | |
| 19 | **trail_end_01** (ending) — "The path climbs one last rise and opens onto a quiet overlook…" (landmark: cairn) | | |

Merge notes: all follow-up beats rejoin the trunk at the next numbered
stop. The two branch-local choices are painted_sign_01 (high ridge only)
and the pond pair cairn_topple_01/whistle_valley_01 (one per pond option);
both branches remerge at marker_read_01.

## Count

**20 choices · 25 beats (24 linger, 1 card) · 1 ending = 46 nodes**, all
reachable from `start`, zero dangling pointers (validated in-engine at
load and by the session's test sweep). Longest possible trail ≈ 36 stops;
shortest ≈ 24. Weighted rolls: 4 (coin B, rain B, hollow A, whistle A).
Flag-setting options: 5.
