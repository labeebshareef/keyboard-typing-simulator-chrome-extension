# Field Assistant — "✨ AI generate" on input fields
## Implementation plan for v3.3.0 (last feature before go-live)

*The feature: a small GhostType icon appears at input fields on the page; clicking it opens a prompt box; AI generates text; "Insert" types it into the field with the existing engine. Plus a highly visible quick on/off so it never gets in the way of normal browsing.*

---

## 1. Research summary — what the evidence says

**1a. The permission trap (most important finding).** Every "icon on every field" assistant you've seen (Grammarly, Compose AI, Monica) ships a content script on `<all_urls>`. That costs the scariest install warning Chrome has — *"Read and change all your data on all websites"* — plus slower CWS reviews forever after. GhostType's single hard differentiator is the opposite: **no host permissions, no content scripts, nothing runs unless you invoke it**. Shipping this feature the Grammarly way would delete the "PRIVATE BY DESIGN" section from your own listing. The plan below gets the feature *without* any new install-time permission.

**1b. The overlap/annoyance problem is real and documented.** Grammarly maintains a whole support article for "Grammarly overlaps my text or text area" and an engineering post about the input-lag their in-field UI caused — and "how do I hide this icon" is one of the most common complaints in that product category. Lessons adopted here: show the icon **only for the focused field** (never decorate the whole page), render it in a **closed shadow DOM** so site CSS can't break it and ours can't break the site, drive it from cheap `focusin`/`focusout` listeners (no page-wide MutationObserver), and make turning it off effortless — which is exactly the toggle you asked for.

**1c. Where the AI can run.** Chrome's docs guarantee the Prompt API in *extension contexts* (service worker, popup) from Chrome 138; availability inside **content scripts is not documented/guaranteed** (page-context availability trails extensions by ~10 milestones). Architecture consequence: **generation runs in the background service worker** — the in-page UI sends the prompt over a `chrome.runtime` Port and receives streamed chunks back. This also means one cached model session serves every tab, and the field assistant automatically reuses the popup's existing enable/download flow.

**1d. What we already have working for us.** The typing engine and the injected UI share the same isolated world per tab (popup `executeScript` injections and injected scripts land in the same world), so the assistant can call `startPageTyping` directly — the "Insert types it for real" step is nearly free. The site-preset generator (host + title → 3–4 tailored chips) drops straight into the panel as quick actions.

---

## 2. The activation model (and the toggle you asked for)

**Default mode: "invoked per page," not "always everywhere."**

```
┌────────────────────────────────────────────────────────────┐
│ How icons get onto a page (any one of):                    │
│  • Popup master switch ON + click "Show on this page"      │
│  • Keyboard: Alt+Shift+A (toggles icons on current tab)    │
│ How they disappear:                                        │
│  • Alt+Shift+A again · panel's "Hide on this page"         │
│  • navigation/reload (nothing persists into the next page) │
│  • master switch OFF kills the feature everywhere, 1 click │
└────────────────────────────────────────────────────────────┘
```

Why this is the right UX and not a compromise: it needs **zero new permissions** (the popup click / command press grants `activeTab`), it is *by construction* never a problem-maker while browsing — pages are untouched until you summon it — and "summon" is one keystroke. The master switch answers your explicit ask; the per-page invocation answers it structurally.

**The toggle system (three layers, most-visible first):**

