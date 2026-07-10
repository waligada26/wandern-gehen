# HANDOVER — state of the repo as of 10 July 2026 (Session 9)

Sessions 1–8 plus tonight's Session 9 are committed and pushed
(https://waligada26.github.io/wandern-gehen/). **Nothing from Session 9 has
been verified on a phone yet** — that's the first job next session.

## Done this session (all in the code, all pushed)

- **Linger beats (engine).** A beat node with a `"linger": { "ms", "tint" }`
  object plays a held scene moment instead of a card: scroll eases to zero
  over ~0.5s via a `scrollScale` factor, the prompt fades in as a buttonless
  caption, an optional tint overlays at ~0.25 alpha, it holds `ms` (default
  3000), reverses, and auto-advances to `next`. Effects apply when the hold
  begins. `scrollScale` multiplies every world speed AND the distance step,
  so the clock, hat window, and rare dice all pause with the scenery.
- **Day/night wash (engine).** Persistent full-scene overlay at depth 15
  (above world/Wanda ≤11, under HUD 20, linger tint 90, cards 100), lerped
  through `DAY_PALETTE` by `distanceM`. One day per `DAY_CYCLE_M` = 840 m
  (~10 min walking). Alpha hard-capped at `DAY_WASH_MAX_ALPHA` 0.35 so night
  stays readable. New trails start at dawn (distance resets to 0).
- **Biome palettes (engine) — LANDED, not pending.** `BIOME_PALETTES` (six
  biomes × fg/mid/far) retint the three parallax bands via `setTint`; the
  band textures are now painted white/gray so the tint IS the colour (a
  multiply-tint can't brighten a pre-coloured texture). Distance-cycled:
  `BIOME_LENGTH_M` = 1500 m per biome, `BIOME_FADE_M` = 18 m (~13 s)
  crossfade finishing exactly at each boundary, looping forest → meadow →
  coast → wetland → alpine → snow. Composites UNDER the wash and linger
  tints. Built clean and watched on the dev server; not yet seen on phone.
- **Content: four new stops, trunk rewired.** Six new nodes total (four
  stops + two linger-payoff beats) spliced into the shared trunk after the
  stream. Verified zero orphans, zero dangling pointers (12/12 reachable).
- **CONTENT-INVENTORY.md regenerated** to match (documents the `linger`
  field and the biome-palette reality note).

## The trail now (12 stops longest, 9 shortest)

fork_cairn_01 → [high: vista_overlook_01 (linger 3500)] → stream_crossing_01
→ encounter_hiker_01 → sunset_pause_01 → pond_stones_01 [Skip a stone →
pond_stones_beat_01 (linger 3000)] → marker_read_01 [Read it →
marker_read_beat_01 (linger 3500)] → log_rest_01 → gate_01 → trail_end_01

## Engine reality checks (carry these forward)

- `trigger` is decorative — the engine distance-spaces every stop and never
  reads the field.
- **No distance cap anywhere in Game.js** — the node graph is the sole
  authority on where a trail ends (`type: "ending"`).
- Beat `behavior`/`setpiece` fields are NOT implemented. A beat shows a
  "Walk on" card, or a held linger if it has a `linger` object. That's it.
- The lucky-hat pickup and the fox/polaroid/journal flow are hardcoded in
  Game.js, outside the content graph. Fixed labels: "Walk on", "Begin a new
  trail", "Wear it".
- State keys `water`/`energy`/`morale`: start 3, clamp 0–5. `distance` is
  the clock (`distanceM`), NOT an effects key.
- A node's `biome` field only tags journal entries and photo captions — the
  scenery's biome palette cycles by walked distance (`BIOME_LENGTH_M`),
  independent of the graph. Tying palette to the fork is a candidate next
  task, not current behavior.

## Tunables added this session (all near the top of Game.js)

`DAY_CYCLE_M` (840), `DAY_PALETTE` (stops around the 0..1 day loop),
`DAY_WASH_MAX_ALPHA` (0.35), `BIOME_PALETTES` (6 × fg/mid/far),
`BIOME_LENGTH_M` (1500), `BIOME_FADE_M` (18). `?fast` compresses landmark
gaps, the day cycle, and biome length 10× and boosts rare rolls.

## NEXT TASKS (in order)

1. **Verify the whole session on a real phone** — nothing since the Session 8
   push has been confirmed on-device: lingers, day/night wash, biome
   crossfades, new trail order, and the still-untested iPhone audio fix
   (`navigator.audioSession.type = 'playback'`). PWA caveat: the service
   worker may serve the cached old build on first open — close fully and
   reopen to get the new one.
2. Then decide between: **(a)** tying biome changes to the fork choice
   instead of distance, vs **(b)** a proper "sit and linger" that plays on
   the walk screen at the mossy log (see NOTES.md for the pose-art plan).
3. Music is a few days out — Jimmy composes stems in his DAW, then they're
   wired via Tone.js to replace the placeholder synth stems.

## Open items

- iPhone audio still unresolved (fix deployed, untested on the phone).
- Stray repo `caniplantit42/wandern-gehen` still awaiting manual deletion in
  the browser (wrong account, Session 1 mishap). Never touch that account.
- Real audio stems and the Pixel Lab art pass remain the two big parallel
  tracks; placeholders fill every slot until the game is proven fun.
- Ending reset snaps scenery back to forest-at-dawn behind the ending card
  (distance → 0). Acceptable placeholder; flag if it should fade.
- `CONTENT-INVENTORY.md` matches the current file; regenerate after content
  changes. Working tree is clean after this session's final commit.
