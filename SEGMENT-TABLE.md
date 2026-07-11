# SEGMENT-TABLE — planning artifact for the procedural spine

> **PROPOSAL — tags and groupings pending human review. The spine does
> not exist yet (ENGINE-STATE §3/§6); this doc plans it.**

Derived 11 July 2026 from the live `src/game/content.json` (commit
`cc79df4`, 46 nodes) by walking the actual next-pointer graph. A
**segment** is a hand-authored chain whose internal next pointers are
sacred; the future stitcher only ever decides which segment follows
which. Nothing in this doc changes code or content.

**Conventions**

- **stops** = stops the player experiences inside the segment
  (min–max across its branches), not member-node count.
- **entry** = the node the stitcher points predecessors at.
  **exits** = every next pointer that leaves the segment (these are
  the pointers the stitcher will own; see REWIRING NOTES).
- Every judgment call is marked ⚠️.

**Tag vocabulary (proposed)**

- *Setting*: `water` · `valley` (a drop/view below the trail) ·
  `woodland` · `open` (moor/heath/hilltop) · `farmland` (fences,
  stiles, gates) · `any`. Only tagged where the PROSE requires it.
- *Sky/world-state*: `clear` · `wet` · `misty` · `goldenhour` ·
  `night`. `wet`/`misty` are stitcher-tracked states that segments SET;
  `clear` means "no wet/misty active". `goldenhour`/`night` are
  **parked** — time-of-day is unreadable by content/engine decisions
  (ENGINE-STATE §8).
- ⚠️ Setting availability itself is future work: scenery biome cycles
  by walked meters and is equally unreadable. Proposal: the stitcher
  OWNS a virtual setting state it advances as it deals segments, rather
  than reading the screen. Pending review.

## The segments (20 segments · 46 nodes)

