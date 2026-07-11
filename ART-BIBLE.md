# ART-BIBLE — the Style Lock

> The single source of truth for how Wandern Gehen looks. Every Pixel Lab
> generation — typed by hand or fired by Claude Code through the MCP —
> must be prompted from this doc. If a generated asset doesn't match a
> rule here, regenerate; don't bend the rule.
>
> Locked 11 July 2026 from an eight-image reference study. Companion to
> ART-STYLE.md (the pipeline); this doc is the *aesthetic contract*.
> Status: **rules locked; palette hexes are starting points until the
> hiker is chosen** (see §9 — the winning hiker finalizes the ramps).

---

## 1. Density (the non-negotiable)

- **All art shares the 64px-hiker pixel density.** One pixel grid for
  the whole world — hiker, critters, landmarks, layers, UI.
- **No wallpaper-resolution scenes.** High-res "pixel-art wallpaper"
  looks (heavy dithering, near-painterly skies) are explicitly out:
  a 64px character in a fine-grain scene reads as a sticker on a
  photo, and fine detail turns to noise in a short portrait band.
- Reference density: a chunky, readable game scene where individual
  pixels are visible at 1× — think classic 16/32-bit environment art,
  not modern hi-res pixel wallpapers.
- Rendering stays crisp end-to-end: `pixelArt: true`, nearest-neighbour,
  integer scaling (already configured — see ART-STYLE.md → Mobile).

## 2. Palette (naturalistic warm)

The world is saturated but soft. Nothing neon, nothing muddy, **no pure
black (#000), no pure white (#FFF)** anywhere.

Starter ramps (approximate — finalize from the winning hiker, §9):

| Family | Ramp (dark → light) | Used for |
|---|---|---|
| Greens (warm) | `#2d4a2b → #4a7a3a → #7fb24e → #b8d96a` | grass, canopy sun-side |
| Greens (cool) | `#1e3330 → #33594d → #4d7a63` | canopy undersides, foreground shadow |
| Earth | `#5a3a2a → #8a5a3a → #c08552 → #e8c39a` | trunks, rock, path, sand |
| Water | `#1a5a6a → #2a8a9a → #4ec4c4 → #a8e8e0` | streams, ponds, sea |
| Sky (day) | `#4a90c2 → #7ab8dd → #cfe8f0` | sky gradient, distant haze |
| Cool shadow | `#3a3a5e → #5a5a8a → #8a8ab8` | far mountains, all shadow tinting |
| Warm light | `#f0d890 → #f5b86a → #e8845a` | highlights, golden-hour wash targets |

Rules of use:

- **Sun side warm, shadow side cool.** Every lit surface leans
  yellow/orange; every shaded surface leans blue/violet. This single
  rule carries most of the calm-warm mood — never shade by just
  darkening the same hue.
- Keep ramps short: **3–4 steps per material.** More steps drifts
  toward the banned wallpaper look.
- One shared palette game-wide. Biomes recolor by *proportion* (snow
  leans cool-shadow + white-warms; coast leans water + sand), not by
  introducing new hue families. Exception: the time-of-day wash (§7).

## 3. Depth = temperature (the parallax recipe)

Aerial perspective is how the world gets deep, and it maps 1:1 onto
the layer structure from ART-STYLE.md:

| Layer | Saturation | Temperature | Detail | Outlines |
|---|---|---|---|---|
| **Foreground path** | full | full warm/cool contrast | full | selective, darkest |
| **Mid (treeline)** | ~75% | slightly cooled | clusters, no interiors | faint or none |
| **Far (mountains)** | ~40%, shifted toward cool-shadow ramp | cool blue-violet | flat silhouettes, 2–3 tones | none |
| **Sky** | soft gradient | — | gradient + simple cloud shapes | none |

A layer that violates its row (a fully-saturated far mountain, an
outlined distant ridge) will pop forward and flatten the scene —
regenerate it.

## 4. Foliage (clustered blobs)

- Canopies and bushes are built from **rounded clumps**: a light
  cluster on the sun side, a dark underside, a mid tone in between.
- **No per-leaf detail, no flat single-tone shapes.**
- Grass: warm yellow-green base with sparse darker tufts — texture by
  suggestion, not carpet detail (dense grass noise shimmers when the
  layer scrolls).

## 5. Outlines

- **Selective, colored, never black.** Edges are held by the darkest
  ramp step of the material (deep green on foliage, deep brown on
  trunks/rock) — no uniform cartoon outline.
- Weight falls off with distance (see §3 table): strongest on the
  foreground and on the hiker, absent on far layers.
- The **hiker and interactive landmarks** get the crispest edge
  treatment in the game — they must read instantly against any biome.

## 6. Dithering

- Allowed **only** in skies and large smooth gradients, and sparingly.
- Banned on materials, characters, foliage, and anything that scrolls
  fast — dither + horizontal scroll = shimmer, the opposite of calm.

## 7. Light & time-of-day

- Default state: **soft daylight**, sun high and slightly warm.
- The golden-hour/dusk mood is a **palette state, not an asset set**:
  the engine's day-wash tint shifts the scene toward the warm-light
  ramp (`#f5b86a → #e8845a` highlights, violet-deepened shadows).
  Never generate separate sunset variants of layers.
- Consequence for generation: author all layers in neutral daylight so
  the wash has a clean base to tint.
- NOTE: the current day-wash is a multiply tint, which can only darken
  (Session 9 — see ART-QUEUE LEARNINGS). The warm golden-hour shift
  described here needs an additive/overlay or screen-blend approach —
  parked with the time-of-day session (NOTES.md). Author layers in
  neutral daylight regardless; that decision stands either way.

## 8. What we are NOT doing (anti-goals)

- No wallpaper-resolution or heavily dithered painterly scenes.
- No uniform black outlines.
- No neon/psychedelic palettes (the striking purple-orange fantasy
  look in the reference set is a different game's voice — steal its
  *composition*, framing trees and reflective water bands, never its
  colors).
- No top-down/¾ perspective — the game is a side-view band. Top-down
  references are texture studies only.
- No pure black or pure white pixels.
- No harsh contrast or horror-adjacent darkness — every scene must
  pass the "restful to glance at" test (README → Calm).

## 9. The hiker is the reference (order of operations)

1. Generate **several 64×64 hiker candidates** against §§1–6:
   right-facing side view only, walk cycle + one standing pose
   (ART-STYLE.md — a stopped hiker stands, never freezes mid-stride).
2. **Pick the winner. That sprite becomes the master style reference**
   fed into every subsequent Pixel Lab generation (reference-based
   generation), and its exact hex values overwrite the starter ramps
   in §2.
3. Only then move on, in ART-QUEUE.md's order (the queue is the order
   authority; ASSET-CHECKLIST remains the category inventory).

