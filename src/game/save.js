//  One save slot in the browser's localStorage. Photos (Session 6) will go
//  to IndexedDB instead — localStorage is for this small state object only.
const SAVE_KEY = 'wandern-gehen-save-1';
const SAVE_VERSION = 1;

export function writeSave (data)
{
    try
    {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, ...data }));
    }
    catch (e) { /* storage full or blocked — the hike just won't persist */ }
}

//  Returns the saved hike, or null if there isn't one / it's unusable.
//  validIds guards against saves pointing at content that no longer exists.
export function loadSave (validIds)
{
    try
    {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const save = JSON.parse(raw);
        if (save.v !== SAVE_VERSION) return null;
        if (!validIds.includes(save.currentId)) return null;
        return save;
    }
    catch (e)
    {
        return null;
    }
}
