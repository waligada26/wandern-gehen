import { Scene } from 'phaser';
import content from '../content.json';
import { writeSave } from '../save';

//  The world is 4 horizontal bands (back to front), each scrolling
//  right-to-left at its own speed — slower = further away (parallax).
//  Wanda never moves; the world slides past her.
const LAYERS = [
    { key: 'clouds', top: 30,  height: 180, speed: 6 },
    { key: 'far',    top: 240, height: 120, speed: 14 },
    { key: 'mid',    top: 320, height: 140, speed: 32 },
    { key: 'path',   top: 460, height: 180, speed: 70 }
];

//  Every texture is TEX_W wide and tiles seamlessly: silhouettes are built
//  from sine waves whose periods divide TEX_W exactly, so the right edge
//  continues perfectly into the left edge when the tile repeats.
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

//  ?fast in the URL shrinks gaps 10× — for testing, never the real pace.
const FAST = new URLSearchParams(window.location.search).has('fast');

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
    }

    create ()
    {
        this.paintClouds();
        this.paintRidge('far', 120, 0x8fb0a0, x =>
            46 + 18 * Math.sin(x * Math.PI * 2 / 180) + 10 * Math.sin(x * Math.PI * 2 / 90 + 1.3));
        this.paintRidge('mid', 140, 0x55805e, x =>
            30 + 14 * Math.sin(x * Math.PI * 2 / 120) + 8 * Math.sin(x * Math.PI * 2 / 45 + 2));
        this.paintPath();
        this.paintSignpost();
        this.paintCairn();
        this.paintStream();

        //  Each band is two copies of its texture side by side. Both slide
        //  left; when the pair has moved one full tile, it snaps back — the
        //  copies are identical, so the snap (and the seam) is invisible.
        this.layers = LAYERS.map(cfg => ({
            a: this.add.image(0, cfg.top, cfg.key).setOrigin(0, 0),
            b: this.add.image(TEX_W, cfg.top, cfg.key).setOrigin(0, 0),
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

        //  The distance clock. Advances ONLY while walking — so it pauses at
        //  every stop and at the campfire. Everything times off it.
        this.distanceM = this.savedHike ? this.savedHike.distanceM : 0;
        this.walking = true;
        this.distanceText = this.add.text(346, 14, '0.0 km', {
            ...UI_FONT, fontSize: 15, color: '#476578'
        }).setOrigin(1, 0).setResolution(3).setDepth(20);

        //  The hike's state, nudged by choice effects, gating some options.
        this.state = this.savedHike ? { ...this.savedHike.state } : { ...STATE_START };
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
        if (this.savedHike)
        {
            this.nextLandmarkAtM = this.savedHike.nextLandmarkAtM;
        }
        else
        {
            this.rollNextLandmark();
        }

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
    }

    saveNow ()
    {
        writeSave({
            distanceM: this.distanceM,
            state: this.state,
            currentId: this.currentId,
            nextLandmarkAtM: this.nextLandmarkAtM
        });
    }

    update (time, delta)
    {
        if (!this.walking) return;   // stopped at a landmark: world holds its breath

        const dt = delta / 1000;

        for (const layer of this.layers)
        {
            layer.offset = (layer.offset + layer.speed * dt) % TEX_W;
            const x = -Math.round(layer.offset);   // whole pixels only — keeps the grid crisp
            layer.a.x = x;
            layer.b.x = x + TEX_W;
        }

        this.distanceM += WALK_MPS * dt;
        this.distanceText.setText((this.distanceM / 1000).toFixed(1) + ' km');

        //  Time (in walked distance) for the next stop? Spawn its landmark
        //  off the right edge — it approaches with the world, never pops
        //  from a timer.
        if (!this.landmark && this.distanceM >= this.nextLandmarkAtM)
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
            this.landmark.x -= PATH_SPEED * dt;

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
    }

    //  --- the stop-and-choose loop, driven by the content graph ---

    rollNextLandmark ()
    {
        const rollA = Math.random() * GAP_ROLL_S;
        const rollB = Math.random() * GAP_ROLL_S;
        const gapS = (GAP_FLOOR_S + (rollA + rollB) / 2) / (FAST ? 10 : 1);
        this.nextLandmarkAtM = this.distanceM + gapS * WALK_MPS;
    }

    arriveAtStop ()
    {
        this.walking = false;
        this.landmarkArmed = false;   // resolved — when we resume, she walks past it

        //  A stopped hiker mid-stride reads as a glitch; the standing pose
        //  (checking her map) reads as "paused to think".
        this.wanda.stop();
        this.wanda.setTexture('wanda-stand');

        const node = content.nodes[this.currentId];

        //  A beat of quiet before the card — arrival first, question second.
        this.time.delayedCall(450, () => {
            this.card = node.type === 'ending' ? this.buildEnding(node) : this.buildCard(node);
            this.tweens.add({ targets: this.card, alpha: 1, duration: 300 });
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
        this.stateText.setText(`water ${water} · energy ${energy} · morale ${morale}`);
    }

    //  Resolve the current stop: apply effects, advance the graph, walk on.
    resolveStop (effects, nextId)
    {
        this.applyEffects(effects);
        this.currentId = nextId;

        this.tweens.add({
            targets: this.card,
            alpha: 0,
            duration: 250,
            onComplete: () => { this.card.destroy(); this.card = null; }
        });

        this.wanda.setTexture('wanda-walk');
        this.wanda.play('walk');
        this.walking = true;
        this.rollNextLandmark();
        this.saveNow();
    }

    //  An ending resolves into a fresh trail from the top of the graph.
    startNewTrail ()
    {
        this.distanceM = 0;
        this.state = { ...STATE_START };
        this.refreshStateText();
        this.resolveStop({}, content.start);
    }

    //  --- cards, built from whatever node just arrived ---

    //  Bottom panel: two option buttons for a choice, one for a beat.
    //  Buttons sit side by side in the thumb zone, big tap targets.
    buildCard (node)
    {
        const children = [
            this.add.rectangle(180, 552, 336, 156, 0x2e2a26, 0.93),
            this.add.rectangle(180, 552, 336, 156).setStrokeStyle(2, 0xf4ede0, 0.35),
            this.add.text(180, 494, node.prompt, {
                ...UI_FONT, fontSize: 15, wordWrap: { width: 304 }
            }).setOrigin(0.5, 0).setResolution(3)
        ];

        const addButton = (x, w, fill, label, enabled, onTap) => {
            const rect = this.add.rectangle(x, 585, w, 62, fill, enabled ? 1 : 0.35);
            const text = this.add.text(x, 585, label, {
                ...UI_FONT, fontSize: 14, color: '#2e2a26', wordWrap: { width: w - 18 }
            }).setOrigin(0.5).setResolution(3).setAlpha(enabled ? 1 : 0.5);
            if (enabled)
            {
                rect.setInteractive({ useHandCursor: true });
                rect.on('pointerdown', onTap);
            }
            children.push(rect, text);
        };

        if (node.type === 'choice')
        {
            const fills = [0x9ab873, 0xd9b380];
            node.options.forEach((opt, i) => {
                addButton(i === 0 ? 97 : 263, 150, fills[i],
                    opt.label,
                    this.meetsRequires(opt.requires),
                    () => this.resolveStop(opt.effects, opt.next));
            });
        }
        else    // beat: shows something, asks nothing — a single gentle button
        {
            addButton(180, 240, 0x9ab873, 'Walk on',
                true,
                () => this.resolveStop(node.effects, node.next));
        }

        return this.add.container(0, 0, children).setDepth(100).setAlpha(0);
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

    //  Sparse clouds on transparency. Anything near the right edge is drawn
    //  again one tile-width to the left, so the wrap point never cuts a cloud.
    paintClouds ()
    {
        const g = this.add.graphics();
        g.fillStyle(0xe8f2f8);
        const clouds = [
            { x: 30,  y: 40,  w: 56, h: 12 },
            { x: 150, y: 100, w: 40, h: 10 },
            { x: 250, y: 20,  w: 70, h: 14 },
            { x: 330, y: 70,  w: 48, h: 10 }
        ];
        for (const c of clouds)
        {
            for (const dx of [0, -TEX_W])
            {
                g.fillRect(c.x + dx, c.y, c.w, c.h);
                g.fillRect(c.x + dx + 8, c.y - 6, c.w - 20, 6);
            }
        }
        g.generateTexture('clouds', TEX_W, 180);
        g.destroy();
    }

    //  A ridgeline: solid color below a wavy top edge, sampled in chunky
    //  6px columns and quantized to 2px so it stays on the pixel grid.
    paintRidge (key, height, color, profile)
    {
        const g = this.add.graphics();
        g.fillStyle(color);
        for (let x = 0; x < TEX_W; x += 6)
        {
            const top = Math.round(profile(x) / 2) * 2;
            g.fillRect(x, top, 6, height - top);
        }
        g.generateTexture(key, TEX_W, height);
        g.destroy();
    }

    //  The foreground: grass lip, dirt, and wrapped pebble speckles.
    paintPath ()
    {
        const g = this.add.graphics();
        g.fillStyle(0xb09068);
        g.fillRect(0, 0, TEX_W, 180);
        g.fillStyle(0x6f9a5f);
        for (let x = 0; x < TEX_W; x += 4)
        {
            const notch = 12 + 4 * Math.sin(x * Math.PI * 2 / 40) + 2 * Math.sin(x * Math.PI * 2 / 24 + 1);
            g.fillRect(x, 0, 4, Math.round(notch / 2) * 2);
        }
        g.fillStyle(0x8a6f50);
        const pebbles = [
            [24, 60], [80, 100], [130, 44], [170, 130], [210, 74],
            [260, 50], [300, 110], [340, 66], [50, 150], [230, 156],
            [12, 96], [60, 34], [104, 128], [146, 82], [190, 40],
            [242, 122], [284, 88], [322, 142], [352, 36], [70, 64]
        ];
        for (const [x, y] of pebbles)
        {
            for (const dx of [0, -TEX_W])
            {
                g.fillRect(x + dx, y, 6, 4);
            }
        }
        //  Grass tufts scattered on the dirt — extra motion cues, since the
        //  foreground's speed is what sells the walking.
        g.fillStyle(0x6f9a5f);
        const tufts = [
            [40, 42], [96, 78], [156, 112], [204, 56], [252, 146],
            [296, 70], [336, 104], [16, 134], [124, 30], [270, 28]
        ];
        for (const [x, y] of tufts)
        {
            for (const dx of [0, -TEX_W])
            {
                g.fillRect(x + dx, y, 4, 4);
                g.fillRect(x + dx + 4, y + 2, 2, 2);
            }
        }
        g.generateTexture('path', TEX_W, 180);
        g.destroy();
    }
}
