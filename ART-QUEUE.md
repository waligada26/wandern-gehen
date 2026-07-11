# ART-QUEUE — the art pass, one line at a time

One ordered list of every asset slot in the game, worked strictly top
to bottom. **No time-boxing** — progress is positional: the queue knows
what's done and what's next, and doesn't care whether an item took five
minutes or three evenings. This doc supersedes the "art pass" sketch at
the end of BUILD-SESSIONS.md.

## Standing rules

- Every asset generates against the **locked style reference** (created
  at GATE 1). Consistency beats cleverness; reject freely.
- An item is **DONE when it's in the game, on the phone, in its slot** —
  generated-but-not-wired doesn't count. Every slot already runs on a
  placeholder, so each item is a drop-in swap. Items marked **†** are
  the exception: no engine slot exists yet — art plus a small wiring
  addition (flagged per item; each is fox-sized code, not a system).
- **Art geography = the dealer's five settings** (woodland, water,
  valley, farmland, open) — this SUPERSEDES ART-STYLE.md's older
  six-biome list (forest/meadow/alpine/coast/wetland/snow). Snow, coast
  etc. can join the queue's tail later if content earns them.
- **Hiker is 64×64**; every asset shares that pixel density
  (ART-STYLE.md → Pixel density). Whole-number scene scaling only.
- **Credits are a pause, not a plan**: if generations run out
  mid-queue, stop; resume at the same line when they refresh.
- Statuses: `[ ]` todo · `[~]` generating/iterating · `[x]` in-game.
- Practical craft notes go in **LEARNINGS** at the bottom as they're
  discovered — future items benefit from earlier scars.

---

## GATE 0 — PIPELINE SMOKE TEST

- [x] **G0**: one throwaway sprite via the Pixel Lab MCP from Claude
  Code → lands as a PNG in `public/assets/` → loads and renders in
  Phaser on the dev server. Any subject; it will be deleted.
  **Nothing below starts until this passes.**
  *(Passed 11 Jul 2026 — a 64×64 mushroom via `create_map_object`,
  seen rendering on screen in the dev server by Jimmy; sprite and
  temp code deleted after verification. See LEARNINGS.)*

## GATE 1 — STYLE LOCK

- [x] **G1**: **the hiker (Wanda)** — 64×64, right-facing only:
  8-frame walk cycle (512×64 sheet, replaces
  `assets/wanda-walk-east.png`) + one standing pose (64×64, replaces
  `assets/wanda-stand-east.png`). **Explicitly an exploration**:
  generate multiple aesthetic directions, drop finalists into the live
  game, walk each on the phone before choosing. Done when hiker +
  palette + reference image are locked AND the hiker walks in the
  deployed build. Save the reference image into the repo
  (`art-reference/`) — every later prompt cites it.
  *(Locked 11 Jul 2026 — candidate C "high contrast", chosen from
  four rendering directions, phone-walked in the deployed build.
  Reference: `art-reference/wanda-reference.png`; ART-BIBLE §2 ramps
  updated from her extracted clusters. Total gate cost: 9
  generations. See LEARNINGS.)*

── everything below this line generates against the reference ──

## SECTION A — WOODLAND (the home setting)

**Decision required at A1, before generating**: the current scenery is
grayscale bands recolored by `BIOME_PALETTES` multiply-tints (a tint
can only darken — Session 9 scar). Real painted layers can't be tinted
the same way. Choose: (a) keep layers near-grayscale/tintable, or
(b) per-setting painted layer sets — which effectively pulls the
"virtual setting drives scenery" park (NOTES.md) forward, since painted
woodland art cycling on walked meters would clash with dealt water
segments. Recommendation: decide (b) and wire setting→scenery when
Section D starts; woodland-only art works fine either way until then.

- [~] **A1**: sky band — background color + the sparse cloud strip
  (360×180, transparency, clouds duplicated across the wrap point).
- [~] **A2**: far layer — distant treeline/ridge silhouette, 360×120
  **tileable strip** ⚠️ seam gotcha: must loop edge-to-edge
  (ART-STYLE); fallback: sparse silhouettes on transparency.
