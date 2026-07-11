# NOTES — ideas parked for later (not the current session)

## Art-pass: reactive poses for Wanda (Jimmy, after Session 6)

Stops currently all use the same standing pose. Pixel Lab has template
animations that match our existing stops, ~1 generation each (east only):

- `drinking` / `crouching` — filling or sipping the canteen at streams
- `picking-up` — the lucky hat pickup (and future item pickups)
- `breathing-idle` — a softer default stand for long pauses / camp
- sitting pose — the mossy-log rest (check template list for a fit)

Wire-up is small: play the pose instead of `wanda-stand` while the card is
open, keyed off the node/option (could be a `pose` field in content.json).

## Art-pass: making branches visible

Path choices read as invisible until biomes exist — the branch's payoff is
the scenery changing (forest → alpine, etc.). Optional extra: a "fork"
landmark set-piece where the trail visibly splits. Scenery-change is the
important half.

## Art-pass: per-biome lazy loading (from Session 8's list)

Deferred because placeholder art is painted in code — there's nothing to
stream yet. When real biome layer PNGs exist, load only the first biome +
Wanda up front and fetch later biomes during the walk (Phaser's loader can
run mid-scene). The service worker will cache them after first fetch.

## Parked from the world-texture session (11 July 2026)

TODO(parked) backlog — each is the deliberately-cut half of a stop that
shipped. Flags/weights below already exist in the data; these are their
future payoffs.

- **cairn_topple_01 B:** stepping around the toppled cairn later flavors
  the next junction's prompt (needs the flag READ side).
- **glove_fencepost_01:** the glove is gone from the fencepost on a later
  hike if you hung it (`hung_glove` — needs flag read side).
- **litter_packet_01 B:** tumbling-follower visual — the packet blows
  along the path with you for a stretch.
- **hollow_rare_beat:** wire the banded feather into the Session 6
  journal as a findable.
- **whistle_valley_01 / echo_rare_beat:** extra-note audio one-shot +
  distant-shape sprite crossing the ridge.
- **bothy_door_01:** guestbook that visibly fills across hikes
  (`signed_bothy` count, not just a boolean).
- **dog_stile_01 A:** follower sprite — the dog actually trots at heel.
- **butterfly_pack_01 A:** walk-speed softening + riding butterfly sprite
  while "walking gently".
- **mist_valley_01 B:** fog overlay + muffled audio filter inside the
  mist.
- **stars_clear_01 / stars_beat:** future home of the shooting-star rare
  roll; condition the whole stop on time-of-day once the day-wash phase
  is readable by content/engine decisions (ENGINE-STATE §8).
- **painted_sign_01 A:** a real detour segment once a spine exists
  (`trusted_sign` flag already set).
- **Engine — flags read side:** conditional prompts and flag-based
  requires; every flag above is write-only until this lands.
- **Engine — weights:** all weighted-next numbers are placeholders; real
  rarity tuning is Session 6.
- **Engine — gapM feel:** follow-up beats land ~10s after the tap at
  gapM 10 (7s walk + ~3s landmark scroll-in). If that should feel more
  immediate, drop gapM to ~1–3 (scroll-in sets a ~3s floor).

## Parked from spine build session 1 (11 July 2026)

Session 2 of the spine build — the real dealer, replacing spine.js's
FIXED_ORDER stub. Everything below has its data already in place
(segments manifest, save shape, world-timer ticks):

- **Stitching rules 1–6** (SEGMENT-TABLE.md): setting gate, wet blocks
  clear-needers, self-exclusion, held-out sky segments, no-two-heavies,
  frequency semantics (once_per_hike + no back-to-back + recency
  penalty, N≈5).
- **The skeleton**: fixed opener (butterfly), early fork slot, shuffled
  middle sized by `targetDeals` (the duration dial), reserved stars
  closing slot, fixed gate ending.
- **Setting-advance policy** — the virtual setting must rotate or the
  setting gate starves the deck (deadlock risk noted in recon).
- **Deck-exhaustion relaxation order** — decide before rules go live:
  relax recency first, then setting, never once_per_hike; the ending
  must always stay reachable ("no legal deal" would be a crash).
- **Creature journal biome tag** — meetCreature reads the upcoming
  node's `biome`; move it to the spine's virtual setting when that
  becomes the scenery authority.
- **Trail-cycling rare farm** — once_per_hike resets per trail, so
  short-hike cycling can farm the feather/echo rares; note for the
  Session 6 rarity pass.

## Polish, whenever

- HUD value pulse when a stat changes (canteen fills → water number blinks)
- Stream stop: splash one-shot (Session 7 audio list)
