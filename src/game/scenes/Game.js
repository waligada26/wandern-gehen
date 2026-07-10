import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        //  Placeholder hiker: a 64×64 rectangle, the same size the real
        //  hiker sprite will be, standing on the foreground band.
        this.add.rectangle(180, 480, 64, 64, 0xc4704f);
    }
}
