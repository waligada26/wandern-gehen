# CONTENT INVENTORY — read-only report

**Last verified: 11 July 2026** (chapter-close handover; content
unchanged since the spine sessions), against the live
`src/game/content.json`, Game.js, and spine.js. Validator at load:
**46 nodes in 20 segments, full coverage, 42 `@exit` pointers, and
exactly ONE intentional warning** (7 repeatable deck segments < max
targetDeals 14 — the authoring signal, see "How the trail flows").
Regenerate after content changes.

## Summary counts

| Kind | Count |
|---|---|
| choice | 20 |
| beat — linger (buttonless, auto-advance) | 24 |
| beat — card (hardcoded "Walk on") | 1 (gate_01) |
| ending | 1 (trail_end_01) |
| **total nodes** | **46** |
| **segments** | **20** (manifest in content.json; spec in SEGMENT-TABLE.md) |
| creatures | 3 — fox (spawnable), deer, yeti (silhouettes) |

`trigger` decorative; `biome` journal-tag only ("forest" everywhere).

## How the trail flows now — the dealer

Nodes chain **inside** a segment with literal `next` pointers; a
`"next": "@exit"` leaves the segment and the **spine's dealer**
(spine.js) picks what comes next. **There is no fixed order anymore.**
Every hike is:

1. **Opener** — seg_butterfly (the `start` node).
2. **The early fork** — seg_fork_vista slotted at deal position 2 or 3
   (rolled per trail, saved).
3. **The dealt middle** — drawn from the 16-segment deck until the
   trail's `targetDeals` (8–14, avg-of-two-rolls; THE duration dial)
   is reached, under SEGMENT-TABLE's rules: once_per_hike spent, no
   back-to-back, recency-penalized repeats, setting gate vs the
   spine's virtual setting, sky gates (rain needs clear; wet lasts 3
   stops, mist 2), heavies only ever touch light.
4. **The ending** — seg_gate_ending, with one light buffer first if
   the previous deal wasn't light. Deck exhaustion deals the ending
   early (a short hike, never a crash).

seg_sunset and seg_stars are **held out** (need time-of-day). Hike
length now varies per deal — roughly 15–30 stops depending on
targetDeals and branches. Expect **one standing validator warning** at
load: only 7 of 16 deck segments are repeatable (every_hike_ok), below
max targetDeals 14 — an authoring signal to write more repeatable
segments, not a bug.

## Segments (the manifest)

All follow-up beats inside segments carry `gapM: 10` (~10 s arrival);
entries never carry gapM (validated) so boundaries use the normal
30–90 s roll. `needs`/`sets`/`weight`/`frequency`/`heldOut` are inert
data until session 2's dealer.

| segment | entry | members | weight | needs | sets | frequency | notes |
|---|---|---|---|---|---|---|---|
| seg_butterfly | butterfly_pack_01 | 3 | light | any | — | every_hike_ok | skeleton: **opening** (= `start`) |
| seg_glove | glove_fencepost_01 | 2 | light | farmland | — | once_per_hike | sets flag hung_glove |
| seg_fork_vista | fork_cairn_01 | 2 | medium | valley | — | once_per_hike | |
| seg_painted_sign | painted_sign_01 | 2 | light | woodland | — | once_per_hike | sets flag trusted_sign |
| seg_stream_coin | stream_crossing_01 | 4 | medium | water | — | every_hike_ok | flag found_coin; exit inside a weighted next |
| seg_hiker | encounter_hiker_01 | 1 | light | any | — | every_hike_ok | |
| seg_litter | litter_packet_01 | 2 | light | any | — | every_hike_ok | |
| seg_sunset | sunset_pause_01 | 1 | light | any + sky goldenhour | — | once_per_hike | **heldOut** (inert this session) |
| seg_rain | rain_shower_01 | 4 | light | any + sky clear | wet ×3 stops | every_hike_ok | |
| seg_mist | mist_valley_01 | 3 | light | valley | misty ×2 stops | every_hike_ok | |
| seg_hollow | hollow_tree_01 | 3 | light | woodland | — | once_per_hike | 90/10 acorn/feather |
| seg_pond | pond_stones_01 | 2 | light | water | — | every_hike_ok | |
| seg_cairn_topple | cairn_topple_01 | 2 | light | any | — | once_per_hike | flag restacked_cairn |
| seg_whistle | whistle_valley_01 | 3 | light | valley | — | once_per_hike | 95/5 echo/extra-note |
| seg_marker | marker_read_01 | 2 | light | any | — | once_per_hike | |
| seg_bothy | bothy_door_01 | 2 | medium | open | — | once_per_hike | flag signed_bothy |
| seg_log_rest | log_rest_01 | 1 | medium | woodland | — | every_hike_ok | only `requires` gate |
| seg_dog | dog_stile_01 | 3 | heavy | farmland | — | once_per_hike | |
| seg_stars | stars_clear_01 | 2 | medium | any + sky night, clear | — | once_per_hike | **heldOut**; skeleton: closing |
| seg_gate_ending | gate_01 | 2 | heavy | any | — | once_per_hike | skeleton: **ending**; no @exit — terminal |

