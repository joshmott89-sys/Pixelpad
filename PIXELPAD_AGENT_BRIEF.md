# PixelPad — Agent Development Brief
**Version:** 6.7 | **Architecture:** Single-file PWA (`index.html`) | **Target device:** Android smartphone

---

## 1. What PixelPad Is

A fully functional mobile-first coding IDE delivered as a **single `index.html` file** deployed to GitHub Pages. Zero install, zero build tools, zero backend. The user codes entirely on a smartphone using a touchscreen keyboard.

**Core stack:**
- **Ace Editor** (v1.32.3, CDN) — syntax highlighting, find/replace, code editing
- **Pyodide** (v0.25.0, lazy-loaded) — in-browser Python execution
- **Vanilla JS** — all state, UI, GitHub sync, AI calls
- **GitHub REST API** — project sync (push/pull/clone/delete)
- **Gemini + Claude APIs** — AI assist, auto-fix

---

## 2. The Single Golden Rule

> **Every response must be the complete, untruncated `index.html` file.**

The user's workflow is **Select All → Paste**. There is no way to apply partial diffs on a phone. Never use placeholders like `// existing code here`. Never truncate. Return the whole file every time.

---

## 3. File Structure

The entire application is one file with three sections:

```
index.html
├── <head>          CDN scripts (Ace), Google Fonts
├── <style>         All CSS — CSS variables, layout, components
├── <body>          All HTML — static DOM structure
└── <script>        All JS — state, functions, boot
```

**No external files. No imports. No modules. No build step.**
CSS variables, JS helpers, and HTML are all inline. The service worker is registered as a Blob URL at the bottom of the script.

---

## 4. CSS Design Tokens

All colours and sizes use CSS variables defined in `:root`. Never hardcode colours — always use these tokens:

```css
--bg:    #080b0a   /* page background */
--sur:   #0f1412   /* surface / panel background */
--rai:   #171d1a   /* raised element */
--card:  #1e2622   /* card background */
--bdr:   #253028   /* border subtle */
--bdr2:  #334038   /* border strong */
--tx:    #d8e8e0   /* primary text */
--mu:    #7a9e8e   /* muted text */
--ac:    #00e87a   /* accent green */
--acd:   #00a855   /* accent dark */
--wa:    #ff8c3d   /* warning orange */
--er:    #ff4d6d   /* error red */
--gem:   #8b5cf6   /* Gemini purple */
--cla:   #d97706   /* Claude amber */
--mono:  'JetBrains Mono', monospace
--ui:    -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--hh:    46px      /* header height */
--tbh:   52px      /* tab bar height */
```

---

## 5. State Model

All application state lives in two global objects:

### `W` — Workspace (persisted to `localStorage` key `pp_w`)
```js
W = {
  activeProject: 'Default',        // currently open project name
  projects: {
    'ProjectName': {
      createdAt: 1234567890,
      isSynced: false,              // true = GitHub repo
      files: {
        'index.html': {
          content: '...',           // raw file text
          sha: 'abc123',            // GitHub SHA (null for local-only)
          savedAt: 1234567890,      // timestamp for archive logic
          downloaded: true          // false = stub (not yet pulled)
        }
      }
    }
  },
  localOrder:  ['proj2', 'proj3'], // display order for local projects
  syncedOrder: ['proj1'],          // display order for GitHub projects
  // NOTE: 'Default' is always in localOrder conceptually but NOT stored
  // in localOrder array — it always renders at position 0 of local list
}
```

### `cfg` — Settings (persisted to `localStorage` key `pp_c`)
```js
cfg = {
  ghtoken: '',                        // GitHub PAT
  gkey:    '',                        // Gemini API key
  gmodel:  'gemini-2.5-flash',       // Gemini model
  ckey:    '',                        // Claude API key
  cmodel:  'claude-sonnet-4-20250514' // Claude model
}
```

