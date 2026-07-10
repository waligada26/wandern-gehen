//  The audio engine: Tone.js running alongside Phaser (AUDIO.md).
//  Phaser drives the game; Tone drives the music clock. Everything here is
//  SYNTHESIZED — placeholder stems, same philosophy as the colored
//  rectangles. Real composed stems replace the synth layers later; the
//  transport, layering, phasing, and shimmer wiring all stay.
import * as Tone from 'tone';

//  One shared musical grid, so every change lands on the bar.
const TEMPO = 84;

//  Modal, drone-friendly note pools (D dorian) — calm by construction.
const PAD_CHORDS = [
    ['D3', 'A3', 'E4'],
    ['C3', 'G3', 'D4'],
    ['D3', 'A3', 'F4'],
    ['A2', 'E3', 'B3']
];
const BASS_PATTERN = ['D2', null, 'C2', 'A1'];     // one note per bar, 4-bar loop
const MELODY_PHRASES = [                           // 3-bar phrases, stitched randomly
    ['D4', null, 'E4', 'F4', null, 'A4', null, null, 'G4', null, 'E4', null],
    ['A4', null, 'G4', null, 'F4', null, 'E4', null, 'D4', null, null, null],
    ['F4', null, null, 'G4', null, 'A4', null, 'D5', null, 'A4', null, null]
];

let built = false;
let unlocked = false;
let muted = false;

let master, padSynth, bassSynth, melodySynth, shimmerSynth, shimmerGain;
let chimeSynth, stepSynth, stepLoop;
let melodyOn = true;

function build ()
{
    if (built) return;
    built = true;

    master = new Tone.Gain(muted ? 0 : 1).toDestination();
    const reverb = new Tone.Reverb({ decay: 5, wet: 0.35 }).connect(master);
    const softener = new Tone.Filter(3200, 'lowpass').connect(reverb);

    //  --- the placeholder stems (coprime lengths: 6, 4, and 3 bars) ---

    //  Pad: slow chord swells, 6-bar cycle.
    padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 4, decay: 2, sustain: 0.6, release: 6 },
        volume: -18
    }).connect(softener);
    let padStep = 0;
    new Tone.Loop(time => {
        padSynth.triggerAttackRelease(PAD_CHORDS[padStep % PAD_CHORDS.length], '5m', time);
        padStep++;
    }, '6m').start(0);

    //  Bass pulse: one soft note per bar, 4-bar pattern.
    bassSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.4, decay: 0.5, sustain: 0.5, release: 2 },
        volume: -15
    }).connect(softener);
    let bassStep = 0;
    new Tone.Loop(time => {
        const note = BASS_PATTERN[bassStep % BASS_PATTERN.length];
        if (note) bassSynth.triggerAttackRelease(note, '2n', time);
        bassStep++;
    }, '1m').start(0);

    //  Melody: a 3-bar phrase picked at random each pass — stitching. A slow
    //  dice roll drops the whole layer in and out so it drifts, not drones.
    melodySynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.4, sustain: 0.1, release: 1.5 },
        volume: -20
    }).connect(new Tone.FeedbackDelay('8n.', 0.25).connect(softener));
    new Tone.Loop(time => {
        if (Math.random() < 0.35) melodyOn = !melodyOn;   // slow randomness
        if (!melodyOn) return;
        const phrase = MELODY_PHRASES[Math.floor(Math.random() * MELODY_PHRASES.length)];
        const step = Tone.Time('2n');
        phrase.forEach((note, i) => {
            if (note) melodySynth.triggerAttackRelease(note, '4n', time + i * step);
        });
    }, '3m').start('2m');

    //  The lucky shimmer: sparse high bells behind a gate that opens only
    //  while the hat is worn. One layer, big feeling.
    shimmerGain = new Tone.Gain(0).connect(softener);
    shimmerSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 3 },
        volume: -14
    }).connect(shimmerGain);
    const sparkles = ['D6', 'A5', 'E6', 'F6', 'A6'];
    new Tone.Loop(time => {
        if (Math.random() < 0.7)
        {
            shimmerSynth.triggerAttackRelease(
                sparkles[Math.floor(Math.random() * sparkles.length)], '8n', time);
        }
    }, '2n').start(0);

    //  --- one-shots ---

    chimeSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.6, sustain: 0, release: 1.2 },
        volume: -13
    }).connect(softener);

    //  Footsteps: a dull little thud, only audible while walking.
    stepSynth = new Tone.NoiseSynth({
        noise: { type: 'brown' },
        envelope: { attack: 0.002, decay: 0.06, sustain: 0 },
        volume: -25
    }).connect(new Tone.Filter(500, 'lowpass').connect(master));
    let leftFoot = true;
    stepLoop = new Tone.Loop(time => {
        stepSynth.volume.value = leftFoot ? -25 : -28;    // uneven, like feet
        stepSynth.triggerAttackRelease('16n', time);
        leftFoot = !leftFoot;
    }, 0.4);

    //  Debug/test handle, like window.__wg on the scene.
    window.__wgAudio = {
        get context () { return Tone.getContext().state; },
        get transport () { return Tone.getTransport().state; },
        get steps () { return stepLoop.state; },
        get shimmer () { return shimmerGain.gain.value; },
        get muted () { return muted; }
    };
}

//  Browsers only allow sound after a user gesture — call this from any tap.
//  Safe to call repeatedly.
export async function unlockAudio ()
{
    if (unlocked) return;
    unlocked = true;
    build();
    await Tone.start();
    const t = Tone.getTransport();
    t.bpm.value = TEMPO;
    t.start();
}

export function audioReady ()
{
    return unlocked && Tone.getContext().state === 'running';
}

//  Footstep loop follows the walk state.
export function setWalking (walking)
{
    if (!built) return;
    if (walking && stepLoop.state !== 'started') stepLoop.start();
    else if (!walking && stepLoop.state === 'started') stepLoop.stop();
}

//  The shimmer gate — fades over two bars, so it lands musically.
export function setShimmer (on)
{
    if (!built) return;
    const twoBarsInSeconds = Tone.Time('2m').toSeconds();
    shimmerGain.gain.rampTo(on ? 1 : 0, twoBarsInSeconds);
}

export function playDecisionChime ()
{
    if (!audioReady()) return;
    const now = Tone.now();
    chimeSynth.triggerAttackRelease('A4', '8n', now);
    chimeSynth.triggerAttackRelease('D5', '4n', now + 0.13);
}

export function playArrivalChime ()
{
    if (!audioReady()) return;
    const now = Tone.now();
    ['D4', 'F4', 'A4', 'D5'].forEach((n, i) =>
        chimeSynth.triggerAttackRelease(n, '4n', now + i * 0.17));
}

export function playSightingSting ()
{
    if (!audioReady()) return;
    const now = Tone.now();
    ['D5', 'A5', 'D6'].forEach((n, i) =>
        chimeSynth.triggerAttackRelease(n, '8n', now + i * 0.09));
}

//  Mute is remembered between sessions.
const MUTE_KEY = 'wandern-gehen-muted';
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

export function isMuted ()
{
    return muted;
}

export function toggleMuted ()
{
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    if (master) master.gain.rampTo(muted ? 0 : 1, 0.2);
    return muted;
}