## Per-node reference — choices (deal order)

"→ @exit" = leaves the segment (spine deals the next one). Blank
effects = `{}`.

| # | id · landmark | Prompt | Option A | Option B |
|---|---|---|---|---|
| 1 | butterfly_pack_01 · signpost | A butterfly lands on the hiker's pack and stays. | Walk gently · morale +1 → butterfly_ride_beat | Carry on as normal → butterfly_off_beat |
| 2 | glove_fencepost_01 · signpost | A knitted glove lies on the path, still holding its shape. | Hang it on the fencepost · flag hung_glove → glove_hung_beat | Walk past → @exit |
| 3 | fork_cairn_01 · cairn | The trail splits at a cairn. | Take the high ridge · energy −1, morale +1 → vista_overlook_01 | Follow the low path → @exit |
| 4 | painted_sign_01 · signpost | A hand-painted sign points off-trail: 'worth it — 5 min.' | Trust it · flag trusted_sign → sign_vista_beat | Stay on the path → @exit |
| 5 | stream_crossing_01 · stream | A shallow stream chatters across the path. | Stop and refill the canteen · water +2 → coin_stream_01 | Hop across and press on · energy −1 → coin_stream_01 |
| 6 | coin_stream_01 · stream | Something glints under the current. | Fish it out · flag found_coin → coin_beat | Let the water keep it → **weighted:** @exit (90) / fish_look_beat (10) |
| 7 | encounter_hiker_01 · signpost | Another walker comes the other way, pack worn soft with miles. | Say hello · morale +1 → @exit | Nod and pass → @exit |
| 8 | litter_packet_01 · signpost | A crisp packet turns over and over in the grass. | Pocket it → litter_pocketed_beat | Leave it turning → @exit |
| 9 | sunset_pause_01 · signpost | The light has gone long and golden behind the treeline. | Stop and watch a while · morale +1 → @exit | Walk on through the gold → @exit |
| 10 | rain_shower_01 · signpost | Rain starts, soft and warm, the kind that doesn't mean it. | Shelter under the pine → pine_shelter_beat | Walk on through it → **weighted:** rain_walk_beat (85) / rainbow_beat (15) |
| 11 | mist_valley_01 · signpost | Mist is rolling up from the valley floor. | Wait for it to pass → mist_wait_beat | Walk into it → mist_walk_beat |
| 12 | hollow_tree_01 · signpost | An old oak has a hollow at shoulder height, dark inside. | Reach in → **weighted:** hollow_acorn_beat (90) / hollow_rare_beat (10) | Best not → @exit |
| 13 | pond_stones_01 · signpost | The path edges a still pond, flat as glass. | Skip a stone · morale +1 → pond_stones_beat_01 | Keep going → @exit |
| 14 | cairn_topple_01 · cairn | A trail cairn has toppled at the bend. | Restack the stones · flag restacked_cairn → cairn_restacked_beat | Step around it → @exit |
| 15 | whistle_valley_01 · signpost | The valley below has the shape of an echo. | Whistle into it → **weighted:** echo_beat (95) / echo_rare_beat (5) | Keep your breath → @exit |
| 16 | marker_read_01 · signpost | A weathered marker leans at the junction, letters half-worn. | Read it → marker_read_beat_01 | Walk past → @exit |
| 17 | bothy_door_01 · signpost | A stone shelter sits off the path, door ajar. | Look inside · flag signed_bothy → bothy_beat | Leave it be → @exit |
| 18 | log_rest_01 · signpost | A mossy log sits at a bend, exactly bench-shaped. | Sit, sip, and watch a while · water −1, energy +1, morale +1 · requires water ≥ 1 → @exit | Keep a good rhythm going → @exit |
| 19 | dog_stile_01 · signpost | A farm dog waits at the stile like it was expecting you. | Let it walk with you · morale +1 → dog_along_beat | Send it home → dog_home_beat |
| 20 | stars_clear_01 · signpost | The sky has gone impossibly clear. | Lie back a while → stars_beat | Keep to the trail → @exit |