### Key globals
```js
let curFile    = null;    // filename of currently open file (null = unsaved)
let aiProv     = 'gem';  // 'gem' or 'cla'
let kbUp       = false;  // virtual keyboard currently visible
let outH       = 0;      // output panel height in px
let srchOpen   = false;  // search bar visible
let _ed        = null;   // Ace editor instance
let _scrollAtBottom = false; // scroll jump button state (DO NOT use — removed)
```

---

## 6. Critical Functions Reference

### Workspace
| Function | Purpose |
|---|---|
| `loadWorkspace()` | Load from localStorage, run migration + sanitise |
| `saveWorkspace()` | Persist `W` to localStorage |
| `migrateW()` | **Always call after changing W** — ensures `syncedOrder`, `localOrder`, `projects` exist and are consistent |
| `sanitiseContent(str)` | Detect + unwrap double-JSON-stringified file content |
| `sanitiseWorkspace()` | Run sanitiseContent on all files in W |
| `repairWorkspace()` | Public UI function — runs sanitise + reloads editor |
| `activeProj()` | Returns `W.projects[W.activeProject]` |
| `activeFiles()` | Returns files object of active project |
| `persistFile(name, content, sha)` | Save file content to W + mark savedAt |

### Editor
| Function | Purpose |
|---|---|
| `ed()` | Returns the Ace editor instance |
| `initEditor()` | Set up Ace, event listeners, autosave debounce |
| `setUD(bool)` | Toggle the unsaved dot indicator |
| `lay()` | Recalculate all fixed-position element heights — call after any layout change |
| `modeFor(filename)` | Returns Ace mode string for a filename |

### Projects & Files
| Function | Purpose |
|---|---|
| `switchProj(name)` | Change active project, reload editor |
| `loadFile(name)` | Load file into editor (pulls from GitHub if `downloaded:false`) |
| `newFile()` | Clear editor for new unsaved file |
| `persistFile(n, content, sha)` | Write to W.projects[active].files |
| `deleteFile(name, e)` | Delete file locally + optionally from GitHub |
| `deleteProj(name, e)` | Delete project locally + optionally from GitHub |
| `renderSide()` | Re-render the entire sidebar |
| `renderInlineFiles(projName, isSynced)` | Returns HTML string of inline file list |
| `renderProjGroup(el, projects, type)` | Renders a section (GitHub/Local) with archive accordion |
| `updateDynamicToolbars()` | Update header badge + ribbon button visibility |

### GitHub
| Function | Purpose |
|---|---|
| `ghApi(path, method, body)` | Authenticated GitHub REST API call |
| `ensureGhUser()` | Resolve authenticated username (cached in `ghUserCache`) |
| `publishProject()` | Create new GitHub repo from local project |
| `doCloneRepo(name, branch)` | Clone GitHub repo structure into W |
| `pullFile(filename)` | Pull single file from GitHub |
| `pushFile()` | Push current file to GitHub |
| `unlinkRepo()` | Remove GitHub link, keep local |

### AI
| Function | Purpose |
|---|---|
| `sendAI()` | Send prompt to active AI provider |
| `callGem(prompt)` | Gemini API call — uses `cfg.gmodel` |
| `callCla(prompt)` | Claude API call — uses `cfg.cmodel` |
| `openAI()` / `closeAI()` | Toggle AI panel |
| `autoFixError()` | Populate AI with iframe error + source context, fire sendAI |
| `showErrToast(detail)` | Show persistent error toast with AUTO-FIX button |

### Preview
| Function | Purpose |
|---|---|
| `bundleProject()` | Assemble multi-file project into single HTML string |
| `runCode()` | Run current file — HTML → iframe preview, Python → Pyodide |
| `isWebProj()` | True if project has any .html/.css/.js/.json files |
| `findEntry()` | Find the entry HTML file (prefers `index.html`) |

