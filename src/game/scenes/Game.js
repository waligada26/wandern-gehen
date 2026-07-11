import { Scene, TintModes } from 'phaser';
import { content } from '../content-load';
import { Spine, EXIT } from '../spine';
import { writeSave } from '../save';
import { savePhoto, latestPhoto, sharePhoto } from '../photos';
import {
    unlockAudio, setWalking, setShimmer, isMuted, toggleMuted,
    playDecisionChime, playArrivalChime, playSightingSting
} from '../audio';

//  The world is 4 horizontal bands (back to front), each scrolling
//  right-to-left at its own speed — slower = further away (parallax).
//  Wanda never moves; the world slides past her.
//  ANCHORING RULE: adjacent bands must OVERLAP, never merely touch. The
//  path band's grass lip is transparent between blades until its row 14
//  (screen y=474), so whatever sits behind it must stay opaque through
//  that zone. mid runs to y=490 (16px buried behind the path); far runs
//  to y=460 and is covered by mid's continuous understory. A band whose
//  element bases end AT a boundary will flash background through the lip.
const LAYERS = [
    { key: 'clouds', top: 30,  height: 180, speed: 6 },
    //  far's painted haze top dissolves into the matching background sky.
    { key: 'far',    top: 340, height: 120, speed: 14 },
    { key: 'mid',    top: 350, height: 140, speed: 32 },
    { key: 'path',   top: 460, height: 180, speed: 70 },
    //  A4.5 near-foreground overlay: sparse tufts/ferns that brush PAST
    //  the hiker — the only band in front of her. depth 12: above Wanda
    //  (10) and the worn hat (11), below the day-wash (15) so it tints.
    { key: 'overlay', top: 462, height: 60, speed: 91, depth: 12 }
];

//  Every scenery texture is TEX_W wide and tiles seamlessly. The painted
//  woodland layers (Section A) are built to loop: sparse elements are
//  duplicated across the wrap point, continuous strips are edge-matched.
const TEX_W = 360;

const GROUND_Y = 478;       // where feet sit on the path band
const WANDA_X = 110;

const PATH_SPEED = LAYERS[3].speed;   // world speed at Wanda's feet, px/s
const WALK_MPS = 1.4;                 // hiking pace ≈ 5 km/h; the distance clock's rate

//  Landmark spacing (GAME-DESIGN.md → Timing): a hard floor so stretches of
//  pure walking stay a feature, plus the average of two random rolls — which
//  makes comfortable medium gaps common and extremes rare.
const GAP_FLOOR_S = 30;
const GAP_ROLL_S = 60;

//  Where the landmark is, relative to Wanda, when she stops "at" it.
const STOP_AHEAD = 56;

//  The state a hike carries (GAME-DESIGN.md → state model). Soft stakes:
//  values clamp to 0..5 and running low never fails anything.
const STATE_START = { water: 3, energy: 3, morale: 3 };
const STATE_MAX = 5;

//  ?fast in the URL shrinks gaps and boosts rare odds 10-100× — for
//  testing, never the real pace.
const FAST = new URLSearchParams(window.location.search).has('fast');

//  --- rare encounters (GAME-DESIGN.md → rare encounters) ---
//  The dice roll once per walked interval, so odds live on the distance
//  clock like everything else. Rarity sits on the HAT, not the creature:
//  the fox's bare rate is mythical; a worn hat opens a ~4-in-5 window.
const ROLL_EVERY_M = 10;
const HAT_RATE = FAST ? 0.4 : 0.0026;         // ≈ one hat per 45 hiking minutes
const HAT_WINDOW_M = FAST ? 126 : 1260;       // 15 minutes of hiking time
const FOX_RATE_BARE = 0.00005;                // ~0.01%/roll — a campfire story
const FOX_RATE_HAT = FAST ? 0.35 : 0.013;     // ≈ 80% chance within one window

//  --- the day/night wash ---
//  A full-scene colour overlay that drifts with walked distance, so the day
//  advances only while she walks and pauses at stops and at camp. One full
//  day per ~10 minutes of walking; ?fast compresses it 10× like everything
//  else, so a whole day fits inside a test run.
const DAY_CYCLE_M = FAST ? 84 : 840;          // 840 m ≈ 10 min at WALK_MPS

//  Palette stops around the loop (phase 0..1), lerped piecewise. Dwell is
//  shaped by doubling stops: long midday and golden hour, a brief night.
//  Tune colours/alphas here.
const DAY_PALETTE = [
    { at: 0.00, color: 0xf7a58c, alpha: 0.15 },   // dawn — soft rose/peach
    { at: 0.10, color: 0xfff6e8, alpha: 0.05 },   // morning settles
    { at: 0.45, color: 0xfff6e8, alpha: 0.05 },   // ...long midday dwell
    { at: 0.58, color: 0xffa54f, alpha: 0.22 },   // golden hour
    { at: 0.72, color: 0xffa54f, alpha: 0.22 },   // ...golden dwell
    { at: 0.82, color: 0xa05fa8, alpha: 0.30 },   // dusk — violet/magenta
    { at: 0.90, color: 0x1e3a6e, alpha: 0.30 },   // night — deep blue, not black
    { at: 0.96, color: 0x1e3a6e, alpha: 0.30 }    // ...brief deep night, then dawn
];

//  Silhouettes must stay readable at night — the wash never exceeds this.
const DAY_WASH_MAX_ALPHA = 0.35;

//  --- biome palettes ---
//  Base colours for the three scenery bands, applied as image tints — the
//  band textures are painted in white/grays so a tint IS the band colour
//  (a multiply-tint can only darken, never recolour, a pre-coloured
//  texture). The day/night wash and linger tints composite on top,
//  unchanged. Tune freely; fg is the path band.
const BIOME_PALETTES = [
    { key: 'forest',  fg: 0x3d5a3d, mid: 0x4a6b4a, far: 0x5c7a5c },
    { key: 'meadow',  fg: 0xc2b280, mid: 0x9caf6a, far: 0xc9c58e },
    { key: 'coast',   fg: 0xd9c9a3, mid: 0x6bb0b8, far: 0xbcd6e0 },
    { key: 'wetland', fg: 0x6a7a55, mid: 0x7d9b70, far: 0x9fb08a },
    { key: 'alpine',  fg: 0x8a8f9c, mid: 0x9aa6b5, far: 0xc3ccd8 },
    { key: 'snow',    fg: 0xe8ecf2, mid: 0xb9c4d4, far: 0xd6dde8 }
];

