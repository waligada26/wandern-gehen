//  Guardrail over content.json, run once when the content loads.
//  Every check WARNS (always naming the node) and continues — authoring
//  mistakes should be loud in the console, never a runtime crash.

//  The only legal keys in effects/requires. `distance` is deliberately
//  NOT one — it's the clock (distanceM in Game.js), not a stat.
const STAT_KEYS = ['water', 'energy', 'morale'];

export function validateContent (content)
{
    const warn = msg => console.warn(`content.json: ${msg}`);

    //  A `next` is a node id, or an array of weighted outcomes
    //  [{ id, weight }]. Every id must exist — a bad pointer otherwise
    //  crashes at the NEXT landmark spawn, long after the typo was made.
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
            if (!content.nodes[outcome.id])
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
    return content;
}
