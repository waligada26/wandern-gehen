import { Scene } from 'phaser';

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

//  Where the sign is, relative to Wanda, when she stops "at" it.
const STOP_AHEAD = 56;

//  ?fast in the URL shrinks gaps 10× — for testing, never the real pace.
const FAST = new URLSearchParams(window.location.search).has('fast');

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
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
        //  every stop, and later at the campfire. Everything times off it.
        this.distanceM = 0;
        this.walking = true;
        this.distanceText = this.add.text(346, 14, '0.0 km', {
            fontFamily: 'Courier New, monospace',
            fontSize: 15,
            color: '#476578'
        }).setOrigin(1, 0).setResolution(3).setDepth(20);

        this.landmark = null;        // the signpost currently on (or entering) screen
        this.landmarkArmed = false;  // true = it's a real stop; false = already visited
        this.rollNextLandmark();

        this.buildDecisionCard();
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

        //  Time (in walked distance) for the next landmark? Spawn it off the
        //  right edge — it approaches with the world, never pops from a timer.
        if (!this.landmark && this.distanceM >= this.nextLandmarkAtM)
        {
            this.landmark = this.add.image(TEX_W + 40, GROUND_Y + 4, 'signpost')
                .setOrigin(0.5, 1)
                .setDepth(5);
            this.landmarkArmed = true;
        }

        if (this.landmark)
        {
            //  The sign rides the path band: same speed, same direction.
            this.landmark.x -= PATH_SPEED * dt;

            if (this.landmarkArmed && this.landmark.x <= WANDA_X + STOP_AHEAD)
            {
                this.arriveAtLandmark();
            }
            else if (this.landmark.x < -40)
            {
                this.landmark.destroy();
                this.landmark = null;
            }
        }
    }

    //  --- the stop-and-choose loop ---

    rollNextLandmark ()
    {
        const rollA = Math.random() * GAP_ROLL_S;
        const rollB = Math.random() * GAP_ROLL_S;
        const gapS = (GAP_FLOOR_S + (rollA + rollB) / 2) / (FAST ? 10 : 1);
        this.nextLandmarkAtM = this.distanceM + gapS * WALK_MPS;
    }

    arriveAtLandmark ()
    {
        this.walking = false;
        this.landmarkArmed = false;   // resolved — when we resume, she walks past it

        //  A stopped hiker mid-stride reads as a glitch; the standing pose
        //  (checking her map) reads as "paused to think".
        this.wanda.stop();
        this.wanda.setTexture('wanda-stand');

        //  A beat of quiet before the card — arrival first, question second.
        this.time.delayedCall(450, () => {
            this.card.setVisible(true);
            this.tweens.add({ targets: this.card, alpha: 1, duration: 300 });
        });
    }

    resolveChoice (label)
    {
        //  (Which option was picked doesn't matter yet — Session 4 gives
        //  choices real effects when content becomes data.)
        this.tweens.add({
            targets: this.card,
            alpha: 0,
            duration: 250,
            onComplete: () => this.card.setVisible(false)
        });

        this.wanda.setTexture('wanda-walk');
        this.wanda.play('walk');
        this.walking = true;
        this.rollNextLandmark();
    }

    //  The A/B decision card: a panel low on the screen, two big side-by-side
    //  buttons in the thumb zone. Placeholder UI — real art comes later.
    buildDecisionCard ()
    {
        const panel = this.add.rectangle(180, 552, 336, 156, 0x2e2a26, 0.93);
        const frame = this.add.rectangle(180, 552, 336, 156).setStrokeStyle(2, 0xf4ede0, 0.35);

        const prompt = this.add.text(180, 498, 'The trail splits at a cairn.', {
            fontFamily: 'Courier New, monospace',
            fontSize: 15,
            color: '#f4ede0',
            align: 'center',
            wordWrap: { width: 300 }
        }).setOrigin(0.5, 0).setResolution(3);

        const makeButton = (x, fill, label) => {
            const rect = this.add.rectangle(x, 585, 150, 62, fill)
                .setInteractive({ useHandCursor: true });
            const text = this.add.text(x, 585, label, {
                fontFamily: 'Courier New, monospace',
                fontSize: 14,
                color: '#2e2a26',
                align: 'center',
                wordWrap: { width: 132 }
            }).setOrigin(0.5).setResolution(3);
            rect.on('pointerdown', () => this.resolveChoice(label));
            return [rect, text];
        };

        this.card = this.add.container(0, 0, [
            panel, frame, prompt,
            ...makeButton(97, 0x9ab873, 'Take the high ridge'),
            ...makeButton(263, 0xd9b380, 'Follow the low path')
        ]).setDepth(100).setAlpha(0).setVisible(false);
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
