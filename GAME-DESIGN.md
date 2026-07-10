# GAME-DESIGN — The Mechanics Bible

Everything about how the game *works*. This is the doc Claude Code should read before Sessions 3, 4, and 6.

---

## The core loop

1. The hiker walks; the world scrolls past (the hiker never actually moves).
2. A **distance clock** ticks — but **only while the app is open and you're watching.**
3. A **stop** approaches: a landmark scrolls in, the hiker walks up to it and pauses.
4. The stop either **shows** you something (a *beat*) or **asks** you something (a *choice*).
5. Resolve, resume walking. Repeat until you reach an **ending**.
6. Close the app → the hiker makes camp → return → tap to resume from the campfire.

---

## The most important distinction: beats vs choices

Every pause in the walk is a **stop**. A stop is one of two kinds:

- A **beat** *shows* the player something and asks nothing (a view, a sighting, an arrival).
- A **choice** *asks* the player something (a clean A/B).

This split matters more than it looks:

- A walk where **every** stop is a question becomes a **quiz**.
- A walk where **nothing** is ever asked drifts into **pure passivity**.

The calm-but-alive feeling comes from **interleaving** the two — a few beats, a light choice, a stretch of pure walking, a beat, an occasional weightier fork. Compose the rhythm; don't machine-gun questions.

---

## Beats (stops that ask nothing)

| Beat | What it is |
|---|---|
| **Arrivals & set-pieces** | Reaching an ending or a big vista — the cliff over the castle, the beach at last. Camera lingers, chime plays. |
| **Rare sightings** | The yeti, a shooting star, a fox that meets your eyes. Fires the **photo** and **journal** entry. Pure wonder. |
| **Lookouts & breathers** | A scenic overlook; the hiker stops, takes it in, moves on. Rhythmic rest. |
| **Milestones** | A distance marker ("50 km"), a little cairn. A quiet sense of progress. |
| **World events** | Nightfall, a passing shower, a rainbow after, mist rolling in. Atmosphere, no input. |
| **The campfire** | The logout rest stop (see below). |
| **Tactile micro-beats** | Open a gate, cross a stile, duck under a branch — a single "continue" tap for physicality. Use sparingly, as seasoning. |

---

## Choices (stops that ask), by what they *do*

| Category | What it does | Examples |
|---|---|---|
| **Navigation** | Branches the route — the structural backbone. Decides biomes, endings, and hike length. | Left / right · high road / low road · ford / follow the bank · cave shortcut / long way · deer trail / marked path. |
| **Resources** | Spends or tops up state; gives your numbers something to do. | Drink now / save it · eat trail mix / press on · rest here / keep moving · refill / don't bother. |
| **Risk & reward** | A gamble with an uncertain payoff. Where (gentle) tension lives. | Ford the fast water / take the long bridge · explore the dark cave / skip it · push through the storm / shelter. |
| **Curiosity & discovery** | The "what's that?" pull. Often reveals lore or feeds the journal; frequently leads into a beat. | Investigate the ruins / walk on · read the signpost / ignore it · peer over the edge / stay back. |
| **Encounters** | Meeting someone/something. Warmth, small rewards, sometimes a journal entry. | Share food with the fox / keep it · greet the hiker / nod and pass · help the stuck sheep / leave it be. |
| **Items & equipment** | Tied to the lucky-hat system. | Put the hat on now / save it · take the walking stick / leave it · which charm to wear. |
| **Mood & pace** | Pure feeling, near-zero stakes — arguably the most on-theme of all. | Watch the sunset / walk on · scenic detour / direct route · sit and breathe / carry on. |

**Stops chain.** A beat can flow into a choice (rockslide blocks the trail → "clear a path / go around"), and a choice can resolve into a beat (investigate the ruins → a set-piece you just witness). You compose little two- and three-part moments from these pieces — you don't pick one type per stop.

---

## When a stop happens (triggers)

| Trigger | Fires a stop when… |
|---|---|
| **Distance** | The landmark-spacing clock says so. *This is the default engine.* |
| **State** | A condition is met — energy low → a "rest?" choice drifts in; canteen empty → a stream appears. |
| **Biome transition** | Crossing into new terrain triggers a threshold moment or fork. |
| **Random rare roll** | The yeti, the hat, the shooting star — the low-percent dice. |
| **Authored** | A set-piece pinned to a specific node (the castle *guaranteed* at the end of the ridge path). |
| **Time-of-day** | Sunrise / sunset beats. |