- [~] **A3**: mid layer — nearer treeline/undergrowth, 360×140
  tileable ⚠️ same seam gotcha.
- [~] **A4**: foreground path — dirt, grass lip, pebbles, tufts,
  360×180 tileable ⚠️ seam gotcha; this band's motion sells the
  walking, so keep texture detail that reads at 70 px/s.
- [~] **A4.5**: near-foreground overlay — sparse transparency strip
  (360×60) of tall grass tufts / the odd fern at FULL foreground
  treatment, wired as a fifth parallax band IN FRONT of the hiker
  (depth 12, ~1.3× path speed). Sparse enough that she stays visible
  ~85%+ of the time — it brushes past her, never curtains her.
  *(Added at stage-1 iteration 2 — the scene read flat without a
  plane in front of the hiker.)*
- [ ] **A5**: deer — trailside/journal sprite, ~28×28 (journal slot
  `deer` exists; trailside spawning is future content).
- [ ] **A6**: a small bird — ambient critter, ~16×16, 2-frame flap †
  (no ambient-critter spawner yet — the GAME-DESIGN "fake-outs" layer;
  park the wiring note in SIDE QUESTS when this lands).
- [ ] **A7**: the old oak with the hollow — landmark for
  hollow_tree_01, ~40×56 (currently signpost fallback).
- [ ] **A8**: the mossy log — landmark for log_rest_01, ~40×20
  (currently signpost fallback).
- [ ] **A9**: the hand-painted sign — landmark for painted_sign_01,
  ~30×40 (currently signpost fallback).

## SECTION B — THE EVERY-HIKE CAST

The props every single hike can meet, most-seen first.

- [ ] **B1**: **the signpost** — THE most-seen prop in the game: the
  default landmark AND the fallback for every `landmark: null` beat.
  ~34×46. Do it before anything else here.
- [ ] **B2**: the cairn — fork_cairn_01, cairn_topple_01, and the
  ending marker. ~36×36. (A toppled variant is dessert, G.)
- [ ] **B3**: the stream — stream_crossing_01 / coin_stream_01
  landmark, ~44×16 wet strip across the path.
- [ ] **B4**: the wooden gate — gate_01, the last stop of every hike.
  ~40×48.
- [ ] **B5**: the trail marker — marker_read_01's weathered post,
  ~30×44 (currently signpost fallback).
