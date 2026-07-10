# AUDIO — Sound Design & Generative Music

You're composing the audio yourself (DAW + instruments). This doc is the *system* the music plugs into: how to build small loops that recombine into endless, never-quite-repeating soundtracks — the same "small pieces, emergent variety" idea as the art. Read before Session 7; start composing in parallel any time.

---

## The philosophy

Instead of composing long fixed tracks, you compose short **stems** designed to combine, and let the game mix them live. This is *adaptive / generative* music (Brian Eno built ambient music out of exactly this with tape loops). Three wins:

- **Unique soundtrack every session** — the mix never lands the same way twice.
- **Cheaper to make** than full-length tracks.
- **Smaller files** — a handful of short stems recombine into effectively limitless music.

Same combinatorial deal as the sprites.

---

## Two ways to combine

You'll want **both**:

### 1. Layering (stacking)
Compose several loops — a **bass pulse**, a **pad/drone**, a **melody line**, a **shimmer** — all in the same key and tempo, all built to sound good playing *simultaneously in any combination*. Fade layers in and out over time: bass + pad always underneath; melody drifts in for a while, then out; shimmer appears when you crest a hill. Muting/unmuting harmonically-compatible loops makes a few short pieces feel like one long evolving piece.

### 2. Stitching (sequencing)
Keep a small pool of interchangeable **phrases** of the same length and key, and play them end-to-end in **random order** — A, then C, then B, then A. As long as each begins and ends on compatible harmonic ground, any order flows, so a few bars of melody become an endless, non-repeating line.

---

## The trick that does the most work: coprime bar-lengths

**Make your loops different bar-lengths.** A 4-bar bass under a 6-bar pad under a 3-bar shimmer only lines back up exactly every **12 bars** — and with a few coprime lengths, the *combination you're hearing* takes many minutes to precisely repeat, even though every individual loop is tiny and constantly looping.

This **phasing** gives you an "evolving long-form piece" **for free**, before you write a single line of mixing logic. It's the cheapest richness in all of game audio.

---

## Stem craft rules (so they actually combine)

- **Same tempo** across everything (or clean multiples).
- **Same key** — or a shared chord progression — so any layer stacks without clashing.
- **Bar-aligned lengths that are multiples/coprimes** of each other (2-bar, 3-bar, 4-bar, 6-bar, 16-bar). This drives the phasing.
- **Frequency separation** — bass owns the lows, pad the mids, shimmer the highs — so stacking stays clear, not muddy. Keep **3–5 audible at once**.
- **Seamless loop points** — trim at the bar on **zero-crossings**, and let **reverb tails wrap into the start** so there's no click on repeat.
- **Change on the bar** — when a layer fades in or a phrase swaps, quantize it to the next **bar boundary** and crossfade over a bar or two, so transitions feel *musical*, not abrupt.

---

## Driving "unique each time"

Fades and swaps are driven by a mix of **slow randomness + game state**:

- A **slow timer** rolls every so often on whether to add or drop a layer.
- **Biome** sets the base palette (forest = warm woodwind pad · coast = airy synth over the wave bed · snow = sparse bells).
- **Time-of-day** brightens or dims the mix.
- A **decision point** briefly swells a layer.
- The **lucky hat** fades in its own **"shimmer" layer** — the whole world audibly brightens while you're charmed (see below).

Even with almost none of this logic, the **differing loop lengths keep it moving** — the logic just makes it feel intentional and responsive.

---

## The composition constraint (a fit, not a limitation)

The real discipline: parts must sound good in **any combination** and **any order.** You can't lean on a fixed arrangement that builds to a climax, because the piece is never in a fixed state.

That constraint kills a dramatic hero theme — but it's the **natural voice** of a calm hiking game. Write **ambient, modal, drone-and-texture** music rather than strong hook-driven melodies, and the technique stops being a limitation and becomes the whole thing's voice: endless, gentle, never quite the same walk twice.

---

## The engine: Tone.js (alongside Phaser)

- **Tone.js** is a Web Audio framework built around a musical **transport/clock**. It schedules your loops on one shared timeline, mutes/unmutes layers, quantizes every change to the bar, and crossfades — all sample-accurately.
- It runs **alongside Phaser**: Phaser drives the game, Tone drives the music clock.
- Phaser's own audio is fine for **simpler footsteps-and-chimes** work, but for tight, bar-synced generative music, **Tone is the better engine.** (It's available in the build environment already.)

---

## Exporting stems from your DAW

For each stem, bounce a **seamless loop** at the **matched tempo and key**, with a **bar-aligned length**, then:

- Export to **compressed web formats** — `.ogg` / `.webm` (with `.mp3` as a fallback) — to keep the app light.
- **Mono or a modest bitrate is fine** for background ambience; save the quality budget for anything foregrounded.

> Heads-up on footprint: audio will likely be the **largest** part of the whole game (a 45s loop ≈ 0.5–1 MB, vs a sprite at a few KB). Compress sensibly rather than shipping fat WAVs. See ASSET-CHECKLIST.md.

---

## The lucky-hat moment

When the hat goes on, a **"lucky" shimmer stem fades in** over the current mix — this is the showcase use of the stackable-layers system. The world *brightens* audibly. When the hat blows away, the shimmer **fades back out** in time with the little animated goodbye. One stem, big feeling.

---

## Sound asset list

A good starter set (grow later):

| Asset | Count | Notes |
|---|---|---|
| **Ambient beds (per biome)** | ~5 stems × ~6 biomes | Bass pulse, pad/drone, melody, shimmer, + one extra. **Share stems across biomes** where they fit — many overlap. |
| **The "lucky" shimmer stem** | 1 | The hat layer. Fades over any biome mix. |
| **Footstep loop** | 1 | Soft, subtle, under everything while walking. |
| **Decision chime** | 1–2 | One-shot when a choice/landmark is reached. |
| **Arrival chime** | 1 | One-shot at endings / set-pieces. |
| **Rare-sighting sting** | 1 | A little one-shot for the wonder moment (yeti, shooting star). |

Because stems recombine and many are shared across biomes, this modest set produces effectively limitless music — and **reduces** your audio footprint versus authoring long linear tracks.

---

## MVP audio (for the first satisfying build)

You don't need all of it to ship something that feels good: **one biome's stems** (so the layering/phasing works), a **footstep loop**, and a **decision chime**. That's enough to prove the generative system and the mood. Expand biome by biome after.
