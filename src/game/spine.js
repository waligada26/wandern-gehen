//  The spine — segment bookkeeping and THE DEALER for the procedural
//  trail (SEGMENT-TABLE.md v1.1 stitching rules + skeleton).
//
//  Pure module (state + manifest + rng in, decision out) — no Phaser,
//  no game imports; the content-validate.js testability pattern. The
//  one guarded impurity is the dev-only ?deal= URL read below.

//  "@exit" in a node's next means "this segment is done — ask the
//  spine what comes next". It never names a node and must never
//  survive into currentId (Game.js substitutes it in advanceTo).
export const EXIT = '@exit';

//  --- dealer tuning ---
const RECENCY_N = 5;           //  rule 6: deals in the last N are penalized
const RECENCY_PENALTY = 0.15;  //  ...down to this share of a normal weight
const LIGHT_PREFERENCE = 2;    //  rule 5 (soft half): after a medium+, lights weigh double
const SETTING_STRIDE = 2;      //  virtual setting advances every N deals
const TARGET_MIN = 8;          //  the duration dial: targetDeals is the
const TARGET_MAX = 14;         //  average of two rolls across this range
const FORK_POSITIONS = [2, 3]; //  the early fork slots into one of these deal positions

//  Slotted by the skeleton, never drawn from the deck. seg_fork_vista
//  has no skeleton role in the manifest; the dealer owns its slot.
const SLOTTED = ['seg_fork_vista'];

//  The virtual-setting ring. PLACEHOLDER POLICY: a shuffled cycle
//  advanced every SETTING_STRIDE deals, reshuffled each full lap —
//  replaced when the virtual setting drives the scenery palette
//  (locked end-state in SEGMENT-TABLE's header).
const SETTINGS_RING = ['water', 'valley', 'woodland', 'farmland', 'open'];

//  Dev-only override: ?deal=seg_a,seg_b forces the first deals, then
//  normal dealing resumes. Guarded so the module runs in plain Node.
let urlDeals = null;
if (typeof window !== 'undefined' && window.location)
{
    const q = new URLSearchParams(window.location.search).get('deal');
    if (q) urlDeals = q.split(',').map(s => s.trim()).filter(Boolean);
}

