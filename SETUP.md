# SETUP — Programs & Accounts

Everything you need installed and signed up for **before** writing code. None of this costs money except Pixel Lab, and you don't touch Pixel Lab until the art pass at the very end.

---

## Install these programs

| Program | What it's for | Notes |
|---|---|---|
| **Node.js** (LTS version) | Runs the Phaser project's build tooling and local dev server. | Get the "LTS" build from nodejs.org. Installing Node also installs `npm`, which fetches Phaser and any libraries. |
| **Git** | Version control — your undo button when Claude Code breaks something. | git-scm.com. This is non-negotiable; it's your safety net. |
| **Claude Code** | Writes and wires the game, session by session. | The desktop app is the easiest entry. It reads these docs for context. |
| **A code editor** (VS Code) | Somewhere to see the files and run things. | Optional if you drive everything through Claude Code, but handy. |
| **Your DAW** | Composing the audio stems. | You already have this. See AUDIO.md for how to export stems. |

## Create these accounts

| Account | What it's for | Cost |
|---|---|---|
| **GitHub** | Version-control hosting *and* free website hosting (GitHub Pages). | Free. Public repo required on the free tier — fine for this. |
| **Pixel Lab** | Generating the pixel art. | Paid (subscription/API). **Sign up only when you reach the art pass** — not now. |

### Optional / later

| Thing | When you'd want it |
|---|---|
| **Cloudflare Pages** | If you later want a custom domain (e.g. `mygame.com`) or a faster CDN. GitHub Pages alone is plenty to start. |
| **itch.io** | When you want to *share* the game — it's built for indie/pixel games with a built-in audience. A "later" thing, not a "setup" thing. |
| **A domain name** | Pure vanity/polish. Skip until the game exists. |

---

## Hosting: what you need to know

- The game is a **static site** (HTML/JS/assets). All save data lives in the *player's own browser*. There is **no server and no backend** to run or pay for.
- **GitHub Pages** hosts it free, over HTTPS. HTTPS matters: the PWA "Add to Home Screen" feature only works on a secure origin, so free Pages hosting isn't just convenient, it's required for the installable-app feature.
- **Size is never a concern.** A published GitHub Pages site can be up to **1 GB**; this whole game will be roughly **5–15 MB** fully built (see ASSET-CHECKLIST.md), so ~1% of the limit. The soft bandwidth cap is 100 GB/month — thousands of fresh visitors — and because it's a PWA, returning players re-download nothing.

---

## Session 0 — "You're ready when…"

This is mostly *not* coding. It's just getting the tools in place. You're done when:

- [ ] `node --version` prints a version number in a terminal.
- [ ] `git --version` prints a version number.
- [ ] You have a GitHub account and can log in.
- [ ] Claude Code is open and pointed at an (empty) project folder.

That's the whole gate. Once all four are true, go to BUILD-SESSIONS.md → Session 1.

> **Do NOT** create the Pixel Lab account yet. Building on placeholders first is the whole cost-safety strategy — you want the game proven fun before you spend.
