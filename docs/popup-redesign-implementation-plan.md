# Popup Redesign — Implementation Plan

**Project:** Keyboard Typing Simulator (WXT · React · TypeScript · Tailwind · Chrome MV3)
**Design direction:** Compact ~440px popup · tiered progressive disclosure · sticky action bar · dynamic height
**Reference:** UX analysis & recommendation (2026-07-25)

---

## 1. Target design (recap)

```
┌──────────────────────────────── 440px ───┐
│ ⌨ Keyboard Typing Simulator      ⚙      │  Header + gear menu (theme, about)
│ [ Basic ]  [ Advanced ]                  │  Mode tabs
├──────────────────────────────────────────┤
│ BASIC                                    │
│ ┌ Text to type… (autofocus) ───────────┐ │  Tier 1 — always visible
│ Speed  ───●────  Normal · 100ms          │  Tier 2 — inline tuning
│ Style  [ Random delay ▾ ]                │
│ ▸ More options  (mistakes · sounds)      │  Tier 3 — collapsed, persisted
├──────────────────────────────────────────┤
│ [▶ Start typing] [■]  ▓▓▓░░ 42% · status │  STICKY ActionBar — never scrolls
└──────────────────────────────────────────┘

ADVANCED (same shell)
│ 🔍 6 fields found              [Rescan]  │  Pinned scan bar
│ ┌ field cards… ┐  ← the ONE scroll region│
│ ▸ Timing  (start 2s · between 1s · hide) │  Collapsed accordion w/ value summary
│ [▶ Start] sticky ActionBar               │
```

**Disclosure tiers**

| Tier | Contents | Placement |
|---|---|---|
| 1 — every session | textarea / field list, start·pause·stop, progress, status | Always visible; controls pinned in sticky footer |
| 2 — occasional | speed, style (Basic) · initial delay, inter-field delay, hide-extension (Advanced) | Inline (Basic) / collapsed "Timing" accordion with value summary (Advanced) |
| 3 — set & forget | mistakes, sounds → "More options" collapsible · theme, version/about → gear menu | Collapsed by default, state persisted |

---

## 2. Gap analysis (current code → target)

| Current | Problem vs target | Change |
|---|---|---|
| `body { width: 460px; height: 600px }` + `h-[600px]` shell (App.tsx:67) | Fixed 600px height ⇒ dead space in Basic mode; two sources of truth for size | Dynamic height: shell `min-h` + `max-h-[600px]`; width via one CSS var |
| `SettingsSidebar` renders **below** main content inside the shared `flex-1 overflow-y-auto` (App.tsx:83–107) | Settings and content compete in one scroll; controls scroll away; flat hierarchy (7 equal cards) | Delete the monolith; redistribute controls into tiers (§1) |
| `TypingControls` + `ProgressDisplay` render inside the scrollable content (BasicTyping.tsx, AdvancedTyping.tsx) | Primary action can scroll out of view — the one genuinely harmful scroll failure | New sticky `ActionBar` in the shell footer, shared by both modes |
| Status line is a separate footer strip (App.tsx:109–115) | Third pinned band wastes vertical space | Merge into ActionBar (status text ↔ progress share the row) |
| Theme/sounds/mistakes are permanent cards | Set-once settings own permanent pixels | Gear menu (theme, about) + "More options" collapsible (mistakes, sounds) |
| Advanced: scan button, message, FieldList, start button all stacked in one column that scrolls with the page container | List is unbounded; pinned context lost while scrolling | Pinned scan bar; FieldList wrapper becomes the single scroll region; Timing accordion; ActionBar pinned |
| FieldList auto-scroll `containerRef` points at an inner `div` that never actually scrolls (FieldList.tsx:211) | Drag auto-scroll is currently a no-op | Point the ref at the new real scroll container (pass ref or context from AdvancedTyping) |
| Dark theme = CSS overrides of `.bg-white`, `.text-gray-*` (style.css:43–65); TabNavigation/SettingsSidebar/FieldList use raw gray classes | Fragile; every new class needs an override | Migrate touched components to the existing CSS vars while rewriting them (no separate big-bang refactor) |
| Preferences v1: `{typing, advanced, theme}` | No home for UI state (accordion expansion, active tab) | Prefs v2 with `ui` section + sanitizer migration |