1. **Popup master switch** — a full-width switch row directly under the popup header, before the tabs (not buried in the gear menu): `✨ Field assistant  [ON/OFF]` with a one-line sublabel that doubles as the action: *"Press Alt+Shift+A or click here to show AI icons on this page."* When ON and active on the current tab, the row shows "Active on this page · Hide". Uses the existing `Switch` component.
2. **Keyboard** — `Alt+Shift+A` (`toggle-field-assistant` command; we have exactly one suggested-key slot left of Chrome's four, and this earns it more than `stop-typing` would).
3. **In-page escape hatch** — the panel footer has "Hide on this page"; the icon's tooltip mentions Alt+Shift+A. Optional polish: action **badge** shows a small dot while the assistant is active on the current tab, so it's always visible *why* icons are showing.

Master OFF is stored in prefs (v4) and checked by both the popup button and the command handler — when OFF, Alt+Shift+A shows the standard toast: "Field assistant is off — turn it on in the GhostType popup."

**Explicit non-goal for v3.3.0:** "always on for every site" via `<all_urls>`. If real users ask, Phase B (§7) adds *per-site* always-on through `optional_host_permissions` — granted origin-by-origin from a user click, same pattern as the clipboard permission. Never as a default.

---

## 3. UX spec

### 3.1 The icon

Appears when an eligible field gains focus; follows focus; gone on blur (300 ms grace so moving pointer from field → icon doesn't dismiss it).

| Aspect | Spec |
|---|---|
| Eligibility | Same as engine preflight: text/email/search/url/tel inputs, textareas, contenteditable; NOT password/readonly/disabled; field ≥ 120 px wide and ≥ 24 px tall (skips OTP boxes, date parts, tiny search pills) |
| Placement | Anchored to the field's **outside top-right corner** (inside bottom-right for textareas taller than 80 px); repositioned on scroll/resize via `requestAnimationFrame`-throttled listener; never overlaps the caret line |
| Look | 22 px rounded square, brand indigo caret-ghost glyph at 60 % opacity, 100 % on hover, subtle enter animation (120 ms fade/scale); `title="Generate with GhostType (AI runs on your device)"` |
| Isolation | Single `<div>` host attached to `document.documentElement`, **shadow DOM (closed)**, all styles inside; `z-index: 2147483646`; `pointer-events` only on the icon itself |
| While typing session runs | Icon morphs into a stop button (square glyph, red tint) — click = stop, matching the shortcut behavior |
| Perf budget | Zero work until `focusin` fires; handler < 1 ms; no observers, no polling, nothing on pages where the assistant wasn't invoked |

### 3.2 The panel

Opens on icon click, anchored to the icon (flips to stay in viewport), ~320 px wide, same shadow root.

```
┌─ GhostType ✨ ────────────────────────── ✕ ─┐
│ [Support reply] [Order note] [Bio]  ← site  │
│                                    presets  │
│ ┌─────────────────────────────────────────┐ │
│ │ Describe what to write…                 │ │
│ └─────────────────────────────────────────┘ │
│                              [ Generate ⏎ ] │
│ ┌─ preview (streams in, scrollable) ──────┐ │
│ │ Hi! Thanks for reaching out about…      │ │
│ └─────────────────────────────────────────┘ │
│ [Insert & Type]  [Regenerate]   Hide on page│
└─────────────────────────────────────────────┘
```

- Prompt input autofocused; **Enter = Generate**, Shift+Enter = newline, **Esc = close** (returns focus to the field); click-outside closes.
- Chips = the existing site-aware presets (cached per host); static presets as fallback — one tap, no typing needed. The field's label/placeholder is included in the prompt as context (metadata only, consistent with AI Fill's privacy rule: never page content).
- Generation streams into the preview (visibly alive, abortable). **Insert & Type** closes the panel, refocuses the field, and runs the engine with the user's saved typing config — the differentiator line under the button: *"Inserts by typing, like a human."* Regenerate reruns the same prompt.
- Footer microcopy: "Runs on your device · nothing leaves your machine".

### 3.3 AI states (mirrors AiAssist, no dead ends)

| Model state | Panel behavior |
|---|---|
| `available` | Full experience |
| `downloadable` / `downloading` | Chips insert local sample texts; banner: "Enable on-device AI from the GhostType popup" (download stays a popup-gesture flow — one consent surface, not two) |
| `unavailable` | Chips insert local sample texts; explainer line; prompt box hidden |
| Generation error | Inline "Generation failed — try again"; Insert stays available for whatever is already in the preview |

---

## 4. Technical design

**New pieces**

| Piece | What it is |
|---|---|
| `entrypoints/assistant.content.ts` (built as an *unlisted script*, injected on demand — not a manifest content script) | The whole in-page feature: focus tracking, icon, panel (vanilla DOM in shadow root — no React on host pages; ~6–8 KB), calls `startPageTyping` directly (same isolated world), talks to the SW via a long-lived Port. Injection is idempotent (`window.__ktsAssistant` guard) with mount/unmount so Alt+Shift+A cleanly toggles |
| Background additions | `toggle-field-assistant` command handler (checks master pref → `scripting.executeScript({ files: ['assistant.js'] })` or sends unmount message); `chrome.runtime.onConnect` port handler running `session.promptStreaming` in the SW and relaying chunks; reuses `getAiAvailability`/session mgmt (extract the popup's session logic into a shared `utils/ai-session.ts` so SW and popup don't duplicate it) |
| Popup | Master switch row (new `AssistantToggle` component under the header); "show on this page" action = same injection call; prefs v4 |
| Prefs v4 | `assistant: { enabled: boolean }` (default **true** for the master capability — icons still appear only when invoked; the switch exists to hard-kill it) — same `sanitizePreferences` migration pattern as v2→v3 |
| Engine | One small addition: `startPageTyping` accepts basic-mode typing into a *specific* element the assistant already holds (it re-focuses the field before starting, so `document.activeElement` may already suffice — decide in implementation; if focus proves flaky on some frameworks, add `targetFieldId` resolved via a `data-kts-assist` attribute) |
| `wxt.config.ts` | 4th command `toggle-field-assistant` (`Alt+Shift+A`, the last suggested-key slot); **no permission changes** |

**Message flow**

```
panel ──port.postMessage({type:'generate', prompt, fieldMeta})──▶ SW
  ◀── {type:'chunk', text} … {type:'done'} / {type:'error'} ────┘
panel "Insert & Type" ──(same world, direct call)──▶ startPageTyping
```

**Deliberately not doing:** React in the page (bundle + collision risk), MutationObservers (perf), iframes in v1 (top frame only — same rule the popup effectively has today), any storage of generated text.

## 5. Build order & estimates (~4–6 dev-days total)

1. **Prefs v4 + master switch + command/injection plumbing** (~1 d) — Alt+Shift+A injects/removes a stub that just logs; toggle row in popup; toast when master-off. *Gate: toggling feels instant on 5 popular sites.*
2. **Icon + focus tracking in shadow DOM** (~1 d) — eligibility rules, positioning, enter/exit animation, stop-button morph.
3. **Panel + SW streaming bridge** (~1.5 d) — port protocol, chips reuse, states table, Esc/click-outside/focus-return.
4. **Insert & Type integration** (~0.5 d) — engine call, progress → stop morphing, edge: field removed mid-generation.
5. **Polish + QA matrix** (~1 d) — below.
6. Version → 3.3.0; update README (commands table + a "Field assistant" section) and the listing's feature list; new screenshot slot 3 (this feature is *very* screenshot-able and belongs in the listing's top row).