---

## Timing — making stops feel stumbled-upon

The trick is to change *what the timer counts*. It doesn't fire a decision card out of nowhere — it sets the **distance to the next landmark**, and the landmark **visibly approaches**. The hiker sees it coming, walks up to it, and *then* the moment happens. That reframes every stop from "interruption" to "arrival."

Spacing rules that keep it organic:

- **A floor.** Never two landmarks closer than ~30 seconds of walking. A stretch of pure walking is a *feature*, not dead air.
- **A random gap above the floor.** To avoid awkward clumps or drags, **average two random rolls together** — this quietly makes comfortable medium gaps common and very-short / very-long ones rare.
- **Runs off the distance clock**, so it naturally pauses at camp when you log out.
- **Fake-outs break the pattern.** Sprinkle ambient sights that *look* like they might be something but aren't — a deer at the treeline, a bird crossing, a distant ruin. This stops "something appeared → decision incoming" from becoming a tell, so real forks stay a genuine small surprise, and the world feels alive continuously, not only at stops. A soft chime as the hiker reaches a real landmark ties it off.

---

## The state model

A small object carried through a hike. Choices nudge it; it gates options and endings. Keep it small — a handful of values, e.g.:

- `distance` — how far this hike has gone (drives milestones, gating, the hike clock).
- `water` — depletes; refilled at streams. Gates "drink" options and some endings.
- `energy` — depletes; restored by resting. Low energy can *summon* a rest choice.
- `morale` — nudged by mood/encounter beats. Purely flavorful, or lightly gating.

Soft stakes only: running a value low never means failure — at worst a longer path, a needed rest, or a missed sighting.

---

## The content graph

Every hike is a **graph of stops**. Each stop is a data node — this is what Session 4 builds, and what lets the game grow without touching engine code. A stop node roughly holds:

```json
{
  "id": "fork_ridge_01",
  "type": "choice",              // "choice" | "beat" | "ending"
  "trigger": "distance",         // distance | state | biome | rare | authored | timeofday
  "biome": "alpine",
  "prompt": "The trail splits at a cairn.",
  "landmark": "signpost",        // what scrolls in and the hiker walks up to
  "options": [
    {
      "label": "Take the high ridge",
      "effects": { "energy": -1 },
      "next": "vista_castle_01"   // where this branch goes
    },
    {
      "label": "Follow the low path",
      "effects": {},
      "next": "forest_segment_03"
    }
  ]
}
```

Beats and endings are the same shape with no `options` (or a single "continue"):

```json
{
  "id": "vista_castle_01",
  "type": "ending",
  "trigger": "authored",
  "biome": "alpine",
  "prompt": "The ridge opens onto a cliff — far below, a castle.",
  "landmark": "vista",
  "setpiece": "castle_vista"      // the big art moment
}
```

**Why this shape:** duration is free because the graph is *stitched* — a procedural spine picks biome segments and slots authored set-pieces and choice snippets in, so a small library of nodes produces a near-endless variety of journeys. A short branch is a 15-minute hike; a long chain is an hour. Same deck of cards, different hand each time.

---

## Rare encounters — the wonder layer

The single best hook for an ambient game: a rare sighting you get to **keep**.

### Rarity philosophy