| segment id | member nodes (entry→exit) | stops | weight | needs | sets | frequency | notes/uncertainties |
|---|---|---|---|---|---|---|---|
| seg_butterfly | **butterfly_pack_01** → butterfly_ride_beat \| butterfly_off_beat → *out* | 2 | light | any | — | every_hike_ok | Natural opener (current `start`). Both branches beat — safe before anything. |
| seg_glove | **glove_fencepost_01** → glove_hung_beat → *out*; opt B → *out* | 1–2 | light | farmland ⚠️ | — | once_per_hike ⚠️ | Fencepost implies field boundary — tag is a judgment call. Once/hike: a second identical glove would read as a glitch. Sets `hung_glove` flag (payoff parked). |
| seg_fork_vista | **fork_cairn_01** → vista_overlook_01 → *out*; opt B (low path) → *out* | 1–2 | medium | valley ⚠️ | — | once_per_hike | The structural fork; vista needs a drop below. ⚠️ In a shuffled world both exits converge on the same successor, so "high vs low" becomes a scenic detour, not a route — skeleton candidate (see SKELETON). |
| seg_painted_sign | **painted_sign_01** → sign_vista_beat → *out*; opt B → *out* | 1–2 | light | woodland | — | once_per_hike ⚠️ | "Gap in the trees" needs trees. Sets `trusted_sign`. Currently high-branch only; as a segment it becomes generally placeable ⚠️. |
| seg_stream_coin | **stream_crossing_01** → coin_stream_01 → coin_beat \| (90/10) fish_look_beat → *out* | 2–3 | medium | water | — | every_hike_ok | Coin only makes sense beside the stream — bound by rule 1. The resource stop (water +2 / energy −1). ⚠️ coin B's weighted array mixes an OUTWARD exit (90) with an internal beat (10) — see REWIRING. |
| seg_hiker | **encounter_hiker_01** → *out* (both options) | 1 | light | any | — | every_hike_ok | Different walkers can recur. |
| seg_litter | **litter_packet_01** → litter_pocketed_beat → *out*; opt B → *out* | 1–2 | light | any ⚠️ | — | every_hike_ok | "In the grass" — grass is everywhere; `open` would over-restrict. |
| seg_sunset | **sunset_pause_01** → *out* (both options) | 1 | light | goldenhour ⚠️ *(parked)* | — | once_per_hike | Two sunsets per hike is absurd. Truly needs time-of-day; until then it plays incoherently (as today) or sits out ⚠️. |
| seg_rain | **rain_shower_01** → pine_shelter_beat \| (85/15) rain_walk_beat \| rainbow_beat → *out* | 2 | light | clear ⚠️, woodland ⚠️ | wet ~3 stops ⚠️ | every_hike_ok | "Rain starts" while already wet reads wrong → needs clear. Pine branch needs a tree → woodland (⚠️ maybe over-strict; a lone pine works anywhere). Duration is a guess. |
| seg_mist | **mist_valley_01** → mist_wait_beat \| mist_walk_beat → *out* | 2 | light | valley | misty ~2 stops ⚠️ | every_hike_ok | Mist AFTER rain is natural (current trail order) — deliberately no clear requirement. Self-excludes while misty active (see rules). |
| seg_hollow | **hollow_tree_01** → (90/10) hollow_acorn_beat \| hollow_rare_beat → *out*; opt B → *out* | 1–2 | light | woodland | — | once_per_hike ⚠️ | The same old oak twice would deflate the 10% feather. |
| seg_pond | **pond_stones_01** → pond_stones_beat_01 → *out*; opt B → *out* | 1–2 | light | water | — | every_hike_ok | ⚠️ Today pond's two options lead to DIFFERENT segments (cairn_topple vs whistle) — see the per-exit successor question in REWIRING. |
| seg_cairn_topple | **cairn_topple_01** → cairn_restacked_beat → *out*; opt B → *out* | 1–2 | light | any | — | every_hike_ok ⚠️ | Cairns are common trail furniture, but restacking twice a hike may feel repetitive — could argue once_per_hike. Sets `restacked_cairn`. |
| seg_whistle | **whistle_valley_01** → (95/5) echo_beat \| echo_rare_beat → *out*; opt B → *out* | 1–2 | light | valley | — | once_per_hike ⚠️ | The 5% "one note extra" mystery shouldn't be farmable within a hike. |
| seg_marker | **marker_read_01** → marker_read_beat_01 → *out*; opt B → *out* | 1–2 | light | any | — | once_per_hike ⚠️ | Hint/payoff pair (prose is a promise). The payoff names "Old Miller's Track" — a second identical marker breaks it. |
| seg_bothy | **bothy_door_01** → bothy_beat → *out*; opt B → *out* | 1–2 | medium ⚠️ | open ⚠️ | — | once_per_hike | Stone shelter reads as moor/hill country. Medium for character density, not stakes ⚠️. Sets `signed_bothy` (guestbook payoff parked). |
| seg_log_rest | **log_rest_01** → *out* (both options) | 1 | medium | woodland ⚠️ | — | every_hike_ok | The resource-management stop (only `requires` gate in the file). Mossy log suggests damp woods ⚠️. |
| seg_dog | **dog_stile_01** → dog_along_beat \| dog_home_beat → *out* | 2 | heavy ⚠️ | farmland | — | once_per_hike | Heavy by emotional size, zero stakes ⚠️ — the strongest character moment in the deck; per the brief, once per hike. |
| seg_stars | **stars_clear_01** → stars_beat → *out*; opt B → *out* | 1–2 | medium ⚠️ | night ⚠️ *(parked)*, clear | — | once_per_hike | Truly needs night + clear sky; both parked until time-of-day exists. Future home of the shooting-star roll (NOTES.md). Late-hike placement suggested (see SKELETON) ⚠️. |
| seg_gate_ending | **gate_01** → trail_end_01 *(ENDING — terminal)* | 2 | heavy | any ⚠️ | — | skeleton: exactly once, last | **The ending approach.** Gate is farmland furniture but demanding `farmland` would constrain every hike's final biome ⚠️. No exits — trail_end_01 resets to `start`. |

**Count reconciliation:** 3+2+2+2+4+1+2+1+4+3+3+2+2+3+2+2+1+3+2+2 =
**46 member nodes = 46 nodes in CONTENT-INVENTORY.md.** Every node in
exactly one segment. `rare` frequency: unused — rarity currently lives
*inside* segments as weighted rolls, which is where GAME-DESIGN wants it.

## STITCHING RULES (each traceable to a tag)

1. **Setting gate** (`needs` setting tags): a segment may only be dealt
   where its setting is available; `any` goes anywhere. Requires the
   stitcher-owned virtual setting state proposed in the header ⚠️.
2. **Wet blocks clear-needers** (`sets: wet` + `needs: clear`): while
   wet is active (~3 stops after seg_rain), seg_rain and seg_stars may
   not start. Mist is deliberately NOT blocked by wet.
3. **Self-exclusion** (`sets`): a segment may not be dealt while the
   state it sets is still active (no mist rolling in during mist).
4. **Parked sky states** (`goldenhour`, `night` + ENGINE-STATE §8):
   seg_sunset and seg_stars can't have their needs honored until the
   day-wash phase is readable. Until then: either hold them out of the
   deck or accept the incoherence the current game already has ⚠️
   (human call).