export class Spine
{
    //  savedSpine: the save's spine object, or null (fresh hike OR a
    //  pre-spine save — history then seeds from the current node's
    //  segment; earlier segments are forgotten, so a once_per_hike
    //  segment seen pre-update could repeat once. Harmless, cosmetic).
    //  opts: { rng, forcedDeals } — tests inject a seeded rng here;
    //  the game never passes opts (Game.js unchanged since session 1).
    constructor (segments, savedSpine, currentNodeId, opts = {})
    {
        this.segments = segments || {};
        this.rng = opts.rng || Math.random;
        this.forcedDeals = opts.forcedDeals
            ? opts.forcedDeals.slice()
            : (urlDeals ? urlDeals.slice() : []);

        //  node → segment, DERIVED and never stored — a teleported
        //  currentId (tests, window.__wg) self-heals.
        this.byNode = {};
        for (const [segId, seg] of Object.entries(this.segments))
        {
            for (const nodeId of seg.members || []) this.byNode[nodeId] = segId;
        }

        //  The shuffle deck: everything not slotted by the skeleton,
        //  not spine-slotted, not held out (sunset/stars sit out until
        //  the time-of-day session).
        this.deckIds = Object.keys(this.segments).filter(id =>
            !this.segments[id].skeleton
            && !this.segments[id].heldOut
            && !SLOTTED.includes(id));

        if (savedSpine && Array.isArray(savedSpine.history) && savedSpine.history.length > 0)
        {
            this.history = savedSpine.history.slice();
            this.world = { wet: 0, misty: 0, ...(savedSpine.world || {}) };
            //  targetDeals may be null (a pre-dealer save) — rolled
            //  lazily on the first deal after restore.
            this.targetDeals = savedSpine.targetDeals !== undefined
                ? savedSpine.targetDeals : null;
            //  Ring/slot state persists so a reload never reshuffles
            //  mid-hike; reader-side defaults cover older saves.
            this.settingRing = Array.isArray(savedSpine.settingRing) && savedSpine.settingRing.length === SETTINGS_RING.length
                ? savedSpine.settingRing.slice()
                : this.shuffledRing();
            this.settingIndex = typeof savedSpine.settingIndex === 'number' ? savedSpine.settingIndex : 0;
            this.setting = savedSpine.setting || this.settingRing[this.settingIndex % this.settingRing.length];
            this.forkAt = typeof savedSpine.forkAt === 'number'
                ? savedSpine.forkAt
                : FORK_POSITIONS[Math.floor(this.rng() * FORK_POSITIONS.length)];
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

    weightOf (segId)
    {
        const seg = this.segments[segId];
        return (seg && seg.weight) || 'light';
    }

    //  --- the deal ---

    //  Deal what follows `currentSegId` and return its entry node id.
    //  `context` is reserved for the flag read side — unused, kept so
    //  the signature never changes.
    nextEntry (currentSegId, context)
    {
        //  Pre-dealer saves restored mid-hike carry targetDeals: null —
        //  roll it on the first deal so the hike still gets an arc.
        if (this.targetDeals === null) this.targetDeals = this.rollTargetDeals();

        const nextId = this.pickDeal(currentSegId);
        this.deal(nextId);
        return this.segments[nextId].entry;
    }

    pickDeal (currentSegId)
    {
        //  Dev override first (?deal= / opts.forcedDeals).
        while (this.forcedDeals.length > 0)
        {
            const forced = this.forcedDeals.shift();
            if (this.segments[forced]) return forced;
            console.warn(`spine: unknown forced deal "${forced}" — skipped`);
        }

        //  Skeleton: the early fork slot (position rolled per trail).
        if (this.history.length === this.forkAt - 1
            && !this.history.includes('seg_fork_vista'))
        {
            return 'seg_fork_vista';
        }

        //  The duration dial: enough deals → head for the ending.
        //  TODO(parked): seg_stars holds the reserved "closing" slot —
        //  once time-of-day is readable it deals HERE, last before the
        //  ending, when the sky is night + clear (SEGMENT-TABLE rule 4).
        if (this.history.length >= this.targetDeals)
        {
            if (this.weightOf(currentSegId) !== 'light')
            {
                //  The ending is heavy and heavies only ever touch
                //  light — one light buffer after any medium-or-heavier
                //  deal. If even that fails, end anyway.
                const buffer = this.drawFromDeck(currentSegId, true);
                if (buffer) return buffer;
            }
            return 'seg_gate_ending';
        }

        const pick = this.drawFromDeck(currentSegId, false);
        if (pick) return pick;

        //  Deck exhausted even after every relaxation (possible late in
        //  a long hike once once_per_hike is spent) — a short hike is a
        //  legal hike, a crash is not.
        console.warn('spine: deck exhausted — dealing the ending early');
        return 'seg_gate_ending';
    }

    //  Relaxation ladder (ENGINE-STATE §9): 0 none → 1 drop recency
    //  penalty → 2 drop setting gate → 3 drop back-to-back. NEVER
    //  relaxed: once_per_hike, heldOut, sky gates, heavy adjacency.
    drawFromDeck (currentSegId, lightOnly)
    {
        const stageNames = ['', 'no recency penalty', 'no setting gate', 'no back-to-back'];
        for (let relax = 0; relax <= 3; relax++)
        {
            const candidates = this.legalDeck(currentSegId, relax, lightOnly);
            if (candidates.length === 0) continue;
            if (relax > 0) console.debug(`spine: relaxation stage ${relax} (${stageNames[relax]})`);
            return this.weightedDraw(candidates, currentSegId, relax);
        }
        return null;
    }

    legalDeck (currentSegId, relax, lightOnly)
    {
        const lastWeight = this.weightOf(currentSegId);
        return this.deckIds.filter(id => {
            const seg = this.segments[id];
            if (lightOnly && seg.weight !== 'light') return false;
            //  frequency — never relaxed
            if (seg.frequency === 'once_per_hike' && this.history.includes(id)) return false;
            //  back-to-back (rule 6) — relaxed only at stage 3
            if (relax < 3 && id === currentSegId) return false;
            //  heavy adjacency (rule 5, hard half) — never relaxed:
            //  heavies only ever touch light.
            if (lastWeight === 'heavy' && seg.weight !== 'light') return false;
            if (seg.weight === 'heavy' && lastWeight !== 'light') return false;
            //  ...which includes the fork slot: the (medium) fork lands
            //  at position 2–3, so no heavy may deal before it's placed.
            if (seg.weight === 'heavy' && !this.history.includes('seg_fork_vista')) return false;
            //  setting gate (rule 1) — relaxed at stage 2
            if (relax < 2)
            {
                const need = (seg.needs && seg.needs.setting) || 'any';
                if (need !== 'any' && need !== this.setting) return false;
            }
            //  sky gates (rules 2/3) — never relaxed. "clear" blocks
            //  while wet OR misty; mist itself deliberately ignores wet.
            const sky = (seg.needs && seg.needs.sky) || [];
            if (sky.includes('clear') && (this.world.wet > 0 || this.world.misty > 0)) return false;
            //  time-of-day skies are unreadable until that session
            if (sky.includes('night') || sky.includes('goldenhour')) return false;
            //  self-exclusion: its own world-state still active
            if (seg.sets && this.world[seg.sets.state] > 0) return false;
            return true;
        });
    }

    weightedDraw (candidates, currentSegId, relax)
    {
        const recent = new Set(this.history.slice(-RECENCY_N));
        const lastWeight = this.weightOf(currentSegId);
        const weights = candidates.map(id => {
            let w = 1;
            //  rule 6: recently-seen segments keep a small share
            if (relax < 1 && recent.has(id)) w *= RECENCY_PENALTY;
            //  rule 5 (soft half): after a medium+, prefer light
            if (lastWeight !== 'light' && this.weightOf(id) === 'light') w *= LIGHT_PREFERENCE;
            return w;
        });
        const total = weights.reduce((a, b) => a + b, 0);
        let roll = this.rng() * total;
        for (let i = 0; i < candidates.length; i++)
        {
            roll -= weights[i];
            if (roll <= 0) return candidates[i];
        }
        return candidates[candidates.length - 1];
    }

    //  Bookkeeping for every deal, forced or drawn: history, world
    //  timers, the virtual setting.
    deal (segId)
    {
        this.history.push(segId);
        const seg = this.segments[segId];
        if (seg && seg.sets)
        {
            this.world[seg.sets.state] = seg.sets.stops;
        }
        this.advanceSetting();
    }

    advanceSetting ()
    {
        if (this.history.length % SETTING_STRIDE !== 0) return;
        this.settingIndex += 1;
        if (this.settingIndex % this.settingRing.length === 0)
        {
            this.settingRing = this.shuffledRing();   // new lap, new order
        }
        this.setting = this.settingRing[this.settingIndex % this.settingRing.length];
    }

    shuffledRing ()
    {
        const ring = SETTINGS_RING.slice();
        for (let i = ring.length - 1; i > 0; i--)
        {
            const j = Math.floor(this.rng() * (i + 1));
            [ring[i], ring[j]] = [ring[j], ring[i]];
        }
        return ring;
    }

    //  The duration dial: how many deals (opener and fork included,
    //  ending excluded) this trail runs before heading for the gate.
    //  Average of two rolls — comfortable middles, rare extremes.
    rollTargetDeals ()
    {
        const a = TARGET_MIN + this.rng() * (TARGET_MAX - TARGET_MIN);
        const b = TARGET_MIN + this.rng() * (TARGET_MAX - TARGET_MIN);
        return Math.round((a + b) / 2);
    }

    //  Called once per resolved stop (from advanceTo): world-state
    //  timers are counted in stops. Interrupts (hat, fox) bypass
    //  advanceTo, so they correctly don't consume stops.
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
        this.settingRing = this.shuffledRing();
        this.settingIndex = 0;
        this.setting = this.settingRing[0];
        this.targetDeals = this.rollTargetDeals();
        this.forkAt = FORK_POSITIONS[Math.floor(this.rng() * FORK_POSITIONS.length)];
    }

    serialize ()
    {
        return {
            history: this.history.slice(),
            world: { ...this.world },
            setting: this.setting,
            targetDeals: this.targetDeals,
            settingRing: this.settingRing.slice(),
            settingIndex: this.settingIndex,
            forkAt: this.forkAt
        };
    }
}
