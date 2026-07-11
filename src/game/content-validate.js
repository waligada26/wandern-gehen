//  Guardrail over content.json, run once at load (content-load.js).
//  Every check WARNS (always naming the node or segment) and continues
//  — authoring mistakes should be loud in the console, never a crash.
import { EXIT } from './spine.js';   // explicit extension: keeps this chain runnable in plain Node for tests

//  The only legal keys in effects/requires. `distance` is deliberately
//  NOT one — it's the clock (distanceM in Game.js), not a stat.
const STAT_KEYS = ['water', 'energy', 'morale'];

//  Segment vocab (SEGMENT-TABLE.md v1.1).
const WEIGHTS = ['light', 'medium', 'heavy'];
const FREQUENCIES = ['every_hike_ok', 'once_per_hike', 'rare'];
const SETTINGS = ['water', 'valley', 'woodland', 'open', 'farmland', 'any'];
const SKIES = ['clear', 'wet', 'misty', 'goldenhour', 'night'];
const WORLD_STATES = ['wet', 'misty'];
const SKELETON_ROLES = ['opening', 'closing', 'ending'];

//  Every id a `next` can resolve to (string or weighted array).
const outcomesOf = next =>
    next === undefined ? []
        : (Array.isArray(next) ? next.map(o => o.id) : [next]);