External reference images informed this doc but are **not** fed into
the generator — the hiker is the only reference asset. (Matches our
density lock, and keeps the style ours.)

## 10. Per-category notes

- **Critters (~15–30):** small sprites at world density, same clustered
  shading, crisp selective outline. Rare creatures (yeti) get no extra
  visual fanfare in the sprite itself — rarity is the number, wonder is
  the moment.
- **Decision landmarks (~8–15):** must read as "approachable object"
  from several seconds away while scrolling in — clear silhouette,
  foreground outline weight, slight warm rim so they gently pop.
- **Endpoint set-pieces (~6–12):** the detail budget lives here, but
  still at world density (§1). Compose like the reference vistas:
  framed foreground, warm-lit subject, cool receding distance.
- **UI + campfire:** same palette, same density. Buttons use the earth
  ramp with warm-light highlights; big portrait thumb-zone targets
  (ART-STYLE.md → Mobile). The campfire scene is the warmest image in
  the game — it's the reward for coming back.

## 11. Prompt ingredients (paste into every generation)

Style descriptors to carry in every Pixel Lab prompt, adapted per asset:

> crisp 16-bit style pixel art, chunky readable pixels, limited
> naturalistic palette, warm sunlight with cool blue-violet shadows,
> clustered blob foliage, selective dark colored outlines (no black
> outline), no dithering [except: sky assets — "sparse dithering in
> gradient only"], soft calm daylight, side-view

Plus, per asset: the size (e.g. "64×64"), the layer row from §3 if
it's a parallax layer, and — after §9 step 2 — the hiker reference
image.

## 12. The seam warning (unchanged, still the real gotcha)

Parallax layers must tile edge-to-edge (ART-STYLE.md ⚠️). Generated
scenes are not automatically loopable: prefer sparse elements on
transparency for mid/foreground, request tileable strips where
possible, and budget hand-touch-up on seams. This is the one
non-push-button step in the pipeline.