Not changing: `useTypingSession` (polling/status restore works and already survives popup reopen), `injected-engine`, scan/typing logic, WXT config, manifest.

---

## 3. Phases

Each phase ships independently and leaves the extension working. Sizes: S ≈ ½ day, M ≈ 1 day, L ≈ 2 days.

### Phase 0 — Sizing foundation (S)

- `style.css`: replace fixed `body` sizing with
  `:root { --popup-width: 440px; --popup-max-height: 600px; }`,
  `body { width: var(--popup-width); }` — **remove** `height: 600px`.
- `App.tsx`: shell becomes `flex min-h-[320px] max-h-[var(--popup-max-height)] flex-col` (drop `h-[600px]`).
- Verify in Chrome: Basic mode popup shrinks to content (~460–500px tall), Advanced grows to 600 max. Check both OS scale factors you support (100%/125%) — popup max is clamped by Chrome at 800×600 regardless.
- Decision recorded: **440px** width (field cards need ≥ ~390px usable; 460 also acceptable, but pick one and keep it in the CSS var only).

**Acceptance:** no horizontal scrollbar, no dead space below Basic content, Advanced clamps at 600px.

### Phase 1 — Shell restructure: ActionBar + slim header (M)

New components:

- `components/ActionBar.tsx` — sticky footer, shared by both modes. Absorbs `TypingControls` + `ProgressDisplay` + the status strip:
  - Idle: `[▶ Start typing]` (+ context: disabled reasons via status text on the right).
  - Active: `[⏸/▶] [■]` + progress bar + `%`; status/error text below on one 12px line, `aria-live="polite"` retained (move the existing `role="status"/"alert"` logic here).
  - Props: `session`, `mode`, `onStart` (mode-specific start passed down from App), `startDisabled`, `startDisabledReason?`.
- `components/HeaderMenu.tsx` — gear button in the header row opening a small popover (not `<select>` styling — a real menu): Theme (system/light/dark radio group), version, link-out placeholder for "Report issue". Focus-trapped, `Esc` closes, `aria-expanded`/`aria-haspopup`.

App.tsx changes:

- Layout: `header (shrink-0) → tabs (shrink-0) → content (flex-1 min-h-0 overflow-y-auto) → ActionBar (shrink-0)`.
- Lift Basic's `text` state from `BasicTyping` to App (or a small context) — the ActionBar needs `text.trim()` to compute start-disabled, and Advanced's start handler needs `detectedFields` (lift it too, or expose an imperative callback — **lift state; it also fixes losing the scan list when switching tabs**).
- Delete the standalone status footer; delete `TypingControls` and `ProgressDisplay` usages (keep `ProgressDisplay` as an internal piece of ActionBar or inline its 20 lines).
- `TypingArea`: add `autoFocus`; keep char/word counts.
- While rewriting header/tabs: swap raw gray classes for the CSS vars (TabNavigation is 40 lines — rewrite with vars).

**Acceptance:** in both modes, Start/Pause/Stop and progress are visible at every scroll position; reopening the popup mid-session immediately shows the running state in the ActionBar (existing `useTypingSession` restore covers this); `hideExtension` still closes the window on start.

### Phase 2 — Basic mode tiering (M)

