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

## Polish, whenever

- HUD value pulse when a stat changes (canteen fills → water number blinks)
- Stream stop: splash one-shot (Session 7 audio list)