export function validateContent (content)
{
    const warn = msg => console.warn(`content.json: ${msg}`);

    //  A `next` is a node id, the sentinel "@exit" (leave the segment;
    //  the spine deals what follows), or a weighted array of either.
    //  Every real id must exist — a bad pointer otherwise crashes at
    //  the NEXT landmark spawn, long after the typo was made.
    const checkNext = (id, next, where) => {
        if (next === undefined)
        {
            return warn(`"${id}" has no next (${where}) — the walk will crash after this stop`);
        }
        if (Array.isArray(next) && next.length === 0)
        {
            return warn(`"${id}" has an empty weighted next (${where})`);
        }
        const outcomes = Array.isArray(next) ? next : [{ id: next, weight: 1 }];
        for (const outcome of outcomes)
        {
            if (outcome.id !== EXIT && !content.nodes[outcome.id])
            {
                warn(`"${id}" points at unknown node "${outcome.id}" (${where})`);
            }
            if (Array.isArray(next) && !(typeof outcome.weight === 'number' && outcome.weight > 0))
            {
                warn(`"${id}" has a non-positive weight for "${outcome.id}" (${where})`);
            }
        }
    };

    const checkStatKeys = (id, obj, where) => {
        for (const key of Object.keys(obj || {}))
        {
            if (!STAT_KEYS.includes(key))
            {
                warn(`"${id}" uses unknown stat "${key}" in ${where} — legal keys: ${STAT_KEYS.join(', ')}`);
            }
        }
    };

    if (!content.nodes[content.start])
    {
        warn(`start id "${content.start}" is not a node`);
    }

    //  --- per-node checks ---

    for (const [id, node] of Object.entries(content.nodes))
    {
        //  Effects only live on options — beats show, choices change
        //  state. A node with no options never collects a deciding tap,
        //  so any effects it carries would move state silently; strip.
        if (!node.options && node.effects && Object.keys(node.effects).length > 0)
        {
            warn(`"${id}" (${node.type}) carries effects ${JSON.stringify(node.effects)} `
                + 'but has no options — effects ignored (effects only live on options '
                + '— beats show, choices change state)');
            delete node.effects;
        }

        if (node.type === 'ending') continue;   // endings have no next

        if (node.type === 'choice')
        {
            const options = node.options || [];
            if (options.length !== 2)
            {
                warn(`"${id}" is a choice with ${options.length} option(s) — must be exactly 2`);
            }
            //  At least one option must be un-gated, or a low-stat hiker
            //  meets a card with zero tappable buttons (soft-lock).
            if (options.length > 0 && !options.some(opt => !opt.requires))
            {
                warn(`"${id}" gates every option behind requires — if all fail, the card soft-locks`);
            }
            options.forEach((opt, i) => {
                checkNext(id, opt.next, `option ${i + 1} "${opt.label}"`);
                checkStatKeys(id, opt.effects, `option ${i + 1} effects`);
                checkStatKeys(id, opt.requires, `option ${i + 1} requires`);
            });
        }
        else
        {
            checkNext(id, node.next, 'beat next');
        }
    }

    //  --- segment checks (SEGMENT-TABLE.md v1.1) ---

    const segments = content.segments || {};
    if (Object.keys(segments).length === 0)
    {
        warn('no segments block — the spine has nothing to deal');
    }

    const owner = {};   // node id → owning segment
    for (const [segId, seg] of Object.entries(segments))
    {
        const members = seg.members || [];
        const memberSet = new Set(members);

        if (!content.nodes[seg.entry])
        {
            warn(`segment "${segId}" entry "${seg.entry}" is not a node`);
        }
        if (!memberSet.has(seg.entry))
        {
            warn(`segment "${segId}" entry "${seg.entry}" is not in its own members list`);
        }
        for (const m of members)
        {
            if (!content.nodes[m]) warn(`segment "${segId}" member "${m}" is not a node`);
            if (owner[m]) warn(`node "${m}" is in two segments: "${owner[m]}" and "${segId}"`);
            owner[m] = segId;
        }

        //  Vocab.
        if (!WEIGHTS.includes(seg.weight))
        {
            warn(`segment "${segId}" weight "${seg.weight}" — legal: ${WEIGHTS.join('/')}`);
        }
        if (!FREQUENCIES.includes(seg.frequency))
        {
            warn(`segment "${segId}" frequency "${seg.frequency}" — legal: ${FREQUENCIES.join('/')}`);
        }
        const setting = (seg.needs && seg.needs.setting) || 'any';
        if (!SETTINGS.includes(setting))
        {
            warn(`segment "${segId}" needs unknown setting "${setting}" — legal: ${SETTINGS.join('/')}`);
        }
        for (const sky of (seg.needs && seg.needs.sky) || [])
        {
            if (!SKIES.includes(sky))
            {
                warn(`segment "${segId}" needs unknown sky state "${sky}" — legal: ${SKIES.join('/')}`);
            }
        }
        if (seg.sets)
        {
            if (!WORLD_STATES.includes(seg.sets.state))
            {
                warn(`segment "${segId}" sets unknown state "${seg.sets.state}" — legal: ${WORLD_STATES.join('/')}`);
            }
            if (!(typeof seg.sets.stops === 'number' && seg.sets.stops > 0))
            {
                warn(`segment "${segId}" sets.stops must be a positive number`);
            }
        }
        if (seg.skeleton !== undefined && !SKELETON_ROLES.includes(seg.skeleton))
        {
            warn(`segment "${segId}" skeleton "${seg.skeleton}" — legal: ${SKELETON_ROLES.join('/')}`);
        }

        //  Rule 7: a segment ENTRY with gapM would smuggle a fast
        //  arrival across a boundary — boundaries use the normal roll.
        const entryNode = content.nodes[seg.entry];
        if (entryNode && typeof entryNode.gapM === 'number')
        {
            warn(`segment "${segId}" entry "${seg.entry}" carries gapM — boundary arrivals must use the normal gap roll (rule 7)`);
        }

        //  Internal chain: from the entry, literal nexts must stay
        //  inside the segment; every branch leaves via "@exit" (the
        //  ending segment terminates at an ending node instead).
        const isEnding = seg.skeleton === 'ending';
        const seen = new Set();
        const queue = [seg.entry];
        let exits = 0;
        let endings = 0;
        while (queue.length > 0)
        {
            const id = queue.shift();
            if (seen.has(id)) continue;
            seen.add(id);
            const node = content.nodes[id];
            if (!node) continue;
            if (node.type === 'ending') { endings += 1; continue; }
            const nexts = node.options ? node.options.map(o => o.next) : [node.next];
            for (const next of nexts)
            {
                for (const out of outcomesOf(next))
                {
                    if (out === EXIT) { exits += 1; continue; }
                    if (!memberSet.has(out))
                    {
                        warn(`segment "${segId}": "${id}" points at "${out}", outside the segment — internal pointers stay inside; use "${EXIT}" to leave`);
                    }
                    else
                    {
                        queue.push(out);
                    }
                }
            }
        }
        for (const m of members)
        {
            if (!seen.has(m)) warn(`segment "${segId}" member "${m}" is unreachable from its entry`);
        }
        if (isEnding)
        {
            if (endings === 0) warn(`ending segment "${segId}" never reaches an ending node`);
            if (exits > 0) warn(`ending segment "${segId}" contains "${EXIT}" — the trail terminates here`);
        }
        else if (exits === 0)
        {
            warn(`segment "${segId}" has no "${EXIT}" — the trail can never leave it`);
        }
    }

    //  Full coverage: every node belongs to exactly one segment.
    for (const id of Object.keys(content.nodes))
    {
        if (!owner[id]) warn(`node "${id}" is in no segment`);
    }

    //  Skeleton: exactly one opening and one ending; start must be the
    //  opening segment's entry.
    const openings = Object.entries(segments).filter(([, s]) => s.skeleton === 'opening');
    const skelEndings = Object.entries(segments).filter(([, s]) => s.skeleton === 'ending');
    if (openings.length !== 1)
    {
        warn(`expected exactly one skeleton "opening" segment, found ${openings.length}`);
    }
    if (skelEndings.length !== 1)
    {
        warn(`expected exactly one skeleton "ending" segment, found ${skelEndings.length}`);
    }
    if (openings.length === 1 && content.start !== openings[0][1].entry)
    {
        warn(`start "${content.start}" is not the opening segment's entry "${openings[0][1].entry}"`);
    }

    return content;
}
