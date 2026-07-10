# ASSET-CHECKLIST — What to Generate

The concrete "make these things" list for the art pass, with counts, sizes, and — most importantly — the small subset to generate **first**. This is the doc that maps to your Pixel Lab spend.

---

## The principle that keeps this cheap

**Journey length and asset count are almost unrelated.** You are *not* generating 60 minutes of scenery. Because the world loops and critters spawn at random, variety is **combinatorial**: a small library recombines into a near-endless number of distinct-feeling journeys — like a deck of cards giving astronomically many hands. Duration is free.

So the spend is driven by **number of biomes and variety of critters**, not by how long a hike lasts. And it's a **dial you turn up over time**, never a lump you commit to.

---

## Full inventory (a complete game)

| Category | Count | Notes |
|---|---|---|
| **Hiker** | 1 character | Walk cycle + one stand pose, right-facing only. Your style anchor — make it first. |
| **Biome backgrounds** | ~20–30 layer images | ~6 biomes × 3–4 looping parallax layers. |
| **Ambient critters & objects** | ~15–30 sprites | Birds, deer, fish, butterflies, yeti, signposts. Many reused across biomes. |
| **Decision landmarks** | ~8–15 | Forks, streams, logs, cave mouths. |
| **Endpoint set-pieces** | ~6–12 scenes | Castle vista, hidden beach, summit. Your most detailed assets. |
| **UI + campfire/tent** | ~10–20 elements | Buttons, panels, icons, the rest scene. |
| **Total** | **~70–120 distinct assets** | For a *full* game. |

> **Distinct assets ≠ Pixel Lab generations.** You'll generate a few candidates per keeper, so the number of *generations* (= dollars) runs a couple times higher. This is exactly why building on placeholders and skinning last matters — you spend against a game you already know is fun, and stop whenever it looks good enough.

---

## Generate these FIRST (the ~20–30 MVP subset)

A genuinely satisfying first release needs a fraction of the full list. Ship this, see if people love it, then grow the deck.

- [ ] **Hiker** — walk + stand (locks resolution + palette + style reference)
- [ ] **One biome** — 3–4 parallax layers (start with the one you find prettiest)
- [ ] **A handful of critters** for that biome — ~4–6 (e.g. bird, butterfly, deer, + one rare)
- [ ] **A few decision landmarks** — ~3–4 (fork, signpost, stream)
- [ ] **One or two endpoint set-pieces** — the payoff(s) for that biome
- [ ] **The lucky hat** sprite (+ its "on the hiker" look)
- [ ] **Core UI** — the two choice buttons, a panel, the journal page frame
- [ ] **The campfire/tent** rest scene

That's ~20–30 assets and a complete, lovable loop. Everything after is more biomes and more critters onto a proven game.

---

## Size reality (so you never worry about it)

Pixel art is astonishingly small — few colors, compresses beautifully.

| Category | Rough size |
|---|---|
| A 48px sprite | ~2–5 KB |
| A walk-cycle sheet | ~10–15 KB |
| An endpoint scene | ~50–250 KB |
| **All the art, full game** | **~2–5 MB** (less while starting) |
| **All the audio, full game** | **~3–8 MB** — the *biggest* part (a 45s loop ≈ 0.5–1 MB; compress sensibly) |
| **Whole game, fully built** | **~5–15 MB** |
| **An MVP** | **well under 2 MB** |

For perspective, the *whole game* is smaller than a single short Instagram video. Against **GitHub Pages** (1 GB site limit, 100 GB/month soft bandwidth) you're at **~1%** of the size cap, and because it's a PWA, returning players re-download nothing. **Size never constrains you.**

**Lazy-load per biome** so the *initial* download is just the first biome + hiker (a few hundred KB, loads in a blink); the rest streams in as the journey unfolds.

---

## Order of generation (during the art pass)

1. **Hiker first** — the style anchor. Lock resolution, palette, and the reference image from it.
2. **First biome** — layers (swap for the Session 2 color bands), then its critters and landmarks, then its endpoint.
3. **UI + campfire.**
4. **Then repeat per biome**, pacing to your budget.

Pixel Lab's MCP lets Claude Code generate and wire each asset in the same breath — see ART-STYLE.md.
