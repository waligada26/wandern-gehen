# HANDOVER — state of the repo as of 10 July 2026

All 8 build sessions are done and deployed (https://waligada26.github.io/wandern-gehen/).
This file is the context for the next session.

## Just finished (content.json)

- Trail is 6 nodes: `fork_cairn_01` (choice) → `vista_overlook_01` (beat) →
  `stream_crossing_01` (choice) → `sunset_pause_01` (choice) → `log_rest_01`
  (choice) → `trail_end_01` (ending).
- `log_rest_01` was briefly given a follow-up beat (`log_rest_sit_01`) and then
  **reverted** — both options now go straight to `trail_end_01`; the node is a
  clean A/B whose "Sit" option differs only by effects (and a `requires`).
- **Beats show a card only.** There is no `behavior`/`setpiece` support — an
  ending's `setpiece` field (per GAME-DESIGN.md's sketch) is NOT implemented,
  and a beat is a prompt + "Walk on" button, nothing else.

## Node schema as implemented (src/game/content.json)

- Choice: `type, trigger, biome, prompt, landmark, options[2]`; option =
  `label, effects, next` + optional `requires`.
- Beat: `type, trigger, biome, prompt, landmark, effects (optional), next`.
- Ending: `type, trigger, biome, prompt, landmark`.
- Unknown/null `landmark` falls back to the signpost prop — every stop
  visually arrives at something.
- Top level also has `start` and `creatures` (journal roster: fox/deer/yeti).

## State keys

- `water`, `energy`, `morale` — start 3, clamped 0–5 (`STATE_START` /
  `STATE_MAX` in `src/game/scenes/Game.js`). Usable in `effects` and `requires`.
- `distance` is the walking clock (`distanceM`), NOT an effects key — effects
  can't move the hiker.

## Hardcoded outside content.json (in src/game/scenes/Game.js)

- `trigger` is decorative — every stop is distance-spaced; the engine never
  reads the field.
- The lucky-hat pickup card, hat window, and the fox/polaroid/journal flow are
  code, not content nodes.
- Fixed button labels: "Walk on" (beat), "Begin a new trail" (ending),
  "Wear it" (hat).

## NEXT TASK: "sit and linger" on the walk screen

Make tapping "Sit, sip, and watch a while" play a visible moment with NO card:
the card dismisses, Wanda sits (model it on the existing stand-pose swap —
`pauseWalk()` sets `wanda-stand`; a sit does the same with a sit texture),
the world stays paused for a beat or two, then she stands and walks on.
Placeholder sit art is fine (or Pixel Lab `crouching`/sitting template later,
~1 generation — see NOTES.md). Likely shape: an optional `pose`/`linger` field
on options or nodes, read in `resolveStop`.

## Open items

- **iPhone audio is unresolved**: desktop plays (measured −18 dB at master),
  phone was silent. `navigator.audioSession.type = 'playback'` fix is deployed
  but untested on the phone; need the iOS version next time.
- Stray repo `caniplantit42/wandern-gehen` still awaiting manual deletion in
  the browser (wrong account, Session 1 mishap).
- Real audio stems (Jimmy's DAW) and the Pixel Lab art pass are the two big
  parallel tracks; placeholder synth stems and code-painted art fill the slots.
- `?fast` URL flag = 10× landmark gaps + boosted rare rolls, for testing.
- `CONTENT-INVENTORY.md` matches the current file; regenerate after content
  changes. No half-done edits are in flight — working tree is clean.
