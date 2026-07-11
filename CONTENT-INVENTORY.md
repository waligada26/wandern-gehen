# CONTENT INVENTORY — read-only report

**Last regenerated: 11 July 2026** (post Session 10), from the live
`src/game/content.json` at commit `6bb61af`, cross-checked against
Game.js behavior. Validator sweep at load: **0 warnings; 46/46 nodes
reachable from start; 0 orphans.** Regenerate after content changes.

## Summary counts

| Kind | Count |
|---|---|
| choice | 20 |
| beat — linger (buttonless, auto-advance) | 24 |
| beat — card (hardcoded "Walk on" button) | 1 (gate_01) |
| ending | 1 (trail_end_01) |
| **total nodes** | **46** |
| creatures | 3 — fox (spawnable), deer, yeti (journal silhouettes only) |

`trigger` is `"distance"` on every node except trail_end_01
(`"authored"`) — decorative either way; the engine never reads it.
`biome` is `"forest"` on every node — tags journal/photo captions only.

## The trunk map

```
START butterfly_pack_01 ─A→ butterfly_ride_beat ─┐
                        └B→ butterfly_off_beat ──┴→ glove_fencepost_01
glove ─A→ glove_hung_beat →┐
      └B→ ─────────────────┴→ fork_cairn_01
fork ─high→ vista_overlook_01 → painted_sign_01 ─A→ sign_vista_beat →┐
     │                                          └B→ ─────────────────┤
     └low→ ───────────────────────────────────────────────────────────┴→ stream_crossing_01
stream (both) → coin_stream_01
coin ─A→ coin_beat →┐
     └B→ 90% ───────┼─ / 10% fish_look_beat →┐
                    └────────────────────────┴→ encounter_hiker_01
hiker (both) → litter_packet_01
litter ─A→ litter_pocketed_beat →┐
       └B→ ──────────────────────┴→ sunset_pause_01
sunset (both) → rain_shower_01
rain ─A→ pine_shelter_beat ─────────────────┐
     └B→ 85% rain_walk_beat / 15% rainbow_beat ┴→ mist_valley_01
mist ─A→ mist_wait_beat ─┐
     └B→ mist_walk_beat ─┴→ hollow_tree_01
hollow ─A→ 90% hollow_acorn_beat / 10% hollow_rare_beat →┐
       └B→ ───────────────────────────────────────────────┴→ pond_stones_01
pond ─A→ pond_stones_beat_01 → cairn_topple_01 ─A→ cairn_restacked_beat →┐
     │                                          └B→ ──────────────────────┤
     └B→ whistle_valley_01 ─A→ 95% echo_beat / 5% echo_rare_beat →┐       │
                           └B→ ────────────────────────────────────┴───────┴→ marker_read_01
marker ─A→ marker_read_beat_01 →┐
       └B→ ─────────────────────┴→ bothy_door_01
bothy ─A→ bothy_beat →┐
      └B→ ────────────┴→ log_rest_01
log (both) → dog_stile_01
dog ─A→ dog_along_beat ─┐
    └B→ dog_home_beat ──┴→ stars_clear_01
stars ─A→ stars_beat →┐
      └B→ ────────────┴→ gate_01 → trail_end_01 (ENDING)
```

**Longest walk: 36 stops** (every detour, every payoff beat).
**Shortest walk: 24 stops** (decline everything; needs coin-B's 90%
roll — the 10% fish beat makes it 25). Even the shortest walk passes
through beats: butterfly, rain, mist, and dog route every branch
through a payoff beat.

## Per-node reference — choices (trail order)

Every choice has exactly 2 options. Blank effects = `{}` (no-op).