### UI Utilities
| Function | Purpose |
|---|---|
| `toast(msg, type)` | Temporary notification — types: `'ok'`, `'bad'`, `''` |
| `toastUndo(msg, type)` | Toast with an UNDO button |
| `openModal(id)` / `closeModal(id)` | Show/hide modal overlays |
| `openSide()` / `closeSide()` | Toggle project sidebar |
| `openSearch()` / `closeSearch()` | Toggle find/replace bar |
| `openStructure()` / `closeStructure()` | Toggle Structure Navigator panel |
| `esc(str)` | Escape a string for use in HTML `onclick` attribute |
| `ago(timestamp)` | Format timestamp as "2m", "3h", "5d" |
| `_noopEv` | Global fake event object `{stopPropagation(){}}` — use in inline onclick when no real event is available |

---

## 7. Layout System

All positioned elements use `lay()` to calculate their `bottom` values dynamically, accounting for:
- The output panel height (`outH`)
- The toolbar height
- The virtual keyboard offset (`kbUp`)
- iOS safe area insets (`env(safe-area-inset-bottom)`)

**Never hardcode `bottom` values in CSS for floating elements.** Always add them to the `lay()` function.

Elements positioned by `lay()`:
- `#ew` (editor wrapper) — top/bottom
- `#tb` (tab bar) — bottom
- `#outp` (output panel) — bottom/height
- `#rpb` (magic paste button) — bottom
- `#snip-tog` (snippet toggle) — bottom
- `#toast` — bottom
- `#err-toast` — bottom
- `#scroll-dn` — bottom
- `#scroll-up` — top (vertical midpoint of editor)

---

## 8. UI Structure — The Ribbon Toolbar

Three tabs at the bottom: **Code | Git | Tools**

### Code tab
`Undo` | `Redo` | `Copy` | `Paste` (Magic Paste) | `Structure`

### Git tab  
`Pull` (synced only) | `Push` (synced only) | `Publish` (local only) | `Clone`

### Tools tab
`Run` | `Search` | `AI` | `Settings` | `Repair`

The ribbon also has a fixed snippet/keyword strip (`#snip-tog`) that toggles above the keyboard.

---

## 9. The Sidebar

**Structure:** The sidebar uses a split layout containing distinct wrapper areas for synced projects, local projects, and the currently active project's file list.

