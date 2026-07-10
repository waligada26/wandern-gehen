//  Photo keepsakes live in IndexedDB — images belong there, not in
//  localStorage (see GAME-DESIGN.md → capturing the moment).
const DB_NAME = 'wandern-gehen';
const STORE = 'photos';

function openAt (version)
{
    return new Promise((resolve, reject) => {
        const req = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE))
            {
                req.result.createObjectStore(STORE, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

//  Open at whatever version exists; if the photos store is somehow missing
//  (an older or foreign copy of the database), bump the version to add it.
async function openDb ()
{
    let db = await openAt();
    if (!db.objectStoreNames.contains(STORE))
    {
        const next = db.version + 1;
        db.close();
        db = await openAt(next);
    }
    return db;
}

//  photo: { id, creature, caption, dateIso, biome, dataUrl }
export async function savePhoto (photo)
{
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(photo);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function latestPhoto (creature)
{
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const req = db.transaction(STORE).objectStore(STORE).getAll();
        req.onsuccess = () => {
            const mine = req.result.filter(p => p.creature === creature);
            resolve(mine.length ? mine[mine.length - 1] : null);
        };
        req.onerror = () => reject(req.error);
    });
}

//  Native share sheet where the browser has one (phones); otherwise the
//  photo downloads — either way the keepsake leaves the game if asked to.
export async function sharePhoto (photo)
{
    try
    {
        const blob = await (await fetch(photo.dataUrl)).blob();
        const file = new File([blob], photo.id + '.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] }))
        {
            await navigator.share({ files: [file], text: photo.caption });
            return;
        }
    }
    catch (e) { /* user cancelled the sheet, or no support — fall through */ }
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = photo.id + '.png';
    a.click();
}