- New `components/InlineTuning.tsx` (Tier 2): compact Speed slider row (label + colored speed name + ms readout, reuse `getDelayLabel`/`getDelayColor` from SettingsSidebar) and Style select row with its one-line description. Two rows, no card chrome — plain rows separated by spacing, not 7 boxed cards.
- New `components/Collapsible.tsx` (generic, reused in Phase 3): button header with `▸/▾`, `aria-expanded`, `aria-controls`, chevron rotation honoring `prefers-reduced-motion`, and a **summary slot** rendered when collapsed.
- New `components/MoreOptions.tsx` (Tier 3, inside a `Collapsible` titled "More options"): Include-mistakes toggle, Typing-sounds toggle (reuse the existing switch markup — extract a `Switch.tsx` since it's currently copy-pasted 3×). Collapsed summary example: `mistakes off · sounds on`.
- Theme select moves to HeaderMenu (Phase 1); delete `SettingsSidebar.tsx` once empty.
- `BasicTyping.tsx` becomes: `TypingArea → InlineTuning → MoreOptions` (controls/progress now live in ActionBar).

**Acceptance:** default Basic state fits with **zero scrolling** at 440×≤600; every removed setting is reachable within one click; toggles/selects still persist via existing prefs plumbing.

### Phase 3 — Advanced mode: one scroll region (L)

- `AdvancedTyping.tsx` restructure:
  - **Pinned scan bar** (top, `shrink-0`): scan/rescan button (smaller — secondary style once fields exist), field count + scan message inline (`aria-live` kept), clear-scan icon button.
  - **Scroll region**: `div.flex-1.min-h-0.overflow-y-auto` wrapping `FieldList` only. This is the single scroll surface in Advanced mode; the page-level content container stops scrolling in this tab (`overflow-hidden` on the content wrapper when Advanced is active, or simply make Advanced's root `flex h-full flex-col`).
  - **Timing accordion** (below the list, `shrink-0`, `Collapsible`): Initial-delay slider, Inter-field-delay slider, Hide-extension switch (all moved from SettingsSidebar). Collapsed header shows live summary: `start 2s · between 1s · hide off`. Collapsed by default.
- `FieldList.tsx` fixes while touching it:
  - Accept a `scrollContainerRef` prop (the new scroll region) so drag auto-scroll manipulates the element that actually scrolls — currently broken.
  - Compact the card: single-line text input that grows to multi-line on focus (`h-9` → `h-14` focus transition) to raise list density; keep char count + selector line.
  - Migrate card styling to CSS vars.
- Start button moves to ActionBar (`onStart` = existing `handleStartTyping`, lifted with `detectedFields`).

**Acceptance:** with 15 detected fields, only the field list scrolls; scan bar, timing summary, and Start remain visible at all times; drag-to-reorder auto-scrolls near the top/bottom edges of the list; empty state (no scan yet) fills the region with the existing prompt.

### Phase 4 — Preferences v2 + persistence of UI state (S)

- `types.ts` / `preferences.ts`:

```ts
interface UiPreferences {
  activeTab: 'basic' | 'advanced';
  moreOptionsExpanded: boolean;   // default true → first-run discoverability
  timingExpanded: boolean;        // default false
}
interface Preferences { version: 2; typing; advanced; theme; ui: UiPreferences }
```

- `sanitizePreferences`: accept v1 payloads (no `ui`) → fill defaults; keep all existing clamps; bump `version: 2`. **`moreOptionsExpanded` defaults to `true`** so first-run users see Tier 3 once; it persists collapsed after they collapse it — this is the discoverability mitigation from the design report.
- App: read/write `ui.activeTab` (restore last tab), pass expansion state/setters into the two `Collapsible`s.
- Extend `preferences.test.ts`: v1→v2 migration, malformed `ui`, round-trip of new fields.

**Acceptance:** tests green (`npm test`); collapsing "More options", closing and reopening the popup preserves the state; a user upgrading from v1 storage loses nothing.

### Phase 5 — Polish & a11y pass (S)

- Keyboard walk of both modes: tab order = header → tabs → content top-to-bottom → ActionBar; accordions toggle with Enter/Space; gear menu arrows + Esc.
- Focus: autofocus textarea in Basic; after "Scan page", move focus to the field list heading (`tabIndex={-1}` + `.focus()`), so keyboard users land on results.
- Dark theme sweep of all new components (everything new was built on CSS vars; verify the remaining gray-class overrides in style.css still cover FieldList leftovers, then trim dead overrides).
- Reduced-motion: chevron/height transitions gated (base rule already exists in style.css).
- Scrollbar styling: apply the existing 6px scrollbar to the field-list region; hide scrollbar-caused layout shift with `scrollbar-gutter: stable` on the scroll region.

### Phase 6 — Verification (S)

Manual matrix (load `.output/chrome-mv3` unpacked):

1. Basic happy path: paste → start → pause → resume → stop; progress + status visible throughout; popup reopen mid-session restores running UI.
2. Advanced on a 15+ field page (e.g. a long signup form): scan, reorder by drag and by priority number, disable some fields, start; only the list scrolls.
3. `hideExtension` on → start closes popup, typing continues, reopen shows progress.
4. Restricted pages (`chrome://`), discarded tab, refreshed page — existing error paths still surface in the ActionBar status line.
5. Theme: light/dark/system (flip OS theme live), every surface legible.
6. Sizes: popup height in Basic (~compact) vs Advanced with long list (clamped 600); no double scrollbars anywhere; 100%/125% display scaling.
7. `npm test` + `npm run build` clean; Biome/ESLint pass.

---

## 4. File-by-file summary

| File | Action |
|---|---|
| `popup/style.css` | Phase 0 sizing vars; Phase 5 scrollbar/gutter; trim dead dark-mode overrides |
| `popup/App.tsx` | New shell layout; lift `text` + `detectedFields`; wire ActionBar, HeaderMenu, ui-prefs |
| `popup/components/ActionBar.tsx` | **New** (absorbs TypingControls + ProgressDisplay + status strip) |
| `popup/components/HeaderMenu.tsx` | **New** (theme, version/about) |
| `popup/components/Collapsible.tsx` | **New** generic disclosure w/ summary slot |
| `popup/components/InlineTuning.tsx` | **New** (speed + style rows) |
| `popup/components/MoreOptions.tsx` | **New** (mistakes, sounds) |
| `popup/components/Switch.tsx` | **New** (extracted from 3 copy-pasted switches) |
| `popup/components/SettingsSidebar.tsx` | **Deleted** (Phase 2/3 complete its evacuation) |
| `popup/components/TypingControls.tsx`, `ProgressDisplay.tsx` | Deleted or folded into ActionBar |
| `popup/components/TabNavigation.tsx` | Restyle with CSS vars |
| `popup/components/BasicTyping.tsx` | Slims to TypingArea + InlineTuning + MoreOptions |
| `popup/components/AdvancedTyping.tsx` | Pinned scan bar · scroll region · Timing accordion; start handler lifted |
| `popup/components/FieldList.tsx` | `scrollContainerRef` fix; compact cards; CSS vars |
| `popup/components/TypingArea.tsx` | `autoFocus` |
| `popup/types.ts`, `utils/preferences.ts`, `utils/preferences.test.ts` | Prefs v2 + `ui` + migration + tests |
| `useTypingSession`, `injected-engine`, `session-status`, wxt config | **Unchanged** |

## 5. Risks & mitigations

- **Lifting `detectedFields` to App** touches the scan/typing flow — the riskiest single change. Mitigate: do it in Phase 1 behind unchanged behavior (Advanced keeps rendering the same tree), before any visual restructuring in Phase 3. Side benefit: scan results survive tab switches, which is currently not the case.
- **Dynamic height + sticky footer** can produce double scrollbars if any ancestor of the scroll region lacks `min-h-0`. Rule: exactly one `overflow-y-auto` per tab; everything else `shrink-0`.
- **Drag auto-scroll regression**: it's silently broken today, so any behavior is an improvement — but test explicitly with 15+ fields after the ref fix.
- **Discoverability of demoted settings**: `moreOptionsExpanded: true` default on first run; value summaries always visible in collapsed headers; nothing is more than one click deep.
- **Accepted trade-offs** (from the design report): tier-3 settings cost one extra click; no "everything at once" density — if that's ever needed, the home for it is an options page or Chrome side panel (future work, additive).

## 6. Out of scope / future

- Chrome **Side Panel** companion surface (persists while interacting with the page — pairs well with watching typing happen). Additive later; popup remains primary.
- Full CSS-var theming refactor beyond the components touched here.
- Options page — not needed at current settings count; revisit only if tier-3 grows.
