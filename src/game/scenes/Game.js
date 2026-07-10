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

const GROUND_Y = 478;   // where Wanda's feet sit on the path band

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
        this.wanda = this.add.sprite(110, GROUND_Y, 'wanda-walk').setOrigin(0.5, 1);
        this.wanda.play('walk');
    }

    update (time, delta)
    {
        for (const layer of this.layers)
        {
            layer.offset = (layer.offset + layer.speed * delta / 1000) % TEX_W;
            const x = -Math.round(layer.offset);   // whole pixels only — keeps the grid crisp
            layer.a.x = x;
            layer.b.x = x + TEX_W;
        }
    }

    //  --- placeholder texture painters (chunky shapes on the pixel grid) ---

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