5. **No two heavies adjacent** (`weight`): heavy segments (seg_dog,
   seg_gate_ending) never touch; per GAME-DESIGN's interleaving, prefer
   ≥1 light segment between any two medium-or-heavier.
6. **Frequency** (`frequency`): once_per_hike segments appear at most
   once per trail; every_hike_ok segments may repeat but not
   back-to-back ⚠️ (the "not back-to-back" half is proposed semantics,
   not yet a tag — flagging rather than inventing silently).
7. **The walking floor stays** (GAME-DESIGN → Timing; ENGINE-STATE §3):
   between segments the stitcher must leave the normal 30–90 s gap
   roll alone; `gapM` fast-arrivals are internal to segments only.
8. **Interrupts fire anywhere** (appendix below): the stitcher needs no
   rules for them — the engine already suppresses rare rolls during
   cards and lingers.

No other rules proposed; anything further should earn a tag first.

## REWIRING NOTES (flagged only — nothing changed)

By construction, **every terminal exit pointer currently hardcodes the
historical trunk order** — all of these become stitcher-owned when the
spine lands:

- seg_butterfly: butterfly_ride_beat.next, butterfly_off_beat.next (→ glove)
- seg_glove: opt B next, glove_hung_beat.next (→ fork)
- seg_fork_vista: vista_overlook_01.next (→ painted_sign), fork opt B next (→ stream)
- seg_painted_sign: opt B next, sign_vista_beat.next (→ stream)
- seg_stream_coin: coin_beat.next, fish_look_beat.next, **and the id
  inside coin opt B's weighted array (90 → encounter_hiker_01)** —
  the one exit that lives inside a weighted next ⚠️
- seg_hiker: both option nexts (→ litter)
- seg_litter: opt B next, litter_pocketed_beat.next (→ sunset)
- seg_sunset: both option nexts (→ rain)
- seg_rain: pine_shelter_beat.next, rain_walk_beat.next, rainbow_beat.next (→ mist)
- seg_mist: mist_wait_beat.next, mist_walk_beat.next (→ hollow)
- seg_hollow: opt B next, hollow_acorn_beat.next, hollow_rare_beat.next (→ pond)
- seg_pond: pond_stones_beat_01.next (→ cairn_topple), opt B next (→ whistle)
- seg_cairn_topple: opt B next, cairn_restacked_beat.next (→ marker)
- seg_whistle: opt B next, echo_beat.next, echo_rare_beat.next (→ marker)
- seg_marker: opt B next, marker_read_beat_01.next (→ bothy)
- seg_bothy: opt B next, bothy_beat.next (→ log)
- seg_log_rest: both option nexts (→ dog)
- seg_dog: dog_along_beat.next, dog_home_beat.next (→ stars)
- seg_stars: opt B next, stars_beat.next (→ gate)
- seg_gate_ending: none (terminal)

⚠️ **Open design question — one successor per segment, or per exit?**
Today seg_pond's two options reach *different* segments (cairn_topple
vs whistle) — the only place an option changes your downstream future.
A v1 stitcher with a single successor per segment collapses that (both
exits → same next segment); per-exit successors preserve it at real
complexity cost. Recommendation: v1 single-successor, accept the loss,
revisit when a segment is authored whose whole point is divergent
futures. Pending review.

## SKELETON (placeholder for a design conversation)

Preserve an authored arc around a shuffled middle: a hike should open
gently, wander through the deck, and close deliberately — GAME-DESIGN's
"compose the rhythm" applied at segment scale.

- **Opening (fixed):** seg_butterfly — a soft, zero-stakes hello; it's
  already the trail's `start`.
- **Early structural beat (fixed, position 2–3):** seg_fork_vista ⚠️ —
  the fork feels like it belongs near the top of a hike; keeping it in
  the skeleton also sidesteps its converging-exits awkwardness for now.
- **Middle (shuffled):** everything else — 16 segments dealt against
  the STITCHING RULES to a target length (suggest ~8–14 middle stops,
  matching today's 24–36-stop trail ⚠️ tune by feel).
- **Closing approach (fixed, last-before-ending slot):** seg_stars when
  night exists ⚠️ (a sky full of stars is a natural wind-down) — until
  then leave the slot empty.
- **Ending (fixed, always last):** seg_gate_ending.

## APPENDIX — interrupt stops (not segments)

Engine-coded moments the stitcher must tolerate between any two stops;
they never touch `currentId`, so segment order is unaffected:

- **The lucky hat** (`meetHat`) — rare pickup, two-option card.
- **Creature sighting** (`meetCreature`) — fox → journal + Polaroid.
- **Hat blow-away** (`blowHatAway`) — animated, doesn't pause the walk.
- The **field journal** and **Camp** pause/resume around everything.
