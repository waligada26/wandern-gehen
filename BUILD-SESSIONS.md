# BUILD-SESSIONS — The Coding Plan

The whole build, broken into **2–4 hour sessions**. Each has a single clear goal and a "done when" so you always know when to stop. Everything here happens on **placeholder art** — the real art pass comes after (see the end of this doc).

Sessions are mostly sequential. A few marked *(may spill into two sittings)* are meatier — that's fine, just pick up where you left off.

---

## How to run a session

1. **Point Claude Code at the relevant docs** at the start (this file + whichever design doc applies). Tell it the session number and goal.
2. **Work toward the one "done when."** Resist scope creep — extra ideas go in a notes file for later.
3. **Test on your actual phone** at least once per session (the whole point is the mobile feel). Once Session 1 is live, this is just opening the URL.
4. **Before committing, update ENGINE-STATE.md** if the session changed engine behavior, schema, save format, or validation — it must always describe the code as it is.
5. **Commit to git at the end** (and at any working checkpoint mid-session). This is your undo button. A broken experiment is one `git` command away from rolling back.

---

## Session 1 — Alive on the internet

**Goal:** a live, version-controlled Phaser project showing *something* on your phone.

- Have Claude Code scaffold a Phaser 4 project (there's an official `create-phaser-game` setup tool).
- Get a placeholder shape (a colored rectangle) rendering in the browser locally.
- Initialize git, push to GitHub, enable GitHub Pages.

**Done when:** you can open your `username.github.io/...` URL on your phone and see your placeholder. 🎉

**Why first:** getting a real, deployed, version-controlled thing on day one is a genuine morale win and de-risks the whole pipeline before any game logic exists.

---

## Session 2 — The walking world

**Goal:** the core visual — a hiker walking through a scrolling, looping world.

- Build **parallax scrolling** with solid color bands as placeholders: sky, far hills, mid treeline, foreground path — each scrolling right-to-left at a different speed.
- Add a placeholder **hiker** (a rectangle or crude shape) that **walks in place** in the foreground while the world slides past.
- Make the background layers **loop seamlessly** — no visible seam where they repeat.

**Done when:** it scrolls smoothly, the hiker looks like it's walking, and the loop is invisible.

**Notes:** the hiker never actually moves — the world moves past it (classic endless-runner trick). See ART-STYLE.md for the layer structure. The seamless-loop technique matters; sparse foreground elements on transparency loop more forgivingly than continuous painted ridgelines.

---

## Session 3 — The stop-and-choose loop *(may spill into two sittings)*

**Goal:** decisions that feel *stumbled upon*, not scheduled.

- Add a **distance clock** that only advances while walking (this is the game's core timer, and it naturally pauses at camp later).
- Spawn a **landmark** (placeholder sign/fork shape) off the right edge at a **random distance** and let it scroll in with the world.
- When the hiker **reaches** the landmark, pause the walk (switch hiker to a "stand" state — for now, just stop the animation), then fade in a **two-button decision card**.
- On tap, the card resolves and the walk resumes.

**Done when:** landmarks approach naturally, arriving at one pauses the walk and shows the A/B card, and tapping it continues the hike.

**Critical detail:** don't fire the card from a raw timer — the landmark must *visibly approach* so the player sees it coming. That reframes the moment from "interruption" to "arrival." See GAME-DESIGN.md → **Timing** for the spacing rules (random gap with a ~30s floor; average-two-rolls trick for comfortable spacing).

---

## Session 4 — Content as data *(may spill into two sittings)*

**Goal:** stop hardcoding choices; drive the game from a data file.

- Define the **content schema** (JSON): each node is a *stop*, tagged with its **type** (beat vs choice), its **trigger**, and — if it's a choice — its **two branches**. See GAME-DESIGN.md → **The content graph**.
- Move the Session 3 hardcoded choice into that data file.
- Add the small **state object** (e.g. `water`, `energy`, `distance`, `morale`) that choices can nudge and that can gate options.
- Add an **arrival screen** (a stop of type "ending").

**Done when:** you can add a whole new decision by editing the JSON, with no changes to game code.

**Why it matters:** once content is data, Claude Code (and you) can pour in dozens of stops without touching engine code — this is what makes the game grow cheaply.

---

## Session 5 — Persistence & the campfire

**Goal:** the game remembers you, and greets you warmly on return.

- **Save** progress to the browser (`localStorage`): distance, state, current position in the hike, and flags.
- **Resume** correctly when the page reopens.
- Build the **tent-and-campfire rest scene** that appears on return, with a "continue hiking" tap to resume.

**Done when:** you can close the tab, reopen it, and find your hiker waiting at camp with your progress intact.

**Notes:** the campfire *is* the ambient game's answer to "what happens when I log out" — not a pause, a satisfying rest state. Keep the scene simple for now (placeholder tent + fire).

---

## Session 6 — The rare-encounter system *(may spill into two sittings)*

**Goal:** the wonder layer — lucky sightings you get to keep. This is the emotional heart; give it room.

- Add **rare rolls** for special sightings/items (the very-low-percent dice — see GAME-DESIGN.md → **Rare encounters**).
- Implement the **lucky hat**: a rare pickup that, when worn, boosts a rare creature's odds for **15 minutes of hiking time**, then "blows away" with a little animated goodbye. The timer runs off the **distance clock**, not wall-clock.
- Build the **field journal**: a spotter's-guide page where each creature starts as a blank `???` silhouette and fills in (with **date + biome**) the first time you see it.
- Build the **photo/keepsake**: snapshot the game canvas at the moment of a rare sighting, save it as a captioned, dated pixel "Polaroid," with a **share** button (Web Share API).

**Done when:** finding + wearing a hat visibly changes the odds for a bounded window; seeing a rare creature fills its journal slot and captures a photo; both survive a reload.

**Notes:** store **photos in IndexedDB**, not localStorage (images belong there). This is *not* a gamey "Achievement Unlocked!" popup — it's a naturalist's journal and a keepsake. See GAME-DESIGN.md for the full rationale and the open decisions (hat sourcing, universal hat vs themed charms).

---

## Session 7 — Sound *(may spill into two sittings; needs stems ready)*

**Goal:** the generative, never-quite-repeating soundtrack.

- Wire up **Tone.js** alongside Phaser — Phaser drives the game, Tone drives the music clock.
- Load your composed **stems** and play them on one shared transport: **layer** them (fade in/out), **stitch** phrases (random order), and quantize every change **to the bar** with crossfades.
- Drive the mix from **slow randomness + game state** (biome sets the palette; time-of-day brightens/dims; decisions swell a layer; the lucky hat fades in a "shimmer" layer).
- Add **one-shots**: decision chime, arrival chime, footstep loop.

**Done when:** the music evolves and doesn't obviously repeat, changes land musically (on the bar, not abruptly), and the biome/hat states audibly change the mix.

**Dependency:** you need at least one biome's stems composed first — see AUDIO.md for how to build stems that combine (matched tempo/key, coprime bar lengths, frequency separation). This can run as a **parallel track**: compose in the DAW between coding sessions.

---

## Session 8 — Installable & offline (PWA)

**Goal:** it becomes a real app on the phone.

- Add the **PWA manifest** (name, icon, colors, portrait orientation) and a **service worker** for offline caching.
- Add **lazy-loading per biome** so the initial download is just the first biome + hiker (loads in a blink); the rest streams in as the journey unfolds.
- Test **"Add to Home Screen"** on your phone: it should launch full-screen, no browser chrome, and work offline once cached.

**Done when:** you can install it to your home screen, launch it full-screen, and it runs (with sound) offline.

---

## Then: the art pass

Only now do you open Pixel Lab. Because every slot already works on placeholders, this is low-risk **skinning** you can pace to your budget — stop whenever it looks good enough.

1. **Design the hiker first** — it's your style anchor (locks resolution + palette + reference). Walk cycle + one stand pose, right-facing side view only.
2. Size the Session 2 placeholder to the hiker's real dimensions, then drop the hiker in.
3. Go **biome by biome**: generate the parallax layers, swap them for the color bands; generate that biome's critters and landmarks; generate its endpoint set-piece.
4. Generate the **UI** and the **campfire/tent** scene.

Full inventory, counts, and the recommended "generate these first" MVP subset are in **ASSET-CHECKLIST.md**. Pixel Lab's MCP means Claude Code can generate and wire assets in the same breath.

---

## The shape of it

Sessions 1–8 build the **whole machine on free placeholders**. The single riskiest assumption isn't technical — Phaser and Pixel Lab will do their jobs — it's whether the core *watching* experience is genuinely pleasant. Sessions 1–3 answer that in your first couple of sittings, before you've invested in content tooling or spent on art. Everything after is layering onto a thing you already know feels good.
