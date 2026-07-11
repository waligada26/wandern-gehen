# ART-STYLE — Visual Direction & Pipeline

How the game looks, and how the art gets made. Read before the art pass; skim before Session 2 (so placeholders match the real structure).

---

## The look

- **Crisp pixel art.** Clean pixel grid, limited palette, nothing blurry. Nearest-neighbour scaling, no smoothing.
- **Calm and warm.** The palette and mood serve *rest*, not excitement — soft light, gentle color, atmospheric depth. Think cozy 16-bit seaside-town / forest-trail vibes over harsh arcade contrast.
- **Depth through parallax.** The world feels deep because layers move at different speeds, not because of detail density.

---

## Style lock — decide these once, everything keys off them

Before generating *anything* else, lock:

1. **Base sprite resolution — LOCKED at 64×64.** The hiker is 64×64 pixels: detailed enough for real character (a readable face, pack, and posture, and a walk cycle with weight) while staying unmistakably pixel art. This resolution is the anchor the whole game keys off — see **Pixel density** below.
2. **Palette.** A cohesive limited palette the whole game shares.
3. **A style reference image.** Pixel Lab does reference-based generation — feed the same reference into every later asset so the hiker, scenery, and UI read as *one game*.

**The hiker is the style anchor.** Design it *first* (see below). Its resolution, palette, and silhouette become the reference everything downstream matches. This is the one asset worth pulling forward before the rest of the art pass.

### Pixel density — the rule that follows from 64×64

A "pixel" in a background layer, a critter, or a button must be the **same physical size** as a pixel in the 64×64 hiker. Build (or generate) everything at that matching chunk size, then scale the whole scene up by a single **whole-number factor** — 2×, 3×, 4×, never 2.5× (fractional zoom smears the grid). Not every asset is 64px — a butterfly might be 16, a signpost 32, an endpoint scene much larger — they just need to sit on the same grid. This is what makes the hiker, scenery, and UI read as one game instead of three resolutions glued together. Have Pixel Lab generate the hiker **native at 64**, not upscaled from a smaller sprite.

---

## The hiker

The single most important sprite. Keep it minimal:

- **Two states only:** a **walk cycle** and **one standing pose.**
  - Don't freeze a mid-stride walk frame at stops — a hiker stopped mid-step reads as a *glitch*. A proper standing pose reads as "paused to think."
- **Right-facing side view only.** The hiker always travels left-to-right, so **skip 4/8-directional generation entirely** — cheaper and simpler.
- Generate a few variations, pick the winner, **lock it as the style reference.**

The hiker is **64×64** — size the Session 2 placeholder to 64×64 in source units so the real swap is a clean drop-in.

---

## Parallax layers (per biome)

Each biome is built from **3–4 horizontally-looping layers**, back to front:

1. **Sky** — slowest (or static). Gradients/simple color; compresses tiny.
2. **Far** — distant mountains/horizon. Slow.
3. **Mid** — treeline / hills. Medium speed.
4. **Foreground path** — the ground the hiker walks on. Fastest.

The hiker sits in the foreground band, walking in place while all layers scroll past at their own speeds.

### ⚠️ The one real asset gotcha: horizontal seamlessness

Parallax layers must **tile edge-to-edge** so the loop is invisible. AI-generated scene images are **not** automatically loopable. Options:

- Generate layers as **tileable strips**, or
- Keep foreground/mid layers **sparse** — scattered trees on transparency loop far more forgivingly than a continuous painted ridgeline, or
- Lightly **touch up the seams** by hand.

Budget a little iteration here — it's the one place the pipeline isn't push-button.

---

## Placeholder-first (the cost-safety rule)

Build **every** slot on free stand-ins first — solid colored rectangles drawn in code, free CC0 pixel art (e.g. Kenney.nl), or a stick-figure sketched in a free editor (e.g. Piskel). Because the whole game runs on placeholders, generating real art later is **pure skinning** — drop each finished asset into a slot that already works. Prove it's fun before spending; stop generating whenever it looks good enough.

---

## Biomes

**SUPERSEDED: art geography is now the dealer's five settings
(woodland, water, valley, farmland, open) per ART-QUEUE.md and
SEGMENT-TABLE.md. The list below is the original sketch; snow/coast
etc. may join later if content earns them.**

Aim for **~6** to start (grow later). Each needs its layer set, a critter palette, and at least one endpoint. Candidate list:

- Forest · Meadow · Alpine/mountains · Coast/beach · River/wetland · Snow

Because the world loops and critters spawn at random, ~6 biomes is plenty for endless-feeling variety.

---

## Ambient critters & objects (the variety engine)

The birds, deer, fish, butterflies, yeti, signposts. Each is a **small sprite**, some with a tiny animation (bird flap, fish jump, butterfly flutter, deer graze), some static (signpost). Aim for **~15–30** distinct elements, many **reused across biomes** (a bird works most places; some are biome-specific — fish → river, yeti → snow).

This is where variety comes from: a small library, shuffled by **random timing and random selection**, makes every journey feel different. Rarity is nearly free — a yeti seen once in a blue moon costs exactly **one** sprite; its rarity is a number, not more art. (See GAME-DESIGN.md → rare encounters.)

---

## Decision landmarks

The props that trigger choices — forks, signposts, streams, logs, cave mouths. **~8–15.** These scroll in and the hiker walks up to them. Small.

---

## Endpoint set-pieces

The payoff moments — the cliff over the castle, the hidden beach, the summit. These are your **most detailed** individual assets (full scenes). **~6–12.** You can also build some from the layer system + a hero element to keep them smaller.

---

## UI & the campfire

Pixel-art **buttons, panels, icons**, plus the **tent-and-campfire** rest scene. Generate against the style reference so the UI shares the world's look. **~10–20** elements.

---

## Mobile rendering rules

- **Design for portrait** — it's how people hold a phone when reaching for it instead of Instagram. The scene sits as a **wide-but-short band** across the middle (hiker walking through it); the **two choice buttons pin to the bottom** thumb zone. Big tap targets, generous spacing.
- **Keep it crisp:** use Phaser's `pixelArt: true` config (disables texture smoothing so sprites stay sharp on high-DPI screens); pick an **integer scale factor** and let Phaser's scale manager fit different phone sizes and dodge notches.

---

## Pixel Lab pipeline

Pixel Lab covers every category in a matched style:

- **Characters tool** → the hiker (walk + stand, right-facing).
- **Scene/environment generation** → endpoint set-pieces and biome layers.
- **Tilesets/maps** → side-scrolling backgrounds.
- **UI components** → buttons and panels, reference-matched.
- Exports as **PNG sprite sheets.**

**The Claude Code tie-in:** Pixel Lab ships an **MCP server** (their "Vibe Coding" toolkit) so an AI coding assistant can generate pixel art directly — Claude Code can generate the hiker, drop it into the loader, generate a biome layer, wire it into the parallax, all in one flow, rather than you round-tripping files by hand. It runs on their **paid API**, so factor the subscription — but only when you reach the art pass.

**Consistency is everything:** lock the resolution + palette + reference image up front and generate *everything* against it. That's what makes the hiker, the scenery, and the UI feel like one cohesive game.
