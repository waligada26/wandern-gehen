import { Scene } from 'phaser';
import content from '../content.json';
import { loadSave } from '../save';
import { unlockAudio } from '../audio';

//  The campfire is the game's answer to logging out: not a pause screen,
//  a rest. This scene runs first; with no save it hands straight over to
//  a fresh hike, otherwise Wanda is found camped, waiting.
export class Camp extends Scene
{
    constructor ()
    {
        super('Camp');
    }

    preload ()
    {
        this.load.image('wanda-stand', 'assets/wanda-stand-east.png');
    }

    create ()
    {
        const save = loadSave(Object.keys(content.nodes));
        if (!save)
        {
            this.scene.start('Game', { save: null });
            return;
        }

        const g = this.add.graphics();

        //  Night sky, a handful of stars, dark ridgelines, dark ground.
        g.fillStyle(0x232c44);
        g.fillRect(0, 0, 360, 640);
        g.fillStyle(0xe8f2f8);
        const stars = [
            [30, 60], [84, 132], [140, 44], [200, 96], [252, 150],
            [300, 58], [338, 120], [56, 210], [180, 180], [318, 220],
            [110, 250], [260, 34]
        ];
        for (const [x, y] of stars) g.fillRect(x, y, 2, 2);
        g.fillStyle(0x1a2436);
        for (let x = 0; x < 360; x += 6)
        {
            const top = 330 + Math.round((16 * Math.sin(x * Math.PI * 2 / 180) + 8 * Math.sin(x * Math.PI * 2 / 72 + 1)) / 2) * 2;
            g.fillRect(x, top, 6, 640 - top);
        }
        g.fillStyle(0x2e2a26);
        g.fillRect(0, 460, 360, 180);

        //  The tent: a simple pitched triangle with a darker door.
        g.fillStyle(0x6a5a50);
        g.fillTriangle(196, 474, 292, 474, 244, 408);
        g.fillStyle(0x4a3e36);
        g.fillTriangle(228, 474, 260, 474, 244, 434);

        //  Campfire logs.
        g.fillStyle(0x5c4530);
        g.fillRect(126, 466, 32, 6);
        g.fillRect(132, 470, 32, 6);

        //  Flames: two hand-placed frames swapped on a timer, plus a warm
        //  glow that breathes. Cheap, and it reads as alive.
        const paintFlame = (key, blocks) => {
            const f = this.add.graphics();
            for (const [color, x, y, w, h] of blocks)
            {
                f.fillStyle(color);
                f.fillRect(x, y, w, h);
            }
            f.generateTexture(key, 28, 30);
            f.destroy();
        };
        paintFlame('flame0', [
            [0xd97f3f, 6, 12, 16, 16],
            [0xf0a850, 10, 6, 10, 14],
            [0xf8d878, 12, 12, 6, 8]
        ]);
        paintFlame('flame1', [
            [0xd97f3f, 6, 14, 16, 14],
            [0xf0a850, 8, 4, 10, 16],
            [0xf8d878, 14, 10, 6, 10]
        ]);

        const glow = this.add.circle(142, 458, 44, 0xf0a850, 0.10);
        this.tweens.add({ targets: glow, alpha: 0.20, duration: 900, yoyo: true, repeat: -1 });
        const flame = this.add.image(142, 466, 'flame0').setOrigin(0.5, 1);
        this.time.addEvent({
            delay: 260,
            loop: true,
            callback: () => flame.setTexture(flame.texture.key === 'flame0' ? 'flame1' : 'flame0')
        });

        //  Wanda, by the fire.
        this.add.image(84, 478, 'wanda-stand').setOrigin(0.5, 1);

        //  Words and the way back in.
        const font = { fontFamily: 'Courier New, monospace', align: 'center' };
        this.add.text(180, 84, 'AT CAMP', {
            ...font, fontSize: 13, color: '#d9b380'
        }).setOrigin(0.5).setResolution(3);
        this.add.text(180, 108, (save.distanceM / 1000).toFixed(1) + ' km hiked so far', {
            ...font, fontSize: 15, color: '#f4ede0'
        }).setOrigin(0.5).setResolution(3);

        const button = this.add.rectangle(180, 560, 220, 58, 0x9ab873)
            .setInteractive({ useHandCursor: true });
        this.add.text(180, 560, 'Continue hiking', {
            ...font, fontSize: 14, color: '#2e2a26'
        }).setOrigin(0.5).setResolution(3);
        //  The continue tap doubles as the browser's audio-unlock gesture.
        button.on('pointerdown', () => {
            unlockAudio();
            this.scene.start('Game', { save });
        });
    }
}