- [ ] **B6**: the butterfly — the opener's star, ~12×10, 2-frame
  flutter † (no sprite slot yet: it exists only in prose; wiring ≈ the
  hat's on-screen pattern).
- [ ] **B7**: the fox — the one spawnable creature; already has
  journal + Polaroid wiring. Trail sprite ~28×20 (+ the journal icon
  is the same texture — one asset, two uses).
- [ ] **B8**: the lucky hat — trailside pickup ~16×10 **and** the
  on-hiker look (worn at Wanda's crown; check it reads at 64×64 during
  the walk cycle).
- [ ] **B9**: another walker — encounter_hiker_01's passerby, 64×64 to
  match Wanda † (no sprite slot: the stop currently shows a signpost;
  wiring = a landmark-like sprite that walks the other way).
- [ ] **B10**: **the overlook ending set-piece** — trail_end_01's
  quiet payoff, the one scene every hike ends on. Full-scene art
  (~360×400 band) † (`setpiece` was never implemented — wiring = a
  backdrop behind the JOURNEY'S END card).

## SECTION C — UI + CAMPFIRE

- [ ] **C1**: the two choice buttons (green/tan pair + disabled
  state) — 150×62 each, big thumb targets.
- [ ] **C2**: the decision card panel — 336×156 bottom panel + border.
- [ ] **C3**: the journal page — frame, slot boxes, the `???`
  silhouette treatment, "photo" button.
- [ ] **C4**: the Polaroid frame — the keepsake print (268×232 white
  frame + caption area) and Share/Walk-on buttons.
- [ ] **C5**: HUD dressing — distance/stat text treatment, the
  journal/sound tabs (88×30).
- [ ] **C6**: the tent-and-campfire rest scene — tent, log fire,
  2-frame flames, glow, night sky (replaces Camp.js's painted
  placeholders).

── **MILESTONE after C: a full woodland hike shows zero placeholder
rectangles — screenshot it, that's the game's first true face.** ──

## SECTION D — WATER

(Prerequisite noted at A1: by here the setting→scenery wiring question
must be answered, or dealt water segments play over woodland art.)

- [ ] **D1–D4**: water-setting parallax set — sky/far/mid/path
  variants (reed banks, wet ground); same sizes and ⚠️ seam gotchas
  as A1–A4.
- [ ] **D5**: the pond — pond_stones_01 landmark, still water ~48×20.
- [ ] **D6**: the fish — fish_look_beat's one-second stare † (prose
  only today; also GAME-DESIGN's fish-jump ambient), ~20×12.
- [ ] **D7**: skipping-stone ripple rings — tiny effect sprite for
  pond_stones_beat_01 † (pure prose today), ~24×12.
- [ ] **D8**: water endpoint set-piece — a hidden pool/bend payoff
  scene (no ending node uses it yet — art leads, content follows).

## SECTION E — VALLEY

- [ ] **E1–E4**: valley parallax set — big sky, far drop, ridgelines;
  ⚠️ seam gotchas.
- [ ] **E5**: the vista — what vista_overlook_01 and sign_vista_beat
  actually show: a below-the-trail valley backdrop moment (pairs with
  the linger tint).
- [ ] **E6**: distant ridge shape — echo_rare_beat's "something
  crosses the ridge" silhouette † (prose only; parked in NOTES).
- [ ] **E7**: valley endpoint set-piece — the classic
  cliff-over-a-distant-landmark scene.

## SECTION F — FARMLAND / OPEN

- [ ] **F1–F4**: farmland/open parallax set — fields, walls, moor
  tones (one set can serve both tags at first; split later if they
  drift apart); ⚠️ seam gotchas.
- [ ] **F5**: the fencepost — glove_fencepost_01's landmark (+ the
  glove hanging on it for the payoff beat), ~30×40.
- [ ] **F6**: the stile — dog_stile_01's landmark, ~36×40.
- [ ] **F7**: **the farm dog** — sitting at the stile ~28×24; the
  trotting-at-heel follower is dessert (G) † for the follower half.
- [ ] **F8**: the bothy — bothy_door_01's stone shelter, door ajar,
  ~48×44.
- [ ] **F9**: farmland/open endpoint set-piece — e.g. the gate on the
  last rise, sunset fields.

## SECTION G — DESSERT (unordered pool — pull when inspired)

From NOTES.md's parked art items and deferred pieces. No order; any
item may be pulled between queue items as a treat, but the queue line
resumes after.

- [ ] Reactive poses for Wanda: drinking/crouching (stream),
  picking-up (hat), sitting (mossy log), breathing-idle (long pauses
  + camp) — Pixel Lab template animations, ~1 generation each †
  (wiring: a `pose` field, per NOTES).
- [ ] The fork set-piece — a visible trail split for fork_cairn_01.
- [ ] The toppled-cairn variant (cairn_topple_01 before restacking).
- [ ] The crisp packet — litter_packet_01's turning-in-the-grass
  sprite † (prose only; the tumbling follower is also parked).
- [ ] The dog-trotting follower frames (pairs with F7's wiring park).
- [ ] The yeti journal icon — deferred WITH the snow setting (old-list
  biome); the journal's `???` silhouette slot exists today, so this
  can land any time without content.
- [ ] Rainbow / rain / mist overlay art (rain_walk, rainbow_beat,
  mist beats are tint-only today).
- [ ] The banded feather + bent coin — keepsake close-ups if
  hollow_rare/coin ever get item art.
- [ ] Additional endpoint scenes (grow toward ASSET-CHECKLIST's 6–12).
- [ ] HUD polish (stat-change pulse art, per NOTES).

## SIDE QUESTS

*Empty on purpose.* **The rule**: when an unexpected art need appears —
a new segment's landmark, a discovered gap, a better idea — write it
HERE first, then consciously either splice it into the queue at a
stated position ("goes after B4") or leave it deferred. Detours are
decisions, not drift.

- (none yet)

## RECONCILIATION vs ASSET-CHECKLIST.md

Every checklist category maps into the queue: hiker → G1 · biome
backgrounds → A/D/E/F (four settings of layers, **not six biomes** —
snow/coast/alpine/meadow/wetland deliberately dropped until content
earns them; the yeti defers with snow, its journal icon waits in G) ·
critters & objects → A5–A6, B6–B9, D6, E6, F7 · decision landmarks →
A7–A9, B1–B5, D5, F5–F6, F8 · endpoint set-pieces → B10, D8, E7, F9
(4 of the checklist's 6–12; the rest are dessert) · UI + campfire →
C1–C6. Every landmark texture the live content references (signpost,
cairn, stream + the null→signpost fallback) appears exactly once; all
three journal creatures are placed (fox B7, deer A5, yeti G); the
MVP-subset list in ASSET-CHECKLIST is fully covered by GATE 1 +
Sections A–C + B10. The checklist's lazy-load-per-biome note stays
parked in NOTES.md until real PNGs exist.

## LEARNINGS

Craft notes accumulate here as items complete. Seeded with scars
already earned during the placeholder build:

- **Multiply-tints only darken** — the biome palette system needs
  white/gray base art; painted color and `setTint` don't mix
  (Session 9). This is the root of the A1 decision.
- **Seamless tiling via periods that divide the strip width** — the
  placeholder ridges loop because every sine period divides 360
  exactly; hand-drawn strips need edge-matching instead, or sparse
  elements on transparency (which loop forgivingly).
- **Anything near the right edge of a strip must be drawn again one
  tile-width left** (the cloud/pebble wrap trick) or the wrap point
  cuts it.
- **Whole pixels only when scrolling** (`Math.round` on offsets) keeps
  the grid crisp — art with 1px details survives; sub-pixel art won't.
- **GATE 0 (11 Jul 2026) — the pipeline works end-to-end.** Exact call:
  `create_map_object` with `description: "a small forest mushroom, red
  cap with pale spots"`, `view: "side"`, `width: 64`, `height: 64`,
  defaults elsewhere (`detail: "medium detail"`, `shading: "medium
  shading"`, `outline: "single color outline"`). Completed first try in
  well under a minute; output was a clean 64×64 PNG with a transparent
  background, fetched from a `download` URL in the `get_map_object`
  result.
- **Billing is generation-counted, not dollar-metered**: `get_balance`
  showed $0.00 credits but an active Tier 1 subscription (2,000
  generations/month; 1,695 remaining at test time). One
  `create_map_object` call = 1 generation.
- **⚠️ `create_1_direction_object` burns 20–40 generations per call** —
  it produces candidate *batches* sized by pixel dimensions (≤42px → 64
  candidates, ≤85 → 16, ≤170 → 4). Right tool for a deliberate
  exploration (GATE 1's hiker candidates); wrong tool for a single
  sprite. `create_map_object` is the cheap single-shot.
- **Server-side results auto-delete after 8 hours** — download the PNG
  into the repo immediately, never park an asset on their servers.
- **Windows curl needs `--ssl-no-revoke`** for api.pixellab.ai
  downloads (schannel fails its certificate-revocation check
  otherwise; the cert itself still validates).
- `create_map_object` also has a style-matching mode (`background_image`
  + inpainting) and a `"selective outline"` option — both relevant from
  GATE 1 on (ART-BIBLE §5 wants selective colored outlines).
- **Characters vs map objects (G1 stage 1):** map-object stills CANNOT
  be animated — anything that will ever move must be born through
  `create_character`, even when only east-facing is needed.
  `create_character` v3 (highest quality) returns 8 rotations on a
  roomy 120–128px transparent canvas with the figure at true 64px
  density (animation headroom — crop losslessly, never scale). Cost:
  2 generations per v3 character at 64px; a template walk cycle
  (`animate_character`, one direction) is 1 more.
- **G1 keeper recipe** (candidate C): `create_character` v3, `view:
  "side"`, `size: 64`, `outline: "selective outline"`, `detail:
  "medium detail"`; prompt = fixed character description + §11
  ingredients + "strong warm golden sunlight with deep cool blue-violet
  shadows, high contrast rendering, bold crisp selective colored
  outlines". **Keep the character id** —
  `e3e8a31f-824b-490a-add9-4cc0d2d1e895` — future poses/animations
  (Section G's drinking/sitting/picking-up) animate THIS character,
  not a new generation.
- **Hit-rate:** 4/4 candidates usable and mostly on-model at 64px;
  1/4 chosen. Prompt scars: "over-ear headphones around her neck" is
  fragile (B grew head-gear instead); `detail: "high detail"` +
  "finely rendered" drifted hair color and swallowed the face (D);
  "soft muted" lost the red-pack identity anchor (A). Saying
  **"charcoal" instead of "black"** worked — zero pure-#000 pixels
  across all four candidates.
- **v3 output is micro-shaded**: ~6,000 distinct hexes across the nine
  Wanda frames — it *reads* as clean pixel art but is not literally
  palette-limited. Consequences: (1) palette extraction = clustering,
  not color-listing (ART-BIBLE §2's locked ramps are cluster centers);
  (2) ART-BIBLE's short-ramps rule governs *authored/tintable* art —
  don't reject v3 sprites for hex-count; (3) micro-shaded painted art
  and multiply-tints don't mix, which weighs on the A1 decision.
- **Walk template `walking-8-frames`** (east only, 1 generation) was a
  first-try keeper: 8 frames at 64px density, clean contact poses.
- **The lossless assembly recipe**: union the opaque bounding boxes of
  all frames + the stand, cut ONE shared 64×64 window (bottom-aligned
  to the union's lowest row so feet pin to the sprite bottom,
  horizontally centered) — walking and standing stay perfectly
  aligned, and no pixel is ever scaled.
- **v3 fills ~92% of the asked size** (C's figure is 59px tall in a
  64px request). Fine here — but if exact fill matters, ask a size
  notch larger and crop.
- **Layer prompts must state their §3 depth row EXPLICITLY** (the
  saturation %, cooled hue, outline weight, clusters-only, continuous
  mass) or the generator defaults to foreground treatment. The first
  A3 delivered full-saturation outlined standalone trees with grass
  mounds; the regen that spelled out "MID-DISTANCE … 75 percent
  saturation, hue cooled … no interior detail … continuous mass …
  shadowed understory fading to dark" nailed the row first try.
- **Band-overlap anchoring rule** (engine + art contract): adjacent
  parallax bands must OVERLAP, never merely touch. The path band's
  grass lip is transparent between blades for its top ~14 rows, so
  the band behind it must stay opaque through that zone — mid now
  runs 16px past the path top (to y=490) and its bottom ~30 texture
  rows are continuous opaque understory. Element bases that end
  exactly at a band boundary flash background through the lip.
- **Wide strips come back with PAINTED skies** despite "transparent
  background" — the path had sky-color margins top AND bottom, the
  treeline an opaque 2-tone sky with cloud blobs. They're always a
  couple of flat tones: sample and chroma-key, then verify per-row
  opacity before shipping.
- **REQUIRED prompt language for every setting's layer set (D/E/F
  inherit this scar)**: (1) the far layer needs PRESENCE — "varied
  heights, some rising near the TOP edge of the canvas" — or it comes
  back as a low strip that hides behind the mid layer and the scene
  reads flat; (2) the mid layer needs SILHOUETTE VARIETY — "strongly
  undulating canopy line, clusters at different heights, occasional
  emergent, one or two deep dips, NOT an even row of same-height
  trees, same scale throughout (vary height, never apparent
  distance)"; (3) a near-foreground overlay strip in front of the
  hiker is part of every setting's set (A4.5 pattern: sparse full-
  treatment elements, ~1.3× path speed, depth 12).
