import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', () => {

    StartGame('game-container');

});

//  The offline cache (public/sw.js). Registered after load so it never
//  competes with the game booting; skipped on the dev server.
if ('serviceWorker' in navigator && !import.meta.env.DEV)
{
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}