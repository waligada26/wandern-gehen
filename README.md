# Wandern Gehen — Project Bible

> An ambient hiking game you glance at instead of doom-scrolling.

---

## The pitch

A little pixel-art hiker walks slowly, endlessly, through beautiful biomes. You mostly just **watch** — animations drift past, the light shifts, a deer crosses the treeline, a fish jumps a stream. Every so often the trail brings you to something — a fork, a stream, a view — and you make one simple **yes/no** choice. A hike might last fifteen minutes or an hour depending on where your choices take you, and it ends somewhere quietly rewarding: a cliff over a distant castle, a hidden beach, a mountain pass.

It's the calm opposite of the feed. No score to chase, no pressure, no endless scroll. Just a gentle walk that's a little different every time.

## The three feelings we're protecting

Everything in this project serves one of three feelings. When a decision is unclear, ask which of these it serves:

1. **Calm** — it's restful to look at and listen to. Never stressful, never demanding. A "bad" outcome is just a longer path or a tired hiker, never failure.
2. **Alive** — the world feels continuously alive, not just at decision points. Small ambient events, shifting light and weather, sounds that evolve.
3. **Wonder** — rare, lucky moments you get to keep. A yeti you might not see for weeks. The thrill is heightened *hope*, not tension.

## Core design pillars (the decisions that are locked)

- **Ambient, not idle-genre.** Progress happens *only while the app is open and you're watching.* Close it and the hiker makes camp — a tent-and-campfire rest scene greets you on return, and you tap to resume. (This also cleanly solves "what happens when I close it.")
- **Small pieces, emergent variety.** The same principle runs through everything — art, music, encounters. A small library of loops, sprites, and moments recombines via randomness into a near-endless number of distinct-feeling journeys. **Journey length and asset count are almost unrelated** — duration is basically free.
- **Two options, always.** Every choice distills to a clean A/B. That constraint is a feature: it stays glanceable on a phone.
- **Soft stakes.** No death, no harsh failure. Gentle consequences only.
- **Build on placeholders, spend on art last.** The whole game runs on free stand-in art first; real Pixel Lab assets are a low-risk skinning pass at the end. Prove it's fun before spending a dollar.

## Tech stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Game framework | **Phaser 4** | Most-used 2D web framework, batteries-included, beginner-friendly, huge tutorial base, reliable for AI-written code. |
| Delivery | **PWA** (installable web app) | Write once, runs on web + mobile, installs to home screen, works offline. No app store, no native build. |
| Art | **Pixel Lab** | AI pixel-art for characters, scenes, tilesets, UI — all in a matched style. Has an MCP server so Claude Code can generate assets directly. |
| Music/SFX | **Self-composed stems + Tone.js** | We compose loops in a DAW; Tone.js schedules them on a shared musical clock for generative, never-quite-repeating soundtracks. |
| Hosting | **GitHub Pages** (free) | Free static hosting over HTTPS (HTTPS is required for PWA install). Version control + hosting in one place. |
| Coding | **Claude Code** | Writes and wires the game session by session, reading these docs for context. |

## How to use these docs

Drop this whole folder into the project repo. Point Claude Code at the relevant doc at the start of each session so it has the context.

| Doc | What's in it |
|---|---|
| **README.md** (this file) | The vision, the pillars, the index. |
| **SETUP.md** | Every program and account to install, and the "you're ready when…" checks. Do this first. |
| **BUILD-SESSIONS.md** | The whole build broken into 2–4 hour coding sessions, each with a goal and a "done when." |
| **GAME-DESIGN.md** | The mechanics bible — the core loop, the stops & choices menu, timing, state, the rare-encounter system, the content graph. |
| **ART-STYLE.md** | Visual direction, the Pixel Lab pipeline, the asset style rules, mobile rendering. |
| **AUDIO.md** | The generative-music approach, how to compose stems that combine, and the sound asset list. |
| **ASSET-CHECKLIST.md** | The concrete "generate these things" inventory with counts, sizes, and the MVP subset. |

## The one-line summary of the plan

Do **SETUP** → work through **BUILD-SESSIONS** on free placeholder art until the game is fully playable and genuinely feels good → then open Pixel Lab and do the **art pass**, skinning slot by slot, starting with the hiker.