## Per-node reference — beats & ending

All linger (buttonless, auto-advance), `landmark: null` (signpost
fallback), `gapM: 10`, `next: @exit` — **except** vista_overlook_01
(signpost landmark, no gapM), gate_01 (card beat, "Walk on",
→ trail_end_01), and trail_end_01 (ending).

| id | linger ms | Prompt |
|---|---|---|
| butterfly_ride_beat | 3500 | For a little while, the pack has a passenger. |
| butterfly_off_beat | 3000 | It lifts away on the next step, unbothered. |
| glove_hung_beat | 3000 | It sits on the post like a small flag. Someone will find it. |
| vista_overlook_01 | 3500 | The trees open up. Below, the whole valley is holding still in the light. |
| sign_vista_beat | 3500 | A gap in the trees, a small nameless view, exactly worth it. |
| coin_beat | 3000 | A bent old coin, older than the path. It goes in a pocket. |
| fish_look_beat | 3500 | A fish rises, holds still, and looks at you for a long second before it's gone. |
| litter_pocketed_beat | 3000 | The grass is just grass again. |
| pine_shelter_beat | 4000 | Rain on the canopy, dry shoulders, nowhere to be. |
| rain_walk_beat | 3000 | The path darkens and shines. |
| rainbow_beat | 4000 | And then, over the far hills — a rainbow, whole and unhurried. |
| mist_wait_beat | 4000 | It slides by like slow water, and the trail reappears. |
| mist_walk_beat | 3500 | The world goes soft-edged and close. Even the footsteps sound wrapped in wool. |
| hollow_acorn_beat | 3000 | An acorn, smooth and cold. The tree keeps its other secrets. |
| hollow_rare_beat | 4000 | Something soft — a feather, banded and bright, from no bird you've seen yet. |
| pond_stones_beat_01 | 3000 | The stone skips once, twice — rings spreading out across the quiet. |
| cairn_restacked_beat | 3000 | Stone by stone, the little tower stands again. |
| echo_beat | 3000 | The note comes back thinner, twice. |
| echo_rare_beat | 4000 | The note comes back... with one note extra. Far off, something crosses the ridge. |
| marker_read_beat_01 | 3500 | 'Old Miller's Track — 2 miles.' Someone carved a small bird beneath it. |
| bothy_beat | 3500 | A guestbook on the sill, half full of names. The hiker adds one and steps back into the light. |
| dog_along_beat | 3500 | It trots at heel for a while, then peels off home without a word, the way dogs do. |
| dog_home_beat | 3000 | It sits, and watches you the whole way to the bend. |
| stars_beat | 5000 | The dark fills up with stars the longer you look. |
| **gate_01** · signpost | *card — "Walk on"* | A wooden gate crosses the path, latched against the wind. → trail_end_01 |
| **trail_end_01** · cairn | *ending* | The path climbs one last rise and opens onto a quiet overlook. That's the trail for today. |

The ending resets distance + stats + per-hike spine state, keeps flags
and journal, and returns to `start` (butterfly_pack_01).

## Engine-coded stops (not content nodes)

Unchanged: the **lucky hat** (`meetHat` — real two-option choice, roll
spent either way), **creature sighting** (`meetCreature` — fox →
journal + Polaroid; deer/yeti silhouettes only), the **field journal**
tab and **Camp**. Interrupts bypass the spine entirely — they never
touch `currentId` and don't tick world-state timers.

## Flags & stats

Flags (write-only, cross-trail): hung_glove, trusted_sign, found_coin,
restacked_cairn, signed_bothy — same setters as before. Stats touched:
water +2 (stream A) / −1 (log A, gated water ≥ 1); energy −1 (fork A,
stream B) / +1 (log A); morale +1 (butterfly A, fork A, hiker A,
sunset A, pond A, log A, dog A). All start 3, clamp 0–5.