//  How far she walks through each biome before the next one, and how many
//  walked meters the crossfade spans (~13 s of walking at WALK_MPS —
//  woods drifting into meadow, never a scene swap). ?fast compresses the
//  biome length 10× like everything else.
const BIOME_LENGTH_M = FAST ? 150 : 1500;
const BIOME_FADE_M = 18;

const UI_FONT = {
    fontFamily: 'Courier New, monospace',
    color: '#f4ede0',
    align: 'center'
};

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    init (data)
    {
        //  A save handed over from the Camp scene, or null for a fresh hike.
        this.savedHike = data ? data.save : null;
    }

    preload ()
    {
        //  Standing pose (map in hand) — used when she pauses at landmarks.
        this.load.image('wanda-stand', 'assets/wanda-stand-east.png');
        //  8-frame walk cycle, one 64×64 frame per step position.
        this.load.spritesheet('wanda-walk', 'assets/wanda-walk-east.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        //  The woodland parallax layers (Section A) — painted art, one set
        //  per setting eventually; the spine's virtual setting picks the
        //  set from Section D on.
        this.load.image('clouds', 'assets/wood-clouds.png');
        this.load.image('far', 'assets/wood-far.png');
        this.load.image('mid', 'assets/wood-mid.png');
        this.load.image('path', 'assets/wood-path.png');
        this.load.image('overlay', 'assets/wood-overlay.png');
    }

    create ()
    {
        this.paintSignpost();
        this.paintCairn();
        this.paintStream();
        this.paintHat();
        this.paintFox();
        this.paintDeer();
        this.paintYeti();

        //  Each band is two copies of its texture side by side. Both slide
        //  left; when the pair has moved one full tile, it snaps back — the
        //  copies are identical, so the snap (and the seam) is invisible.
        this.layers = LAYERS.map(cfg => ({
            a: this.add.image(0, cfg.top, cfg.key).setOrigin(0, 0).setDepth(cfg.depth || 0),
            b: this.add.image(TEX_W, cfg.top, cfg.key).setOrigin(0, 0).setDepth(cfg.depth || 0),
            speed: cfg.speed,
            offset: 0
        }));

        //  Wanda, feet planted on the path (origin bottom-center).
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('wanda-walk', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.wanda = this.add.sprite(WANDA_X, GROUND_Y, 'wanda-walk').setOrigin(0.5, 1).setDepth(10);
        this.wanda.play('walk');

        //  The lucky hat rides just above her head when worn.
        this.hatSprite = this.add.image(WANDA_X + 7, GROUND_Y - 57, 'hat')
            .setOrigin(0.5, 1).setDepth(11).setVisible(false);

        //  The day/night wash: above the world and Wanda (≤11), below the
        //  HUD (20), cards (100), and a linger tint (90) — so a linger's
        //  colour composites on top and evening reads warm-over-blue.
        //  Object alpha stays 1; updateDayWash drives the FILL alpha.
        //  (Session 9 bug, caught in Section A: created at setAlpha(0),
        //  the wash never rendered — fill alpha × object alpha 0 = 0.)
        this.dayWash = this.add.rectangle(180, 320, 360, 640, 0xffffff)
            .setDepth(15).setFillStyle(0xffffff, 0);

        //  The distance clock. Advances ONLY while walking — so it pauses at
        //  every stop and at the campfire. Everything times off it.
        this.distanceM = this.savedHike ? this.savedHike.distanceM : 0;
        this.walking = true;

        //  Linger beats ease this 1→0→1 instead of hard-stopping. update()
        //  multiplies every world speed AND the distance step by it, so the
        //  clock, the hat window, and the rare dice all pause with the
        //  scenery for free. Card stops still use `walking` as before.
        this.scrollScale = 1;
        this.lingering = false;
        this.distanceText = this.add.text(346, 14, '0.0 km', {
            ...UI_FONT, fontSize: 15, color: '#476578'
        }).setOrigin(1, 0).setResolution(3).setDepth(20);
        this.updateDayWash();   // a restored hike resumes at its saved time of day
        this.updateBiomeTint(); // ...and in its saved biome

        //  The hike's state, nudged by choice effects, gating some options.
        this.state = this.savedHike ? { ...this.savedHike.state } : { ...STATE_START };

        //  Rare-encounter state: the journal (first sightings), the hat
        //  window (in walked meters), and the roll odometer.
        this.journal = this.savedHike ? (this.savedHike.journal || {}) : {};
        //  Flags default to {} so saves written before flags existed
        //  still load (no SAVE_VERSION bump needed for an added field).
        this.flags = this.savedHike ? (this.savedHike.flags || {}) : {};
        this.hatRemainingM = this.savedHike ? (this.savedHike.hatRemainingM || 0) : 0;
        this.hatSprite.setVisible(this.hatRemainingM > 0);
        this.lastRollM = this.distanceM;
        this.special = null;         // hat pickup or creature currently on screen

        this.stateText = this.add.text(14, 14, '', {
            ...UI_FONT, fontSize: 13, color: '#476578', align: 'left'
        }).setOrigin(0, 0).setResolution(3).setDepth(20);
        this.refreshStateText();

        //  Where we are in the content graph (src/game/content.json).
        //  If the save points at an unresolved stop whose landmark had
        //  already arrived, the restored spacing value is in the past —
        //  so the landmark simply scrolls in again and re-asks. That's
        //  the intended behavior, not a bug.
        this.currentId = this.savedHike ? this.savedHike.currentId : content.start;
        this.landmark = null;        // the prop currently on (or entering) screen
        this.landmarkArmed = false;  // true = it's a live stop; false = already visited
        this.card = null;
        this.cardKind = null;
        if (this.savedHike)
        {
            this.nextLandmarkAtM = this.savedHike.nextLandmarkAtM;
        }
        else
        {
            this.rollNextLandmark();
        }

        //  The spine deals segments (fixed order this session — see
        //  spine.js). Initialized here, before any input can resolve a
        //  stop, so a restored tap on a terminal node deals correctly.
        //  The current segment is always DERIVED from currentId, never
        //  stored — test teleports (window.__wg) self-heal. A save with
        //  no spine key (pre-spine) seeds history from currentId alone.
        this.spine = new Spine(content.segments,
            this.savedHike ? this.savedHike.spine : null,
            this.currentId);

        //  The field journal's little tab, bottom-left thumb reach.
        const journalTab = this.add.rectangle(56, 614, 88, 30, 0x2e2a26, 0.85)
            .setDepth(20).setInteractive({ useHandCursor: true });
        this.add.text(56, 614, 'journal', {
            ...UI_FONT, fontSize: 12, color: '#d9b380'
        }).setOrigin(0.5).setResolution(3).setDepth(21);
        journalTab.on('pointerdown', () => this.openJournal());

        //  Saving: after every resolved stop, on a slow autosave tick while
        //  walking, and when the tab is hidden (phone locked, app switched —
        //  the moment Wanda "makes camp").
        this.time.addEvent({ delay: 5000, loop: true, callback: () => this.saveNow() });
        this.onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') this.saveNow();
        };
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.events.on('shutdown', () =>
            document.removeEventListener('visibilitychange', this.onVisibilityChange));

        this.saveNow();

        //  Sound: browsers need a tap before audio may start. Every tap
        //  offers one; once running, sync the layers to the game state.
        this.input.on('pointerdown', () => {
            unlockAudio().then(() => {
                setWalking(this.walking);
                setShimmer(this.hatRemainingM > 0);
            });
        });

        //  The mute toggle, bottom-right — remembered between sessions.
        const soundTab = this.add.rectangle(304, 614, 88, 30, 0x2e2a26, 0.85)
            .setDepth(20).setInteractive({ useHandCursor: true });
        this.soundText = this.add.text(304, 614, isMuted() ? 'sound off' : 'sound on', {
            ...UI_FONT, fontSize: 12, color: '#d9b380'
        }).setOrigin(0.5).setResolution(3).setDepth(21);
        soundTab.on('pointerdown', () =>
            this.soundText.setText(toggleMuted() ? 'sound off' : 'sound on'));

        window.__wg = this;   // debug/test handle; harmless in production
    }

    saveNow ()
    {
        writeSave({
            distanceM: this.distanceM,
            state: this.state,
            currentId: this.currentId,
            nextLandmarkAtM: this.nextLandmarkAtM,
            journal: this.journal,
            hatRemainingM: this.hatRemainingM,
            flags: this.flags,
            spine: this.spine.serialize()
        });
    }

    update (time, delta)
    {
        if (!this.walking) return;   // stopped: world holds its breath

        const dt = delta / 1000;
        const scale = this.scrollScale;
        const stepM = WALK_MPS * scale * dt;

        for (const layer of this.layers)
        {
            layer.offset = (layer.offset + layer.speed * scale * dt) % TEX_W;
            const x = -Math.round(layer.offset);   // whole pixels only — keeps the grid crisp
            layer.a.x = x;
            layer.b.x = x + TEX_W;
        }

        this.distanceM += stepM;
        this.distanceText.setText((this.distanceM / 1000).toFixed(1) + ' km');
        this.updateDayWash();
        this.updateBiomeTint();

        //  The hat window burns down in walked meters — hiking time, never
        //  wall-clock, so it pauses at stops and at camp.
        if (this.hatRemainingM > 0)
        {
            this.hatRemainingM -= stepM;
            this.refreshStateText();
            if (this.hatRemainingM <= 0) this.blowHatAway();
        }

        //  The rare dice: one roll per walked interval.
        while (this.distanceM - this.lastRollM >= ROLL_EVERY_M)
        {
            this.lastRollM += ROLL_EVERY_M;
            this.rollForSpecials();
        }

        //  Time (in walked distance) for the next stop? Spawn its landmark
        //  off the right edge — it approaches with the world, never pops
        //  from a timer. Specials get the trail to themselves first.
        if (!this.landmark && !this.special && this.distanceM >= this.nextLandmarkAtM)
        {
            const node = content.nodes[this.currentId];
            const texture = this.textures.exists(node.landmark) ? node.landmark : 'signpost';
            this.landmark = this.add.image(TEX_W + 40, GROUND_Y + 4, texture)
                .setOrigin(0.5, 1)
                .setDepth(5);
            this.landmarkArmed = true;
        }

        if (this.landmark)
        {
            //  The landmark rides the path band: same speed, same direction.
            this.landmark.x -= PATH_SPEED * scale * dt;

            if (this.landmarkArmed && this.landmark.x <= WANDA_X + STOP_AHEAD)
            {
                this.arriveAtStop();
            }
            else if (this.landmark.x < -40)
            {
                this.landmark.destroy();
                this.landmark = null;
            }
        }

        if (this.special)
        {
            this.special.sprite.x -= PATH_SPEED * scale * dt;

            if (!this.special.met && this.special.sprite.x <= WANDA_X + 90)
            {
                this.special.met = true;
                if (this.special.type === 'hat') this.meetHat();
                else this.meetCreature(this.special.creature);
            }
        }
    }

    //  --- the stop-and-choose loop, driven by the content graph ---

    rollNextLandmark ()
    {
        //  A node may pin its own arrival distance (gapM, in walked
        //  meters) — used by follow-up beats so a payoff lands on the
        //  heels of the tap that caused it, not after the full wander gap.
        const upcoming = content.nodes[this.currentId];
        if (upcoming && typeof upcoming.gapM === 'number')
        {
            this.nextLandmarkAtM = this.distanceM + upcoming.gapM;
            return;
        }

        const rollA = Math.random() * GAP_ROLL_S;
        const rollB = Math.random() * GAP_ROLL_S;
        const gapS = (GAP_FLOOR_S + (rollA + rollB) / 2) / (FAST ? 10 : 1);
        this.nextLandmarkAtM = this.distanceM + gapS * WALK_MPS;
    }

    arriveAtStop ()
    {
        this.landmarkArmed = false;   // resolved — when we resume, she walks past it

        const node = content.nodes[this.currentId];

        //  A beat with a `linger` object is a held scene moment, not a card.
        if (node.type === 'beat' && node.linger)
        {
            this.startLinger(node);
            return;
        }

        this.pauseWalk();

        //  The soft chime that ties off an arrival (GAME-DESIGN → Timing).
        if (node.type === 'ending') playArrivalChime();
        else playDecisionChime();

        //  A beat of quiet before the card — arrival first, question second.
        this.time.delayedCall(450, () => {
            this.card = node.type === 'ending' ? this.buildEnding(node) : this.buildCard(node);
            this.cardKind = node.type;
            this.tweens.add({ targets: this.card, alpha: 1, duration: 300 });
        });
    }

    //  A stopped hiker mid-stride reads as a glitch; the standing pose
    //  (checking her map) reads as "paused to think".
    pauseWalk ()
    {
        this.walking = false;
        this.wanda.stop();
        this.wanda.setTexture('wanda-stand');
        this.hatSprite.setPosition(WANDA_X + 7, GROUND_Y - 57);
        setWalking(false);
    }

    resumeWalk ()
    {
        this.wanda.setTexture('wanda-walk');
        this.wanda.play('walk');
        this.walking = true;
        setWalking(true);
    }

    dismissCard ()
    {
        const card = this.card;
        this.card = null;
        this.cardKind = null;
        this.tweens.add({
            targets: card,
            alpha: 0,
            duration: 250,
            onComplete: () => card.destroy()
        });
    }

    //  Apply a node's/option's effects to hike state (softly clamped).
    applyEffects (effects)
    {
        for (const [key, delta] of Object.entries(effects || {}))
        {
            this.state[key] = Math.max(0, Math.min(STATE_MAX, (this.state[key] || 0) + delta));
        }
        this.refreshStateText();
    }

    meetsRequires (requires)
    {
        return Object.entries(requires || {}).every(([key, min]) => (this.state[key] || 0) >= min);
    }

    refreshStateText ()
    {
        const { water, energy, morale } = this.state;
        let line = `water ${water} · energy ${energy} · morale ${morale}`;
        if (this.hatRemainingM > 0)
        {
            const minutes = Math.ceil(this.hatRemainingM / WALK_MPS / 60);
            line += ` · hat ${minutes}m`;
        }
        this.stateText.setText(line);
    }

    //  Resolve the current stop: apply what the tap chose, then advance.
    resolveStop (effects, next, flags)
    {
        this.applyEffects(effects);
        this.applyFlags(flags);
        this.dismissCard();
        this.resumeWalk();
        this.advanceTo(next);
    }

    //  The single advance funnel — every resolved stop (card tap, linger
    //  end, new trail) moves the graph through here and nowhere else.
    //  A weighted `next` is rolled HERE, at resolve time, and saved in
    //  the same breath — so reloading before the follow-up arrives
    //  replays the same outcome instead of re-rolling it.
    advanceTo (next)
    {
        //  One resolved stop = one tick of the world-state timers
        //  (wet/misty are counted in stops). Interrupts (hat, fox)
        //  bypass advanceTo, so they don't consume stops.
        this.spine.onStopResolved();

        let id = this.pickNext(next);
        //  "@exit" = this segment is done; the spine deals the next
        //  one. Checked AFTER pickNext because an exit can live inside
        //  a weighted array (coin_stream). currentId never holds the
        //  sentinel — it's substituted before assignment, so saves and
        //  the spawn check only ever see real node ids.
        if (id === EXIT)
        {
            id = this.spine.nextEntry(this.spine.segmentOf(this.currentId));
        }
        this.currentId = id;
        this.rollNextLandmark();
        this.saveNow();
    }

    //  `next` is a node id, or an array of weighted outcomes:
    //  [{ "id": "...", "weight": 90 }, { "id": "...", "weight": 10 }].
    //  Weights are placeholders; real rarity tuning is Session 6.
    pickNext (next)
    {
        if (!Array.isArray(next)) return next;
        const total = next.reduce((sum, outcome) => sum + outcome.weight, 0);
        let roll = Math.random() * total;
        for (const outcome of next)
        {
            roll -= outcome.weight;
            if (roll <= 0) return outcome.id;
        }
        return next[next.length - 1].id;   // float dust — take the last
    }

    //  Flags: one-way "this happened" markers, kept OFF the stats bag so
    //  they can never collide with effects keys or the 0–5 clamp.
    //  Write-only for now; the read side (conditional prompts, flag
    //  requires) comes later.
    applyFlags (flags)
    {
        for (const name of flags || []) this.flags[name] = true;
    }

    //  An ending resolves into a fresh trail from the top of the graph.
    startNewTrail ()
    {
        this.distanceM = 0;
        this.lastRollM = 0;
        this.state = { ...STATE_START };
        //  this.flags is deliberately NOT reset — flags are cross-trail
        //  markers, and future payoffs (a glove gone on a later hike, a
        //  guestbook that remembers) depend on them outliving the trail
        //  that set them.
        this.refreshStateText();
        //  Per-hike spine state (history, world timers, target) resets
        //  with the trail. LOCKED (v1): recency resets too — history is
        //  purely per-hike. Revisit trigger: persist recency across
        //  trails if back-to-back hikes feel samey.
        this.spine.resetForNewTrail(content.start);
        this.resolveStop({}, content.start);
    }

    //  --- the day/night wash ---

    //  Where we are in the day: walked meters, wrapped around the cycle.
    updateDayWash ()
    {
        const phase = (this.distanceM % DAY_CYCLE_M) / DAY_CYCLE_M;
        const { color, alpha } = this.dayWashAt(phase);
        this.dayWash.setFillStyle(color, Math.min(alpha, DAY_WASH_MAX_ALPHA));
    }

    //  --- biome tinting ---

    //  Band colours at this walked distance: the current biome's palette,
    //  crossfaded into the next one over the last BIOME_FADE_M meters of
    //  each segment (the fade completes exactly at the boundary).
    biomePaletteAt (m)
    {
        const n = BIOME_PALETTES.length;
        const cur = BIOME_PALETTES[Math.floor(m / BIOME_LENGTH_M) % n];
        const nxt = BIOME_PALETTES[(Math.floor(m / BIOME_LENGTH_M) + 1) % n];
        const into = m % BIOME_LENGTH_M;
        const fadeStart = BIOME_LENGTH_M - BIOME_FADE_M;
        if (into < fadeStart) return cur;
        const t = (into - fadeStart) / BIOME_FADE_M;
        return {
            fg: this.lerpColor(cur.fg, nxt.fg, t),
            mid: this.lerpColor(cur.mid, nxt.mid, t),
            far: this.lerpColor(cur.far, nxt.far, t)
        };
    }

    updateBiomeTint ()
    {
        //  TODO(parked → Section D, setting→scenery): neutralized with the
        //  painted woodland layers (A1 decision (b)). A multiply-tint can
        //  only darken, so it would drag painted art through muddy color
        //  casts — scenery layers are no longer tinted at all, and the
        //  meter-based BIOME_PALETTES cycle is retired with it. When
        //  Section D adds per-setting layer sets, scenery switches on the
        //  spine's virtual setting (with crossfades) INSTEAD of walked
        //  meters — wire that here. The alpha-blend day-wash and linger
        //  tints are separate systems and still composite on top.
    }

    //  Piecewise-linear colour/alpha between palette stops, wrapping the
    //  last stop back around to the first (night fading into dawn).
    dayWashAt (phase)
    {
        const n = DAY_PALETTE.length;
        for (let i = 0; i < n; i++)
        {
            const a = DAY_PALETTE[i];
            const b = DAY_PALETTE[(i + 1) % n];
            const end = b.at > a.at ? b.at : b.at + 1;       // wrap segment spans 1.0
            const p = phase >= a.at ? phase : phase + 1;
            if (p >= a.at && p <= end)
            {
                const t = end === a.at ? 0 : (p - a.at) / (end - a.at);
                return {
                    color: this.lerpColor(a.color, b.color, t),
                    alpha: a.alpha + (b.alpha - a.alpha) * t
                };
            }
        }
        return { color: DAY_PALETTE[0].color, alpha: DAY_PALETTE[0].alpha };
    }

    lerpColor (a, b, t)
    {
        const r = Math.round((a >> 16 & 0xff) + ((b >> 16 & 0xff) - (a >> 16 & 0xff)) * t);
        const g = Math.round((a >> 8 & 0xff) + ((b >> 8 & 0xff) - (a >> 8 & 0xff)) * t);
        const bl = Math.round((a & 0xff) + ((b & 0xff) - (a & 0xff)) * t);
        return (r << 16) | (g << 8) | bl;
    }

    //  --- linger beats: the scene itself is the card ---

    //  The world eases to a stop, the prompt floats in as a caption (no
    //  button), an optional tint softens the light, and after the hold it
    //  all reverses and she walks on to the node's `next` by itself.
    startLinger (node)
    {
        this.lingering = true;
        playDecisionChime();

        this.lingerCaption = this.add.text(180, 540, node.prompt, {
            ...UI_FONT, fontSize: 15, wordWrap: { width: 304 }
        }).setOrigin(0.5).setResolution(3).setDepth(100).setAlpha(0)
            .setStroke('#2e2a26', 4);
        this.tweens.add({ targets: this.lingerCaption, alpha: 1, duration: 450, delay: 250 });

        this.lingerTint = null;
        const tintColor = node.linger.tint
            ? parseInt(String(node.linger.tint).replace('#', ''), 16)
            : NaN;
        if (!Number.isNaN(tintColor))
        {
            this.lingerTint = this.add.rectangle(180, 320, 360, 640, tintColor)
                .setDepth(90).setAlpha(0);
            this.tweens.add({ targets: this.lingerTint, alpha: 0.25, duration: 600 });
        }

        //  Ease the world (and with it the distance clock) down to a stop;
        //  she stops walking the moment the ground does.
        this.tweens.add({
            targets: this,
            scrollScale: 0,
            duration: 500,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.wanda.stop();
                this.wanda.setTexture('wanda-stand');
                setWalking(false);
                this.applyEffects(node.effects);
                this.time.delayedCall(node.linger.ms || 3000, () => this.endLinger(node));
            }
        });
    }

    endLinger (node)
    {
        //  Fade the moment back out...
        this.tweens.add({
            targets: this.lingerCaption,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                this.lingerCaption.destroy();
                this.lingerCaption = null;
            }
        });
        if (this.lingerTint)
        {
            this.tweens.add({
                targets: this.lingerTint,
                alpha: 0,
                duration: 600,
                onComplete: () => {
                    this.lingerTint.destroy();
                    this.lingerTint = null;
                }
            });
        }

        //  ...and ease the walk back in.
        this.wanda.setTexture('wanda-walk');
        this.wanda.play('walk');
        setWalking(true);
        this.tweens.add({
            targets: this,
            scrollScale: 1,
            duration: 500,
            ease: 'Sine.easeIn',
            onComplete: () => { this.lingering = false; }
        });

        //  Advance through the same funnel as a card resolution — effects
        //  were already applied when the hold began.
        this.advanceTo(node.next);
    }

    //  --- rare encounters ---

    rollForSpecials ()
    {
        //  One live moment on the trail at a time keeps everything readable.
        //  (A landmark already visited and scrolling away doesn't count —
        //  it shouldn't suppress luck.)
        if (this.special || this.card || this.lingering
            || (this.landmark && this.landmarkArmed)) return;

        if (this.hatRemainingM <= 0 && Math.random() < HAT_RATE)
        {
            this.spawnSpecial('hat', 'hat');
            return;
        }

        const foxRate = this.hatRemainingM > 0 ? FOX_RATE_HAT : FOX_RATE_BARE;
        if (Math.random() < foxRate)
        {
            this.spawnSpecial('creature', 'fox');
        }
    }

    spawnSpecial (type, texture)
    {
        this.special = {
            type,
            creature: type === 'creature' ? texture : null,
            met: false,
            sprite: this.add.image(TEX_W + 30, GROUND_Y + 2, texture)
                .setOrigin(0.5, 1)
                .setDepth(6)
        };
    }

    clearSpecial ()
    {
        if (this.special)
        {
            this.special.sprite.destroy();
            this.special = null;
        }
    }

    //  A lucky hat, met on the trail — a real choice, not a pickup:
    //  wear it and the window opens, or leave it where it hangs. The
    //  rare roll is intentionally spent either way — a declined hat
    //  never comes back, so there's nothing to fish for by reloading.
    //  (A "save it for later" inventory is deliberately out of scope
    //  for now.)
    meetHat ()
    {
        this.pauseWalk();
        this.time.delayedCall(450, () => {
            this.cardKind = 'choice';
            this.card = this.buildStopCard(
                'A lucky hat, snagged on a bramble. Somehow it fits perfectly.',
                [
                    {
                        label: 'Wear it',
                        onTap: () => {
                            this.hatRemainingM = HAT_WINDOW_M;
                            this.hatSprite.setVisible(true);
                            setShimmer(true);    // the world audibly brightens
                            this.refreshStateText();
                            this.clearSpecial();
                            this.dismissCard();
                            this.resumeWalk();
                            this.saveNow();
                        }
                    },
                    {
                        label: 'Leave it on the bramble',
                        onTap: () => {
                            //  No effects; the hat falls behind at path
                            //  speed as she walks on, then it's gone.
                            const s = this.special.sprite;
                            this.special = null;
                            this.tweens.add({
                                targets: s,
                                x: -60,
                                duration: ((s.x + 60) / PATH_SPEED) * 1000,
                                onComplete: () => s.destroy()
                            });
                            this.dismissCard();
                            this.resumeWalk();
                            this.saveNow();
                        }
                    }
                ]);
            this.tweens.add({ targets: this.card, alpha: 1, duration: 300 });
        });
    }

    //  The wind takes it back: an animated goodbye, not a silent stat reset.
    blowHatAway ()
    {
        this.hatRemainingM = 0;
        setShimmer(false);   // the shimmer fades out with the goodbye
        this.refreshStateText();

        const gone = this.add.image(this.hatSprite.x, this.hatSprite.y, 'hat')
            .setOrigin(0.5, 1).setDepth(11);
        this.hatSprite.setVisible(false);

        this.tweens.add({
            targets: gone,
            x: -60,
            y: gone.y - 70,
            angle: -520,
            alpha: 0.2,
            duration: 2400,
            ease: 'Sine.easeIn',
            onComplete: () => gone.destroy()
        });
        this.saveNow();
    }

    //  A rare creature on the path. It meets your eyes; the moment is kept
    //  twice — a journal entry and a photo — before she walks on.
    meetCreature (creature)
    {
        this.pauseWalk();
        playSightingSting();

        //  First sighting fills the journal slot (date + biome).
        const node = content.nodes[this.currentId];
        const biome = (node && node.biome) || 'forest';
        const now = new Date();
        const dateNice = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
        if (!this.journal[creature])
        {
            this.journal[creature] = { date: dateNice, iso: now.toISOString(), biome };
        }
        this.saveNow();

        //  Let the moment sit for a breath, then snap the canvas exactly as
        //  it looks — fox, hiker, light — and make the Polaroid.
        this.time.delayedCall(700, () => {
            this.capturePhoto(creature, biome, dateNice, photo => {
                this.card = this.buildPolaroid(photo, () => {
                    //  the fox scurries off as she walks on
                    const s = this.special.sprite;
                    this.special = null;
                    this.tweens.add({
                        targets: s, x: -50, duration: 900, ease: 'Sine.easeIn',
                        onComplete: () => s.destroy()
                    });
                    this.dismissCard();
                    this.resumeWalk();
                    this.saveNow();
                });
                this.cardKind = 'polaroid';
                this.tweens.add({ targets: this.card, alpha: 1, duration: 300 });
            });
        });
    }

    //  Snapshot the live canvas, crop to the scene band around the moment,
    //  and store it in IndexedDB as a captioned keepsake.
    capturePhoto (creature, biome, dateNice, onReady)
    {
        const name = content.creatures[creature] ? content.creatures[creature].name : creature;
        const caption = `${name} — spotted ${dateNice} · ${biome}`;
        const finish = dataUrl => {
            const photo = {
                id: `${creature}-${Date.now()}`,
                creature, caption, biome,
                dateIso: new Date().toISOString(),
                dataUrl
            };
            savePhoto(photo).catch(() => {});
            const key = 'photo-' + photo.id;
            this.textures.once('addtexture-' + key, () => onReady({ ...photo, textureKey: key }));
            this.textures.addBase64(key, dataUrl);
        };

        const crop = image => {
            const c = document.createElement('canvas');
            c.width = 320; c.height = 150;
            //  the band of world around Wanda and the visitor
            c.getContext('2d').drawImage(image, 0, 390, 360, 170, 0, 0, 320, 150);
            finish(c.toDataURL('image/png'));
        };

        if (this.game.renderer.snapshot)
        {
            this.game.renderer.snapshot(image => crop(image));
        }
        else
        {
            crop(this.game.canvas);
        }
    }

    //  --- the field journal ---

    openJournal ()
    {
        if (this.card || this.lingering || !this.walking) return;   // not over a stop, not twice
        this.pauseWalk();
        this.cardKind = 'journal';
        this.card = this.buildJournal();
        this.tweens.add({ targets: this.card, alpha: 1, duration: 250 });
    }

    closeJournal ()
    {
        this.dismissCard();
        this.resumeWalk();
    }

    buildJournal ()
    {
        const children = [
            this.add.rectangle(180, 320, 360, 640, 0x14181f, 0.75),
            this.add.rectangle(180, 300, 312, 380, 0x2e2a26, 0.97),
            this.add.rectangle(180, 300, 312, 380).setStrokeStyle(2, 0xf4ede0, 0.35),
            this.add.text(180, 128, 'FIELD JOURNAL', {
                ...UI_FONT, fontSize: 13, color: '#d9b380'
            }).setOrigin(0.5, 0).setResolution(3)
        ];

        Object.entries(content.creatures).forEach(([id, meta], i) => {
            const y = 196 + i * 84;
            const seen = this.journal[id];

            children.push(this.add.rectangle(78, y, 56, 56, 0x14181f, 0.6));
            const icon = this.add.image(78, y, id);
            if (!seen) icon.setTint(0x14181f).setTintMode(TintModes.FILL);   // the ??? silhouette
            children.push(icon);

            children.push(this.add.text(116, y - 20, seen ? meta.name : '???', {
                ...UI_FONT, fontSize: 15, align: 'left'
            }).setOrigin(0, 0).setResolution(3));
            children.push(this.add.text(116, y + 2, seen
                ? `spotted ${seen.date} · ${seen.biome}`
                : 'not yet sighted', {
                ...UI_FONT, fontSize: 12, color: '#9a938a', align: 'left'
            }).setOrigin(0, 0).setResolution(3));

            if (seen)
            {
                const view = this.add.rectangle(268, y, 72, 30, 0x476578)
                    .setInteractive({ useHandCursor: true });
                view.on('pointerdown', () => this.openSavedPhoto(id));
                children.push(view, this.add.text(268, y, 'photo', {
                    ...UI_FONT, fontSize: 12
                }).setOrigin(0.5).setResolution(3));
            }
        });

        const close = this.add.rectangle(180, 464, 200, 44, 0x9ab873)
            .setInteractive({ useHandCursor: true });
        close.on('pointerdown', () => this.closeJournal());
        children.push(close, this.add.text(180, 464, 'Back to the trail', {
            ...UI_FONT, fontSize: 13, color: '#2e2a26'
        }).setOrigin(0.5).setResolution(3));

        return this.add.container(0, 0, children).setDepth(100).setAlpha(0);
    }

    //  Re-open a kept photo from the journal.
    openSavedPhoto (creature)
    {
        latestPhoto(creature).catch(() => null).then(photo => {
            if (!photo) return;
            const key = 'photo-' + photo.id;
            const show = () => {
                this.card.destroy();   // swap journal for the polaroid
                this.card = this.buildPolaroid({ ...photo, textureKey: key }, () => {
                    this.dismissCard();
                    this.resumeWalk();
                });
                this.cardKind = 'polaroid';
                this.card.setAlpha(1);
            };
            if (this.textures.exists(key)) show();
            else
            {
                this.textures.once('addtexture-' + key, show);
                this.textures.addBase64(key, photo.dataUrl);
            }
        });
    }

    //  --- cards, built from whatever node just arrived ---

    //  The one standard stop card: a bottom panel with the prompt and
    //  big thumb-zone buttons. `buttons` is one { label, enabled, onTap }
    //  for a beat's gentle continue, or two for a choice — everything
    //  that stops the walk (data nodes AND trail moments like the hat)
    //  goes through here, so every card looks and behaves identically.
    buildStopCard (promptText, buttons)
    {
        const children = [
            this.add.rectangle(180, 552, 336, 156, 0x2e2a26, 0.93),
            this.add.rectangle(180, 552, 336, 156).setStrokeStyle(2, 0xf4ede0, 0.35),
            this.add.text(180, 494, promptText, {
                ...UI_FONT, fontSize: 15, wordWrap: { width: 304 }
            }).setOrigin(0.5, 0).setResolution(3)
        ];

        const fills = [0x9ab873, 0xd9b380];
        buttons.forEach((btn, i) => {
            const x = buttons.length === 1 ? 180 : (i === 0 ? 97 : 263);
            const w = buttons.length === 1 ? 240 : 150;
            const enabled = btn.enabled !== false;
            const rect = this.add.rectangle(x, 585, w, 62, fills[i], enabled ? 1 : 0.35);
            const text = this.add.text(x, 585, btn.label, {
                ...UI_FONT, fontSize: 14, color: '#2e2a26', wordWrap: { width: w - 18 }
            }).setOrigin(0.5).setResolution(3).setAlpha(enabled ? 1 : 0.5);
            if (enabled)
            {
                rect.setInteractive({ useHandCursor: true });
                rect.on('pointerdown', btn.onTap);
            }
            children.push(rect, text);
        });

        return this.add.container(0, 0, children).setDepth(100).setAlpha(0);
    }

    //  A card built from whatever node just arrived.
    buildCard (node)
    {
        if (node.type === 'choice')
        {
            return this.buildStopCard(node.prompt, node.options.map(opt => ({
                label: opt.label,
                enabled: this.meetsRequires(opt.requires),
                onTap: () => this.resolveStop(opt.effects, opt.next, opt.flags)
            })));
        }
        //  beat: shows something, asks nothing — a single gentle button
        return this.buildStopCard(node.prompt, [
            { label: 'Walk on', onTap: () => this.resolveStop(node.effects, node.next) }
        ]);
    }

    //  The keepsake: a little framed print of the moment, with its caption,
    //  a share button, and the way back to the trail.
    buildPolaroid (photo, onWalkOn)
    {
        const share = this.add.rectangle(97, 585, 150, 62, 0x476578)
            .setInteractive({ useHandCursor: true });
        share.on('pointerdown', () => sharePhoto(photo));
        const walkOn = this.add.rectangle(263, 585, 150, 62, 0x9ab873)
            .setInteractive({ useHandCursor: true });
        walkOn.on('pointerdown', onWalkOn);

        return this.add.container(0, 0, [
            this.add.rectangle(180, 320, 360, 640, 0x14181f, 0.55),
            this.add.rectangle(180, 268, 268, 232, 0xf4ede0),        // the print
            this.add.image(180, 244, photo.textureKey).setDisplaySize(240, 112),
            this.add.text(180, 318, photo.caption, {
                ...UI_FONT, fontSize: 12, color: '#4a3e36', wordWrap: { width: 230 }
            }).setOrigin(0.5, 0).setResolution(3),
            this.add.rectangle(180, 552, 336, 156, 0x2e2a26, 0.93),
            this.add.rectangle(180, 552, 336, 156).setStrokeStyle(2, 0xf4ede0, 0.35),
            share,
            this.add.text(97, 585, 'Share', {
                ...UI_FONT, fontSize: 14
            }).setOrigin(0.5).setResolution(3),
            walkOn,
            this.add.text(263, 585, 'Walk on', {
                ...UI_FONT, fontSize: 14, color: '#2e2a26'
            }).setOrigin(0.5).setResolution(3)
        ]).setDepth(100).setAlpha(0);
    }

    //  An ending: the arrival screen — centered, unhurried, one button.
    buildEnding (node)
    {
        const button = this.add.rectangle(180, 402, 220, 56, 0x9ab873)
            .setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => this.startNewTrail());

        return this.add.container(0, 0, [
            this.add.rectangle(180, 320, 320, 250, 0x2e2a26, 0.96),
            this.add.rectangle(180, 320, 320, 250).setStrokeStyle(2, 0xf4ede0, 0.35),
            this.add.text(180, 228, 'JOURNEY\'S END', {
                ...UI_FONT, fontSize: 12, color: '#d9b380'
            }).setOrigin(0.5, 0).setResolution(3),
            this.add.text(180, 258, node.prompt, {
                ...UI_FONT, fontSize: 15, wordWrap: { width: 280 }
            }).setOrigin(0.5, 0).setResolution(3),
            button,
            this.add.text(180, 402, 'Begin a new trail', {
                ...UI_FONT, fontSize: 14, color: '#2e2a26'
            }).setOrigin(0.5).setResolution(3)
        ]).setDepth(100).setAlpha(0);
    }

    //  --- placeholder texture painters (chunky shapes on the pixel grid) ---

    //  A trailside signpost, ~32×46 on the shared pixel grid (landmarks are
    //  small props — see ART-STYLE.md).
    paintSignpost ()
    {
        const g = this.add.graphics();
        g.fillStyle(0x7a5c40);                 // post
        g.fillRect(14, 6, 6, 40);
        g.fillStyle(0x9a7a54);                 // boards
        g.fillRect(2, 8, 30, 10);
        g.fillRect(6, 22, 22, 8);
        g.fillStyle(0x5c4530);                 // board shadows
        g.fillRect(2, 16, 30, 2);
        g.fillRect(6, 28, 22, 2);
        g.generateTexture('signpost', 34, 46);
        g.destroy();
    }

    //  A cairn: a little stack of trail-marker stones.
    paintCairn ()
    {
        const g = this.add.graphics();
        g.fillStyle(0x8d8578);
        g.fillRect(4, 26, 28, 10);
        g.fillStyle(0xa39a8a);
        g.fillRect(8, 16, 20, 10);
        g.fillStyle(0x8d8578);
        g.fillRect(12, 8, 12, 8);
        g.fillStyle(0xa39a8a);
        g.fillRect(15, 2, 6, 6);
        g.generateTexture('cairn', 36, 36);
        g.destroy();
    }

    //  A stream: a wet strip crossing the path where it meets the trail.
    paintStream ()
    {
        const g = this.add.graphics();
        g.fillStyle(0x7fb2c8);
        g.fillRect(0, 4, 44, 10);
        g.fillStyle(0xa8d0e0);
        g.fillRect(6, 6, 10, 2);
        g.fillRect(24, 10, 12, 2);
        g.fillStyle(0x5e93ab);
        g.fillRect(0, 12, 44, 2);
        g.generateTexture('stream', 44, 16);
        g.destroy();
    }

    //  The lucky hat: straw-gold, wide brim.
    paintHat ()
    {
        const g = this.add.graphics();
        g.fillStyle(0xd9c078);
        g.fillRect(0, 7, 16, 3);       // brim
        g.fillStyle(0xc8a850);
        g.fillRect(4, 0, 8, 7);        // crown
        g.fillStyle(0x8a6f3f);
        g.fillRect(4, 5, 8, 2);        // band
        g.generateTexture('hat', 16, 10);
        g.destroy();
    }

    //  The fox — the first rare creature.
    paintFox ()
    {
        const g = this.add.graphics();
        g.fillStyle(0xd97f3f);
        g.fillRect(4, 8, 18, 8);       // body
        g.fillRect(18, 4, 9, 8);       // head
        g.fillRect(17, 0, 3, 4);       // ears
        g.fillRect(23, 0, 3, 4);
        g.fillRect(0, 6, 5, 6);        // tail
        g.fillStyle(0xf4ede0);
        g.fillRect(0, 6, 2, 3);        // tail tip
        g.fillRect(24, 9, 3, 3);       // muzzle
        g.fillStyle(0x2e2a26);
        g.fillRect(6, 16, 3, 4);       // legs
        g.fillRect(16, 16, 3, 4);
        g.fillRect(22, 6, 2, 2);       // eye
        g.generateTexture('fox', 28, 20);
        g.destroy();
    }

    //  Journal silhouettes for creatures still out there.
    paintDeer ()
    {
        const g = this.add.graphics();
        g.fillStyle(0x9a7a54);
        g.fillRect(4, 12, 20, 10);     // body
        g.fillRect(20, 4, 7, 10);      // neck+head
        g.fillRect(18, 0, 2, 5);       // antlers
        g.fillRect(24, 0, 2, 5);
        g.fillStyle(0x5c4530);
        g.fillRect(6, 22, 3, 6);       // legs
        g.fillRect(19, 22, 3, 6);
        g.generateTexture('deer', 28, 28);
        g.destroy();
    }

    paintYeti ()
    {
        const g = this.add.graphics();
        g.fillStyle(0xe8f2f8);
        g.fillRect(4, 6, 20, 20);      // shaggy bulk
        g.fillRect(8, 0, 12, 8);       // head
        g.fillRect(0, 10, 5, 10);      // arms
        g.fillRect(23, 10, 5, 10);
        g.fillStyle(0x476578);
        g.fillRect(11, 3, 2, 2);       // eyes
        g.fillRect(15, 3, 2, 2);
        g.generateTexture('yeti', 28, 28);
        g.destroy();
    }

}