| # | id · landmark | Prompt | Option A | Option B |
|---|---|---|---|---|
| 1 | butterfly_pack_01 · signpost | A butterfly lands on the hiker's pack and stays. | Walk gently · morale +1 → butterfly_ride_beat | Carry on as normal → butterfly_off_beat |
| 2 | glove_fencepost_01 · signpost | A knitted glove lies on the path, still holding its shape. | Hang it on the fencepost · flag `hung_glove` → glove_hung_beat | Walk past → fork_cairn_01 |
| 3 | fork_cairn_01 · cairn | The trail splits at a cairn. | Take the high ridge · energy −1, morale +1 → vista_overlook_01 | Follow the low path → stream_crossing_01 |
| 4 | painted_sign_01 · signpost *(high-ridge branch only)* | A hand-painted sign points off-trail: 'worth it — 5 min.' | Trust it · flag `trusted_sign` → sign_vista_beat | Stay on the path → stream_crossing_01 |
| 5 | stream_crossing_01 · stream | A shallow stream chatters across the path. | Stop and refill the canteen · water +2 → coin_stream_01 | Hop across and press on · energy −1 → coin_stream_01 |
| 6 | coin_stream_01 · stream | Something glints under the current. | Fish it out · flag `found_coin` → coin_beat | Let the water keep it → **weighted:** encounter_hiker_01 (90) / fish_look_beat (10) |
| 7 | encounter_hiker_01 · signpost | Another walker comes the other way, pack worn soft with miles. | Say hello · morale +1 → litter_packet_01 | Nod and pass → litter_packet_01 |
| 8 | litter_packet_01 · signpost | A crisp packet turns over and over in the grass. | Pocket it → litter_pocketed_beat | Leave it turning → sunset_pause_01 |
| 9 | sunset_pause_01 · signpost | The light has gone long and golden behind the treeline. | Stop and watch a while · morale +1 → rain_shower_01 | Walk on through the gold → rain_shower_01 |
| 10 | rain_shower_01 · signpost | Rain starts, soft and warm, the kind that doesn't mean it. | Shelter under the pine → pine_shelter_beat | Walk on through it → **weighted:** rain_walk_beat (85) / rainbow_beat (15) |
| 11 | mist_valley_01 · signpost | Mist is rolling up from the valley floor. | Wait for it to pass → mist_wait_beat | Walk into it → mist_walk_beat |
| 12 | hollow_tree_01 · signpost | An old oak has a hollow at shoulder height, dark inside. | Reach in → **weighted:** hollow_acorn_beat (90) / hollow_rare_beat (10) | Best not → pond_stones_01 |
| 13 | pond_stones_01 · signpost | The path edges a still pond, flat as glass. | Skip a stone · morale +1 → pond_stones_beat_01 | Keep going → whistle_valley_01 |
| 14 | cairn_topple_01 · cairn *(skip-stone branch only)* | A trail cairn has toppled at the bend. | Restack the stones · flag `restacked_cairn` → cairn_restacked_beat | Step around it → marker_read_01 |
| 15 | whistle_valley_01 · signpost *(keep-going branch only)* | The valley below has the shape of an echo. | Whistle into it → **weighted:** echo_beat (95) / echo_rare_beat (5) | Keep your breath → marker_read_01 |
| 16 | marker_read_01 · signpost | A weathered marker leans at the junction, letters half-worn. | Read it → marker_read_beat_01 | Walk past → bothy_door_01 |
| 17 | bothy_door_01 · signpost | A stone shelter sits off the path, door ajar. | Look inside · flag `signed_bothy` → bothy_beat | Leave it be → log_rest_01 |
| 18 | log_rest_01 · signpost | A mossy log sits at a bend, exactly bench-shaped. | Sit, sip, and watch a while · water −1, energy +1, morale +1 · **requires water ≥ 1** → dog_stile_01 | Keep a good rhythm going → dog_stile_01 |
| 19 | dog_stile_01 · signpost | A farm dog waits at the stile like it was expecting you. | Let it walk with you · morale +1 → dog_along_beat | Send it home → dog_home_beat |
| 20 | stars_clear_01 · signpost | The sky has gone impossibly clear. | Lie back a while → stars_beat | Keep to the trail → gate_01 |

## Per-node reference — beats & ending (trail order)

Linger beats have **no button** (the scene holds, then auto-advances);
the one card beat shows the hardcoded **"Walk on"** button — no
data-driven beat label exists. `landmark` is `null` (signpost fallback)
except where noted. Beats carry no effects (validator-enforced).