## 6. QA matrix (manual, before submit)

| Scenario | Expect |
|---|---|
| Alt+Shift+A on plain form site → focus fields | Icon follows focus; no layout shift; panel opens/closes cleanly |
| Gmail compose / GitHub comment / Google Docs | Gmail+GitHub work (contenteditable); Docs: no icon (canvas — consistent with listing's "Good to know") |
| Dense UI (Notion, Jira) | Icon never overlaps native controls; if it does → placement flip logic |
| Master switch OFF | Alt+Shift+A → toast; no injection possible from anywhere |
| Reload / SPA navigation | Icons gone; no console errors; re-invoke works |
| Generate → Insert on React/Vue forms | Types via engine, framework state updates (existing engine guarantee) |
| Nano absent machine | Chips insert samples; prompt box hidden; no errors |
| Long generation → Esc / close tab mid-stream | SW aborts session prompt; no orphaned ports |
| Dark sites + light sites | Shadow-DOM styles unaffected; icon legible on both (auto dark variant via `prefers-color-scheme`) |
| Typing session from popup while icons active | No interference; icon shows stop state |

## 7. Phase B (only if users ask after launch): per-site always-on

`optional_host_permissions: ["<all_urls>"]` in manifest (no install warning until used); panel/popup gains "Always show on this site" → `chrome.permissions.request({origins: ["https://site.com/*"]})` from the click → `chrome.scripting.registerContentScripts` for that origin with `persistAcrossSessions: true`; managed site list (view/revoke) in the gear menu. The master switch then governs three states: Off / On when invoked / On for my sites. Ship only with real demand — every step stays user-initiated and per-origin.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Site CSS/JS conflicts | Closed shadow DOM, one host element, max z-index, no global listeners beyond focusin/scroll |
| CWS review flags "remote-looking" UI injection | No new permissions, no remote code, injection is user-gesture-only — note it in the review notes field |
| Users expect always-on and rate 3★ "icons disappeared" | Popup sublabel + icon tooltip both teach Alt+Shift+A; listing copy says "summon on any page with one keystroke" |
| SW session eviction mid-stream | Port reconnect + one retry, then error state |
| Suggested-key conflict for Alt+Shift+A | Same unbound-detection + `chrome://extensions/shortcuts` hint already shipped |
```