A flat per-check percentage is *memoryless* — it never feels "due," and pure bad luck could mean months with no sighting, which can quietly sting. **We are NOT using a pity ramp** (a hidden counter that raises the odds the longer you've gone). Instead, the **lucky hat** solves the same "don't be cruel" problem in a way that feels *active* rather than passive.

### The lucky hat (the chosen mechanic)

- A rare creature's own rate is set **very low** (e.g. ~0.01%) — effectively **mythical**. At that rate the creature is a legend you'd almost never trip over by chance.
- You **find a lucky hat** (itself a rare pickup). **Wearing it** boosts that creature's odds dramatically (e.g. to ~10%) for **15 minutes of hiking time**, then it **"blows away"** on a gust.
- So the hat isn't really a booster — it's the **door**. Rarity moves *off the creature and onto the hat*, which means:
  - **The hat's drop rate is the real dial** you tune (it decides how often each player gets their shot).
  - You get **two tiers of legend for free**: the hat-assisted sighting (attainable, exciting) and the raw no-hat sighting (almost impossible — a genuine campfire story).
- **Everyone finds hats eventually**, so everyone eventually gets a payoff — but as a *lucky discovery you act on*, never an invisible counter. Same warmth as a pity ramp, better feeling.

**Tuning targets:**
- The window ticks in **hiking time**, not wall-clock — it pauses at the campfire on logout. (Otherwise you'd find a hat, get called away, and lose it to the wind.)
- Aim for **~4-in-5** sighting within a hat window: reliable enough to be worth the excitement, uncertain enough that the odd dry hat is its own small story.
- Two knobs together produce the feel: **how often you roll** and **how big the boost is**. Tune them as a pair, not one magic number.

**Make it sing** — the hat lights up every system at once:
- It's **visibly on the hiker**.
- A "lucky" **shimmer layer fades into the music** (see AUDIO.md — this is exactly what the stackable stems are for). The world audibly *brightens*.
- Maybe the **light warms** a touch.
- "Blows away" is an **animated beat** — the hat lifts and tumbles down the trail as the shimmer fades out — a charming goodbye, not a silent stat reset.

### Capturing the moment (not a gamey popup)

A "🏆 Achievement Unlocked!" toast would cheapen it and is the wrong voice for a calm hike. Two keepsakes instead, and we want **both**:

- **The field journal** — the *collection*. A spotter's guide where each creature starts as a blank `???` **silhouette** and fills in with **color, date, and biome** the first time you see it. The empty slot you keep glancing at *is* the anticipation. It's the anti-doomscroll collectathon: calm, personal, about discovery not score.
- **The photo** — the *memento*, and the most literal answer to "capture the moment." At the instant the rare thing is on screen, **snapshot the game canvas** to a little pixel **Polaroid**: framed, captioned, dated ("Yeti — spotted 3 March, the only one so far"). Each is unique because the framing is whatever the world looked like that second. A **share** button (Web Share API) makes it native on mobile — the nice irony of an anti-Instagram game producing the one thing worth sharing.

**Tech notes:** a pixel snapshot is a few KB; store **photos in IndexedDB** (images belong there, not localStorage). Journal state and sighting flags live in the normal save.

### Open decisions (not yet locked — decide during Session 6)

- **Where hats come from:** cleanest is a rare **trailside pickup** (a nice recursion — a rare find that makes rare things findable). But **decision-gating** them to riskier/longer paths would give your yes/no choices real weight. Easy to **blend** both.
- **One universal hat vs themed charms:** a **frost charm** that only boosts snow creatures ties into biome-gating and becomes its own journal collectible — richer, but more assets. **Start universal, split later.**
- **Conditional rarity:** consider gating the rarest creatures to fitting conditions (yeti = snow biome, at night, past a certain distance) so a sighting is *contextual and earned*, not just lucky.

---

## The campfire (logout / return)

Because progress only advances while watching, closing the app needs a graceful answer — and we make it a *reward*, not a pause:

- On logout, the hiker **makes camp** — a tent-and-campfire rest scene.
- On return, that scene **greets you**; a "continue hiking" tap resumes exactly where you left off.
- Cheap to build: it's really just a saved "at camp" state and a scene you show on return.

---

## Calm-design principles (steer by these)

- **Interleave beats and choices** so it never feels like a questionnaire — plenty of pure walking.
- **Vary the weight.** Most stops light or flavorful; only the occasional consequential fork. All-heavy is stressful; all-trivial is pointless.
- **Keep consequences soft.** No death, no harsh failure — a "bad" outcome is a longer path, a tired hiker, or a missed sighting.
- **Most choices can feel meaningful without being mechanical.** The act of choosing and watching the world respond *is* the reward; only some choices need to truly move state or branch the route. (You can write a hundred flavorful moments where only twenty change anything — keeps the authoring load light.)
- **Everything distills to two options.** The A/B constraint is what keeps it glanceable on a phone.