| id | linger ms | gapM | Prompt | next |
|---|---|---|---|---|
| butterfly_ride_beat | 3500 | 10 | For a little while, the pack has a passenger. | glove_fencepost_01 |
| butterfly_off_beat | 3000 | 10 | It lifts away on the next step, unbothered. | glove_fencepost_01 |
| glove_hung_beat | 3000 | 10 | It sits on the post like a small flag. Someone will find it. | fork_cairn_01 |
| vista_overlook_01 · signpost | 3500 | — | The trees open up. Below, the whole valley is holding still in the light. | painted_sign_01 |
| sign_vista_beat | 3500 | 10 | A gap in the trees, a small nameless view, exactly worth it. | stream_crossing_01 |
| coin_beat | 3000 | 10 | A bent old coin, older than the path. It goes in a pocket. | encounter_hiker_01 |
| fish_look_beat | 3500 | 10 | A fish rises, holds still, and looks at you for a long second before it's gone. | encounter_hiker_01 |
| litter_pocketed_beat | 3000 | 10 | The grass is just grass again. | sunset_pause_01 |
| pine_shelter_beat | 4000 | 10 | Rain on the canopy, dry shoulders, nowhere to be. | mist_valley_01 |
| rain_walk_beat | 3000 | 10 | The path darkens and shines. | mist_valley_01 |
| rainbow_beat | 4000 | 10 | And then, over the far hills — a rainbow, whole and unhurried. | mist_valley_01 |
| mist_wait_beat | 4000 | 10 | It slides by like slow water, and the trail reappears. | hollow_tree_01 |
| mist_walk_beat | 3500 | 10 | The world goes soft-edged and close. Even the footsteps sound wrapped in wool. | hollow_tree_01 |
| hollow_acorn_beat | 3000 | 10 | An acorn, smooth and cold. The tree keeps its other secrets. | pond_stones_01 |
| hollow_rare_beat | 4000 | 10 | Something soft — a feather, banded and bright, from no bird you've seen yet. | pond_stones_01 |
| pond_stones_beat_01 | 3000 | 10 | The stone skips once, twice — rings spreading out across the quiet. | cairn_topple_01 |
| cairn_restacked_beat | 3000 | 10 | Stone by stone, the little tower stands again. | marker_read_01 |
| echo_beat | 3000 | 10 | The note comes back thinner, twice. | marker_read_01 |
| echo_rare_beat | 4000 | 10 | The note comes back... with one note extra. Far off, something crosses the ridge. | marker_read_01 |
| marker_read_beat_01 | 3500 | 10 | 'Old Miller's Track — 2 miles.' Someone carved a small bird beneath it. | bothy_door_01 |
| bothy_beat | 3500 | 10 | A guestbook on the sill, half full of names. The hiker adds one and steps back into the light. | log_rest_01 |
| dog_along_beat | 3500 | 10 | It trots at heel for a while, then peels off home without a word, the way dogs do. | stars_clear_01 |
| dog_home_beat | 3000 | 10 | It sits, and watches you the whole way to the bend. | stars_clear_01 |
| stars_beat | 5000 | 10 | The dark fills up with stars the longer you look. | gate_01 |
| **gate_01** · signpost | *card — "Walk on"* | — | A wooden gate crosses the path, latched against the wind. | trail_end_01 |
| **trail_end_01** · cairn | *ending — "Begin a new trail"* | — | The path climbs one last rise and opens onto a quiet overlook. That's the trail for today. | (resets to start) |

gapM 10 means the beat's landmark spawns 10 walked meters after the tap
that chose it (~10 s to arrival including the ~3 s scroll-in; not
scaled by `?fast`). The ending resets distance + stats but NOT flags or
the journal, and returns to `start` (butterfly_pack_01).

## Engine-coded stops (not content nodes — but players hit them)

- **The lucky hat** (`meetHat`, Game.js): a rare trailside pickup that
  pauses the walk and shows a real two-option choice through the
  standard card UI — "A lucky hat, snagged on a bramble. Somehow it
  fits perfectly." → **"Wear it"** (opens the 1260 m boost window,
  shimmer stem fades in, hat visible on Wanda) / **"Leave it on the
  bramble"** (no effects; the hat recedes down the trail; the rare roll
  is spent either way — a declined hat never returns). Spawn odds:
  0.0026 per 10 walked meters (`?fast`: 0.4). The window's end is its
  own animated moment (`blowHatAway`) but not a stop.
- **Creature sighting** (`meetCreature`): the fox (odds 0.00005 bare /
  0.013 with hat per 10 m roll) pauses the walk, stings the audio,
  writes a first-sighting journal entry (date + biome tag of the
  current node), snapshots the canvas into a captioned Polaroid card
  with **Share** / **Walk on**. Deer and yeti exist only as journal
  `???` silhouettes — nothing spawns them yet.
- **The field journal** (tab, bottom-left) and saved-photo viewer pause
  the walk while open; **Camp** greets any return with a saved hike.

## Flags in use (all write-only — no read side yet)

| Flag | Set by |
|---|---|
| `hung_glove` | glove_fencepost_01 · "Hang it on the fencepost" |
| `trusted_sign` | painted_sign_01 · "Trust it" |
| `found_coin` | coin_stream_01 · "Fish it out" |
| `restacked_cairn` | cairn_topple_01 · "Restack the stones" |
| `signed_bothy` | bothy_door_01 · "Look inside" |

Flags persist across trails ("Begin a new trail" does not clear them)
and across sessions (saved in the `flags` object).

## Stats touched, by option

| Stat | +/− | Where |
|---|---|---|
| water | +2 | stream_crossing_01 A (refill) |
| water | −1 | log_rest_01 A (sip; gated: requires water ≥ 1) |
| energy | −1 | fork_cairn_01 A (high ridge) · stream_crossing_01 B (hop across) |
| energy | +1 | log_rest_01 A (rest) |
| morale | +1 | butterfly_pack_01 A · fork_cairn_01 A · encounter_hiker_01 A · sunset_pause_01 A · pond_stones_01 A · log_rest_01 A · dog_stile_01 A |

All three stats start at 3, clamp 0–5. log_rest_01 A is the only gated
option in the file. Every other option is a no-op on stats — the
world-texture stops deliberately pay off in beats and flags, not
numbers.
