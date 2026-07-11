import { Camp } from './scenes/Camp';
import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Scale } from 'phaser';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 360,
    height: 640,
    parent: 'game-container',
    //  Matches the top row of the far woodland layer exactly, so the
    //  band's upper edge dissolves into the sky (Section A).
    backgroundColor: '#e9edfd',
    pixelArt: true,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        Camp,       // runs first: shows the rest scene if a save exists
        MainGame
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;
