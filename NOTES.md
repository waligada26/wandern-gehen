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

## Parked after the dealer landed (11 July 2026, spine session 2)

The dealer (rules 1–7, skeleton, targetDeals, setting ring, exhaustion
ladder) is DONE — spine.js. Still parked:

- **Time-of-day read side** — the small session that brings seg_sunset
  and seg_stars back: expose the day-wash phase, gate their sky needs,
  and fill stars' reserved closing slot (TODO comment in spine.js
  pickDeal).
- **Virtual setting drives scenery** — the locked end-state: the
  spine's setting replaces the meter-based biome palette cycle as the
  one authority on where you are. Until then the tint and the tags can
  disagree (placeholder art hides it).
- **Creature journal biome tag** — meetCreature still reads the
  upcoming node's `biome`; move to the spine's virtual setting when it
  becomes the authority.
- **Per-exit successors** — revisit trigger unchanged (SEGMENT-TABLE
  REWIRING NOTES): build when a segment's point is divergent futures.
- **Session 6 rarity pass** — weighted-next placeholder numbers, the
  trail-cycling rare farm (once_per_hike resets each trail), and hat
  odds all tune together.
- **More every_hike_ok segments** — the standing validator warning (7
  repeatable < 14 max targetDeals) is the authoring backlog: long
  hikes lean on repeats until the repeatable pool grows.

## Polish, whenever

- HUD value pulse when a stat changes (canteen fills → water number blinks)
- Stream stop: splash one-shot (Session 7 audio list)
