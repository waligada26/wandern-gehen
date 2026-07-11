//  The spine — segment bookkeeping for the procedural trail.
//
//  THIS SESSION (plumbing only): the dealer is a FIXED-ORDER stub that
//  reproduces the historical trunk sequence, so the game plays as it
//  did before. Session 2 replaces FIXED_ORDER with the real dealer —
//  stitching rules 1–6, the skeleton, targetDeals, and deck math per
//  SEGMENT-TABLE.md.
//
//  Pure module (state in, decision out) — no Phaser, no game imports;
//  the same testability pattern as content-validate.js.

//  "@exit" in a node's next means "this segment is done — ask the
//  spine what comes next". It never names a node and must never
//  survive into currentId (Game.js substitutes it in advanceTo).
export const EXIT = '@exit';

//  The historical trunk order. Two micro-changes vs the fixed trunk,
//  both from SEGMENT-TABLE's v1 single-successor decision: the pond
//  divergence is collapsed (everyone walks cairn_topple then whistle),
//  and painted_sign — previously high-ridge only — is dealt to
//  everyone. heldOut (sunset, stars) has no effect until session 2's
//  deck math: the fixed order still walks the full trunk.
const FIXED_ORDER = [
    'seg_butterfly', 'seg_glove', 'seg_fork_vista', 'seg_painted_sign',
    'seg_stream_coin', 'seg_hiker', 'seg_litter', 'seg_sunset', 'seg_rain',
    'seg_mist', 'seg_hollow', 'seg_pond', 'seg_cairn_topple', 'seg_whistle',
    'seg_marker', 'seg_bothy', 'seg_log_rest', 'seg_dog', 'seg_stars',
    'seg_gate_ending'
];

export class Spine
{
    //  savedSpine is the save's spine object, or null — null covers
    //  both a fresh hike AND a pre-spine save. With nothing to
    //  restore, history seeds from the current node's segment; for an
    //  old save restored mid-trail that forgets earlier segments, so a
    //  once_per_hike segment seen pre-update could repeat once —
    //  harmless and cosmetic (and a session-2 concern anyway).
    constructor (segments, savedSpine, currentNodeId)
    {
        this.segments = segments || {};

        //  node → segment, DERIVED and never stored — a teleported
        //  currentId (tests, window.__wg) self-heals because the
        //  segment is always looked up fresh.
        this.byNode = {};
        for (const [segId, seg] of Object.entries(this.segments))
        {
            for (const nodeId of seg.members || []) this.byNode[nodeId] = segId;
        }

        if (savedSpine && Array.isArray(savedSpine.history) && savedSpine.history.length > 0)
        {
            this.history = savedSpine.history.slice();
            this.world = { wet: 0, misty: 0, ...(savedSpine.world || {}) };
            this.setting = savedSpine.setting || 'woodland';
            this.targetDeals = savedSpine.targetDeals !== undefined
                ? savedSpine.targetDeals : null;
        }
        else
        {
            this.resetForNewTrail(currentNodeId);
        }
    }

    segmentOf (nodeId)
    {
        return this.byNode[nodeId] || null;
    }

    //  Deal the segment that follows `currentSegId` and return its
    //  entry node id. `context` is reserved for the flag read side
    //  (session 2+) — unused today, kept so the signature won't change.
    nextEntry (currentSegId, context)
    {
        const i = FIXED_ORDER.indexOf(currentSegId);
        let nextId = FIXED_ORDER[i + 1];
        if (i === -1 || !nextId || !this.segments[nextId])
        {
            //  Unknown segment or nothing after it — never strand the
            //  walk (soft stakes extends to bugs).
            console.warn(`spine: no successor for "${currentSegId}" — dealing the opener`);
            nextId = FIXED_ORDER[0];
        }
        this.history.push(nextId);
        return this.segments[nextId].entry;
    }

    //  Called once per resolved stop (from advanceTo): world-state
    //  timers are counted in stops. Interrupts (hat, fox) bypass
    //  advanceTo, so they correctly don't consume stops. Nothing sets
    //  wet/misty yet — the decrement is wired for session 2.
    onStopResolved ()
    {
        if (this.world.wet > 0) this.world.wet -= 1;
        if (this.world.misty > 0) this.world.misty -= 1;
    }

    //  Per-hike state resets with the trail. LOCKED (v1): recency
    //  resets too — history is purely per-hike. Revisit trigger:
    //  persist recency across trails if back-to-back hikes feel samey.
    resetForNewTrail (startNodeId)
    {
        this.history = [this.segmentOf(startNodeId)].filter(Boolean);
        this.world = { wet: 0, misty: 0 };
        this.setting = 'woodland';   // static this session; session 2 advances it
        this.targetDeals = null;     // saved slot now so the save shape won't change again
    }

    serialize ()
    {
        return {
            history: this.history.slice(),
            world: { ...this.world },
            setting: this.setting,
            targetDeals: this.targetDeals
        };
    }
}