**Synced Repos (#wrap-synced)**
 * Header with Clone and Edit (⚙️) buttons.
 * Scrollable list of synced projects (W.syncedOrder).

**Local Scratchpads (#wrap-local)**
 * Header with + New and Edit (⚙️) buttons.
 * Scrollable list of local projects.
 * **Default project:** Always renders at position 0 in this list. It is not stored in W.localOrder and is never deleteable.

**Active Project Panel (#proj-hdr & #fl)**
 * Located below the project lists.
 * Header displays the active project name and project-level actions (Delete, Unlink).
 * File action bar dynamically shows context-appropriate buttons (#hdr-acts-local for local, #hdr-acts-synced for GitHub).
 * Scrollable list of files (#fl) for the active project.

**Edit Mode**
Toggling the ⚙️ button applies the .edit-mode class to the respective list wrapper. This hides the project icons and displays ↑, ↓, and ✕ buttons on the project rows for reordering and deletion.

---

## 10. Magic Paste System

The paste workflow for accepting AI-generated code:

1. User copies AI response → taps Magic Paste button (`#rpb`) or the Paste toolbar button
2. `confirmPasteZone()` reads clipboard, calls `parseMagicPaste()` to extract code blocks
3. Bottom sheet appears with action choices:
   - **Replace File** — overwrites the entire current file
   - **Replace Block** — opens block picker (`#mod-blockpick`) showing scannable function/tag blocks
   - **Insert at Cursor** — inserts at current cursor position
   - **Raw Paste** — inserts unprocessed clipboard text
4. All paste actions except "raw" use `toastUndo()` so the user can immediately undo

**Block picker** has a search input that filters the list in real-time via `filterBlockPicker()`.

---

## 11. Structure Navigator

Accessed via Code → Structure button. Opens a full-screen panel with:
- Sticky header showing filename
- Search input (filters flat list of matching symbols)
- Tree of parsed symbols with collapse toggles
- Tap any row → closes panel, scrolls editor to that line, highlights the block

**Parsers available:**
- `parseHtml(lines)` — tag tree with closing tag tracking for `endLine`
- `parseJs(lines)` — functions, arrow functions, classes, methods
- `parsePy(lines)` — def, class, decorators
- `parseCss(lines)` — selectors, @media, @keyframes
- `parseJson(lines)` — top two key levels

Each node has: `{ label, icon, line, endLine, depth, children[] }`

When jumping to a node, the editor selects from `line` to `endLine` (the full block) and scrolls that line to the top of the viewport.

---

## 12. Error Interceptor (Phase 2.1)

Every project bundled for preview gets an error guard injected at the top of `<head>`:

```js
window.onerror = function(msg, src, line, col, err) { /* postMessage to parent */ }
window.onunhandledrejection = function(ev) { /* postMessage to parent */ }
```

Errors postMessage to PixelPad's main window as `{ type: 'pp-error', msg, line, col }`.

The main window listener shows a persistent `#err-toast` with:
- The error message + line number
- `🤖 AUTO-FIX` button → calls `autoFixError()`

`autoFixError()` builds a rich prompt:
- Error message + line number
- ±15 lines of source around the error line with `>>>` marker
- File name and total line count
- System instruction: return entire corrected file, no truncation
- Then opens AI panel and fires `sendAI()`

---

## 13. Known Ace Editor Limitations

These are hard constraints discovered through development — do not attempt to work around them:

| Issue | Status |
|---|---|
| `foldAll(depth)` parameter only works for indent-based languages (JS/Python). For HTML it always folds the whole document at `<html>`. | **Do not use** — replaced with Structure Navigator |
| `ed().focus()` on mobile triggers the virtual keyboard popup. | Never call after toolbar button taps — use `ed().blur()` instead |
| `session.getScrollTopMax()` does not exist in this Ace version. | Use `renderer.layerConfig.maxHeight - renderer.$size.height` via the `_scrollMax()` helper |
| `renderer.layerConfig.maxHeight` is the correct total document pixel height. | Use `_scrollMax()` — do not calculate manually |
| Swipe gestures on the editor conflict with text selection. | Swipe-to-open side panels was removed. Panels open via buttons only. |
| `session.getAllFolds()` only returns top-level folds — nested folds inside collapsed parents are invisible. | Do not rely on this for fold state |
| Arrow functions `() => {}` inside HTML `onclick` attributes break HTML parsing when set via `innerHTML`. | Use named functions or `_noopEv` global |

---

## 14. Mobile UX Constraints

These are non-negotiable for the target device (Android smartphone, touchscreen-only):

- **No hover states** — all interactions must work on tap/touch
- **Minimum tap target: 44×44px** for any interactive element
- **No `ed().focus()` from toolbar buttons** — triggers virtual keyboard unexpectedly
- **`onmousedown="event.preventDefault()"` on buttons near the editor** — prevents focus transfer to Ace
- **Virtual keyboard debounce:** `initKeyboard()` debounces `visualViewport` resize events by 300ms and skips layout during active touch to prevent the toolbar floating mid-screen
- **No swipe gestures** — conflict with text selection
- **`-webkit-overflow-scrolling: touch`** on all scrollable containers
- **`user-select: none`** on body — Ace handles its own selection

---

## 15. Data Safety Rules

- **`migrateW()` must be called** after any operation that replaces `W` (restore backup, clone, etc.) — old backups may not have `syncedOrder`/`localOrder`
- **`sanitiseContent()`** detects double-JSON-stringified file content (AI responses sometimes wrap code in a JSON string). Called automatically on load and in `bundleProject()`
- **Autosave debounce:** Editor `session.on('change')` fires `persistFile()` after 1500ms. This is how all edits reach `W`
- **`savedAt` timestamps** drive the 30-day archive logic — always set via `persistFile()`, never manually
- **GitHub SHA** must be stored on every file pulled from GitHub and sent back on every push — without it the push is rejected as a conflict

---

## 16. GitHub API Notes

- All calls go through `ghApi(path, method, body)` which handles auth headers and error parsing
- GitHub username is cached in `ghUserCache` after first resolution via `ensureGhUser()`
- **Delete repo requires `delete_repo` PAT scope** — not included in the standard `repo` scope
- **Delete file requires the file's SHA** — stored as `files[name].sha`
- File content to/from GitHub is Base64 encoded — use `toB64()` / `fromB64()`
- Clone only fetches the tree structure (file names + SHAs) — content is lazy-loaded on first `loadFile()`

---

## 17. Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Project sidebar won't open | JS error in `renderSide()` or `updateDynamicToolbars()` | Check console — `openSide()` is wrapped in try/catch and will log the real error |
| Clone fails with "Cannot read properties of undefined (reading 'includes')" | `W.syncedOrder` undefined — old localStorage format | `migrateW()` not called before accessing order arrays |
| Restore backup says "Bad backup file" | Old backup has `projects` but no `syncedOrder` — `renderSide()` crashes and catch reports wrong error | `migrateW()` must be called after `W = d` |
| Preview shows escaped JSON / raw text instead of HTML | Double-stringified file content saved to localStorage | Use Repair button in Tools tab or call `repairWorkspace()` |
| Keyboard pops up when tapping toolbar button | `ed().focus()` called after button action | Remove `ed().focus()` — add `onmousedown="event.preventDefault()"` to the button |
| Toolbar floats in middle of screen after keyboard dismissed | `visualViewport` resize fired during touch, layout ran before keyboard settled | Already handled by 300ms debounce + touch-active guard in `initKeyboard()` |
| Arrow function in onclick attribute breaks innerHTML | `() => {}` syntax invalid inside HTML attribute strings | Use named functions or `_noopEv` |
| `Math.max(0, ...[])` returns `-Infinity` | Spreading empty array into Math.max | Always check array length before spreading — see `projLastActive()` |

---

## 18. What Does Not Exist / Has Been Removed
These features and elements are explicitly not part of the current architecture. Do not attempt to use or recreate them:
* Swipe-to-open gestures: Removed because they conflicted with the Ace editor's native touch text selection.
* Fold / Unfold buttons: Removed because the Ace fold API is unreliable on HTML. This functionality was replaced by the Structure Navigator.
* session.getScrollTopMax(): This method does not exist in the currently utilized version of the Ace editor.
* session.foldAll(startRow, endRow, depth): The depth parameter for this method is unreliable for HTML parsing and must be avoided.

---

## 19. Adding New Features — Checklist

Before submitting any change:

1. **CSS:** Use design tokens, not hardcode colours. Add floated elements to `lay()`.
2. **HTML attributes:** No arrow functions, no `{}` objects inline — use named functions or `_noopEv`.
3. **Mobile:** Tap targets ≥44px. No hover. `onmousedown="event.preventDefault()"` on buttons adjacent to editor.
4. **State:** Any change to `W` structure needs `migrateW()` updated to handle old formats.
5. **GitHub:** Any new push/pull needs the SHA. Any delete needs the SHA.
6. **AI prompt:** Auto-fix mode sends entire file. Non-auto-fix mode sends selected context. System prefix differs between modes — see `sendAI()`.
7. **Scroll/layout:** New fixed elements need a `lay()` entry. New panels that open need to `closeSide()` and/or `closeAI()`.
8. **Return the full file.** Always.
