# CLAUDE.md — Wandern Gehen

Persistent context for Claude Code. Read this at the start of every session.

## What we're building

**Wandern Gehen** — an ambient pixel-art hiking game, the calm opposite of doom-scrolling. A little hiker walks endlessly through biomes while the player mostly *watches*; every so often the trail reaches a landmark and the player makes one simple A/B choice. Progress happens **only while the app is open and being watched**; on logout the hiker makes camp (a tent + campfire) and resumes on return.

## Source of truth — read before working

The full design lives in these docs. Consult the relevant one before answering, and don't contradict them. If something isn't covered, say so rather than inventing it.

- **README.md** — vision, the three feelings, locked pillars, index
- **SETUP.md** — programs & accounts, the Session 0 gate
- **BUILD-SESSIONS.md** — the session-by-session plan; **start here each session**
- **GAME-DESIGN.md** — core loop, beats vs choices, timing, state model, content graph, rare-encounter system
- **ART-STYLE.md** — visual direction, parallax layers, the seamless-loop gotcha, Pixel Lab pipeline, mobile rendering
- **AUDIO.md** — the generative stem system, Tone.js, sound asset list
- **ASSET-CHECKLIST.md** — what to generate, counts, the MVP subset

**Session start:** I'll give you a session number. Read that session in BUILD-SESSIONS.md for its goal and "done when," plus whichever design doc it points to.

## Fixed stack — don't substitute

- **Phaser 4** — game framework
- **PWA** — installable web app (manifest + service worker); web + mobile, offline-capable
- **Pixel Lab** — the art (paid; not touched until the art pass)
- **Self-composed audio stems + Tone.js** — Tone runs alongside Phaser and drives the music clock
- **GitHub Pages** — free static hosting over HTTPS

## Standing rules

- Every decision serves one of three feelings: **calm, alive, wonder.** If a suggestion doesn't, flag it.
- **Placeholders first.** The whole game is built on free stand-in art; real art is a final skinning pass. Do not propose spending on Pixel Lab before the game is proven fun.
- **Everything distills to a clean A/B** — two options, glanceable on a phone.
- **Soft stakes only** — no death, no harsh failure. A "bad" outcome is a longer path, a tired hiker, or a missed sighting.
- **Pixel density is locked to the 64×64 hiker.** Every other asset shares that grid; scale the scene by whole-number factors only (2×, 3×, 4× — never fractional).
- The **distance clock** advances only while the app is open and being watched, and pauses at the campfire on logout. Bounded timers (e.g. the lucky-hat window) run off it, not off wall-clock.

## Working process

- **Commit to git** at the end of every session and at any working checkpoint — this is the undo button.
- **Test on a real phone** at least once per session; the mobile feel (portrait, thumb-zone buttons) is the whole point.
- **Resist scope creep** — extra ideas go in a notes file, not the current session.
- I'm **new to coding**: explain reasoning and trade-offs, lead with a recommendation rather than a menu of options, and keep changes minimal and scoped to the task at hand.

## Commands

- `npm run dev` — local dev server at http://localhost:8080 (add `-- --host` to test from a phone on the same WiFi)
- Append `?fast` to the game URL to shrink landmark gaps 10× when testing
- `npm run build` — production build into `dist/`
- **Deploy:** just `git push` — GitHub Actions builds and publishes to https://waligada26.github.io/wandern-gehen/ automatically
- Repo: https://github.com/waligada26/wandern-gehen (account **waligada26** — this repo is pinned to it via local git config; don't change global git auth)

## Keep this file lean

This is an index and an operating manual, not documentation. Detailed design lives in the docs above; the step-by-step plan lives in BUILD-SESSIONS.md. Don't let this file grow into a running checklist or a place to duplicate the docs.
