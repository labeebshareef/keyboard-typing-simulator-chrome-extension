# GhostType — Implementation Plan

*Executes the recommendations in `brand-and-growth-strategy.md` and `tech-spec-ai-and-shortcut.md`. Brand: **GhostType**. Store title: `GhostType — Auto Typer & Typing Simulator` (41/45 chars). Solo-dev estimates; follows the repo's existing conventions (WXT 0.19, React 18, TS, Tailwind, Vitest, Biome — same doc style as `docs/modernization-plan.md`).*

**Release train**

| Release | Contents | Target |
|---|---|---|
| **R1 · v3.0.0 "GhostType"** | Rebrand + full listing refresh + keyboard shortcut + review-ask | Weeks 1–3 |
| **R2 · v3.1.0 "AI Assist"** | Local sample-data fill + Gemini Nano generate/rewrite/field-fill | Weeks 4–6 → launch window |
| **R3 · v3.2.0 "Export"** | Typing session → GIF/WebM export (the growth loop) | Weeks 8–11 |
| Ongoing | Content engine, localization, partnerships, monetization gate | M4–M12 |

Principle carried through every phase: **no analytics, no new permissions, no cloud.** Measurement comes from the CWS dev dashboard only.

---

## Phase 0 — Pre-flight (Week 1, ~2–3 days, no code)

| # | Task | Detail | Done when |
|---|---|---|---|
| 0.1 | Name clearance | CWS search for "GhostType"/"Ghost Type" collisions; quick USPTO + EUIPO screening search; register domain (ghosttype.app or .io); grab social handles | No blocking collision found; domain owned. **Gate: if blocked, fall back to Keyframe or Mimic — everything below is find-and-replace** |
| 0.2 | Icon + wordmark | Per brief: rounded keycap with ghost-negative-space / caret-with-fade motif, indigo `#5B5BD6` on near-white, dark variant. Produce: 16/48/128 PNGs, popup logo (~`ktsLogo-popup.png` dimensions), small tile 440×280, marquee 1400×560 | Icon legible at 16 px; assets exported |
| 0.3 | Baseline metrics | Screenshot current dashboard: installs/day, uninstalls, search-impression terms, listing conversion | Recorded — this is how you'll judge the rename's ranking impact |

---

## Phase 1 — Rebrand (R1 part A, Week 1–2, ~2 days of code + assets)

### 1.1 Repo changes

| File | Change |
|---|---|
| `wxt.config.ts` | `name` → GhostType title; `description` → new 130-char short description; `version` → `3.0.0` (use delivered `code/wxt.config.ts`, which also adds the `commands` block for Phase 2) |
| `package.json` | `name: "ghosttype"`, description, `version: 3.0.0` |
| `entrypoints/popup/App.tsx` | `APP_VERSION = 'v3.0.0'`; header `<h1>` → "GhostType"; swap logo import |
| `entrypoints/popup/assets/images/` | Replace `ktsLogo.png` / `ktsLogo-popup.png` with new marks (keep filenames to minimize churn, or rename + update imports) |
| `public/icons/icon16/48/128.png` | New icon set |
| `entrypoints/popup/style.css` | Accent token → `#5B5BD6` family (light + dark values) |
| `README.md` | New name; **update the "no background service worker" claim** to "event-driven service worker for keyboard shortcuts only — no network access, no listeners beyond commands" (required once Phase 2 lands) |
| Repo-wide | `grep -ri "keyboard typing simulator"` — update every user-facing string. Internal tokens (`__ktsSession`, `__ktsScan`, `data-kts-*`, storage key `preferences`) **stay unchanged** — renaming them buys nothing and risks breaking session recovery mid-update |

### 1.2 Store listing (CWS dashboard, no code)

- Title, short description, full description: paste from strategy doc §2 verbatim.
- 5 screenshots (1280×800) in the specified order: hero-typing → controls → field detection → recording mode → privacy card. Slot 5 gets swapped for the AI screenshot at R2.
- Upload 440×280 tile + 1400×560 marquee.
- "Good to know" section stays — it pre-empts the two existing negative-review themes (Google Slides, focus loss).

**Acceptance:** `npm run lint && npm run typecheck && npm test && npm run build` clean; unpacked build shows new identity everywhere; existing prefs survive (open popup pre/post update — v2 prefs load untouched).

**Risk note:** expect a possible 1–2 week store-search ranking wobble after rename; the keyword suffix in the title is the mitigation. Compare against the 0.3 baseline before panicking.

---

## Phase 2 — Keyboard shortcut (R1 part B, Week 2–3, ~2–3 days)

### 2.1 Engine changes — `entrypoints/popup/utils/injected-engine.ts`

1. `PageTypingRequest` gains `target?: 'auto' | 'focused'` (default `'auto'`, current behavior).
2. `startPageTyping`: when `target === 'focused'`, resolve `document.activeElement` (descend into same-origin frames if that's where focus lives), run it through the **existing** supported-target preflight; on failure return `ok: false` with a clear `status.message` ("Click into a text field first, then press the shortcut"). No new session semantics — reuses the basic-mode pipeline.
3. `controlPageTyping`: add `'toggle-pause'` — pause when phase is `delaying`/`running`, resume when `paused`, no-op otherwise.

### 2.2 New files (delivered, drop in as-is)

- `entrypoints/background.ts` — command router + injected toast (no `notifications` permission).
- `entrypoints/popup/utils/last-script.ts` — `storage.session` mirror, opt-in `storage.local` persistence, 50 K char cap.

### 2.3 Preferences v3 migration

- `types.ts`: `ShortcutPreferences { persistScript: boolean }`; extend `Preferences` to `version: 3`.
- `preferences.ts`: default `{ persistScript: false }`; extend `sanitizePreferences` (v2 payloads have no `shortcut` key → defaults fill in, same pattern as the v1→v2 `ui` migration).
- `preferences.test.ts`: cases — v2 payload migrates, invalid `shortcut` shape falls back, round-trip.

### 2.4 Popup integration

- `App.handleStart` (basic branch): after successful start → `void saveLastScript(text, preferences.shortcut.persistScript)`.
- `SettingsSidebar`: "Keyboard shortcut" section — (a) current binding read from `chrome.commands.getAll()`; (b) if unbound, amber hint + "Configure" button → `chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })`; (c) "Remember my script across restarts" toggle (off by default) with one-line privacy note; (d) "Clear saved text" → `clearLastScript()`.

### 2.5 Review-ask (same release, cheap retention/rating win)

- Counter in `storage.local` (`completedSessions`); after the 3rd `completed` phase, show a one-time dismissible card in the popup: "Enjoying GhostType? A review really helps an indie extension →" linking to the listing. One-time flag stored; never re-shown. No nag on failure states.

### 2.6 Test matrix (manual, before submission)

| Scenario | Expected |
|---|---|
| Shortcut on plain `<input>`/`<textarea>`/contenteditable | Types saved script at saved config |
| Shortcut with no saved script | Toast: open popup first |
| Shortcut on chrome:// page / Web Store | Toast: page not allowed |
| Shortcut while session running | (decide: ignore or toast "already typing" — recommend toast) |
| Alt+Shift+T claimed by another extension before install | Command unbound → Settings hint appears; rebinding at `chrome://extensions/shortcuts` works |
| Toggle-pause / stop shortcuts | Pause↔resume; stop cleans page per existing engine cleanup |
| Browser restart, persist OFF (default) | Saved script gone (session storage cleared) |
| Browser restart, persist ON | Script survives |

**Acceptance:** matrix green on Windows + macOS; vitest green; `wxt build` manifest contains 3 commands with 2 suggested keys. Submit R1 to CWS (expect normal review turnaround; no new permissions → low-friction review).

---

## Phase 3 — AI Assist (R2 v3.1.0, Weeks 4–6, ~4–6 days)

Ship order inside the phase mirrors the spec: **fallback first, Nano second** — the release never blocks on Nano.

### 3.1 Local sample data (half-day, ships value to 100% of users)

- Drop in `sample-data.ts` (delivered).
- `AdvancedTyping`/`FieldList` header: "Fill with sample data" button → `localFillFields(fields)` → `onFieldsChange`.
- `BasicTyping`: preset chips insert `LOCAL_DEMO_TEXTS` when Nano is unavailable.

### 3.2 Nano integration (delivered `ai.ts`; wiring ~2–3 days)

- `hooks/useAi.ts`: `{ availability, downloadProgress, session, ensureSession }`; check `getAiAvailability()` on every popup open (**never cache** — model can self-evict below 10 GB free disk); lazily create session on first use; `destroy()` on unmount.
- `components/AiSheet.tsx`: inline sheet opened from a ✦ button in `TypingArea` and an "AI Fill" button in `FieldList`. Four states:
  - `available` → chips + freeform prompt; `streamDemoCopy`/`streamRewrite` stream into the textarea; Esc → `AbortController`.
  - `downloadable` → "Enable on-device AI — one-time model download (a few GB, ~22 GB free disk needed). Runs 100% locally." **Enable** button = the required user gesture → `createAiSession(onProgress)` + progress bar.
  - `downloading` → progress bar, "you can close this popup — download continues".
  - `unavailable` → local presets only + "AI needs Chrome 138+ on a supported desktop" tooltip. No dead buttons.
- Rewrite chips (shorter/longer/friendlier/fix typos) render only when the text box is non-empty.
- AI Fill: `aiFillFields(session, fields)` — sends **field metadata only**, `responseConstraint` JSON schema, silent fallback to `localFillFields` on any failure.

### 3.3 QA

- Machine **with** Nano: all three generators; abort mid-stream; popup close mid-generation (no orphaned errors on reopen); field-fill on a 10+ field form (schema fits comfortably in context).
- Machine **without** (or Chrome <138): everything degrades to local presets; zero console errors.
- Regression: typing engine untouched by this phase — smoke basic + advanced sessions anyway.

### 3.4 Listing + launch prep updates

- Full description: add "GENERATE TEXT WITH ON-DEVICE AI" section above the privacy block ("powered by Gemini Nano, running entirely on your machine — zero new permissions").
- Screenshot slot 5 → AI sheet screenshot; keep privacy card as slot 6 if room.
- Release notes headline: *"AI text generation with zero new permissions — everything stays on your machine."*

**Acceptance:** all 3.3 passes; lint/typecheck/vitest/build clean; v3.1.0 submitted.

---

## Phase 4 — Launch window (Week 6–8, no code)

Sequenced *after* R2 so the AI hook is live:

1. **Landing one-pager** at ghosttype.app: hero video (Recording Mode footage), promise line ("Every take is the perfect take"), install CTA. Static site, one evening.
2. **Product Hunt**: "GhostType — realistic typing for demos, with fully on-device AI." Assets: 30-s video, 3 GIFs, first-comment tells the indie story + privacy stance. Realistic: 300–1,500 installs.
3. **Show HN** same week (separate day): lead with the on-device-AI engineering angle, not the utility. 0-or-3K lottery; the comment thread is also free user research.
4. **Chrome DevRel / built-in-AI outreach**: you are now a shipping Prompt API case study with a privacy-first angle — email the built-in AI team / submit to their showcase; request Featured-badge review via the dev console support path.
5. In-popup review-ask (2.5) has been accumulating since R1 — review velocity into the launch window compounds ranking.

**Gate (end of M2):** listing conversion ≥ baseline, rating trending ≥ 4.0 on new reviews. If conversion dropped post-rename, iterate hero screenshot before spending on content.

---

## Phase 5 — GIF/WebM export (R3 v3.2.0, Weeks 8–11, ~1–2 weeks — the growth loop)

Design sketch (validate in a spike first):

1. **Record**: engine already produces per-keystroke timing — add an opt-in session log (`{char, timestamp}[]` on `__ktsSession`, capped, cleared with existing cleanup paths).
2. **Replay + encode**: "Export" action in the popup after a completed session → opens an extension page (`entrypoints/export/`) that replays the log onto a styled `<canvas>` (editor-look theme presets: plain, terminal, chat bubble) and encodes WebM via `canvas.captureStream()` + `MediaRecorder`; GIF via a small encoder lib (e.g. `gifenc`) for README use.
3. **Options**: speed multiplier, theme, dimensions (README 800×200, Twitter 1280×720), optional "made with GhostType" end-frame — **default on, one-click off**.
4. Second PH launch ("GhostType 3.2 — turn any text into a typing video") + README-GIF angle in dev communities.
5. Feeds the SEO play: the same replay/encode code becomes the free web "typing GIF generator" page later (M5–M6).

**Acceptance:** export a 60-s session to WebM+GIF on Windows/macOS without dropped frames at 30 fps; no new permissions (extension page + canvas needs none).

---

## Phase 6 — Ongoing growth engine (M4 →) — cadences and gates, from strategy §6

| Workstream | Cadence | Notes |
|---|---|---|
| Short-form video (Shorts/TikTok) | 2/week | Satisfying typing loops, demo-tips; each links listing |
| Long-form YouTube | 1 per 2 weeks | "How to auto-type in ___" tutorials targeting search |
| SEO pages + free web GIF tool | 8–12 pages by M6 | Reuses R3 code |
| Listing localization | 8 languages by M5 | Title keywords + short description minimum; cheapest ranking win |
| Partnerships | M7–M9 | Screen-recorder communities (Screen Studio, Tella, Cap), demo-tool listicles |
| **M6 gate** | <6 K users → | Diagnose via dashboard sources; kill weakest channel, double best. **Add no new channels** |
| **Monetization gate** | ~10 K users / ~2 K WAU → | Pro, one-time $15–19 via ExtensionPay. Gates **new** features only: AI batch-fill presets, export themes/no end-frame, saved snippets. Never paywall existing basics |
| **M12 honest check** | — | Base 15–25 K · good 35–60 K · 100 K only if a loop/launch went viral. <8 K → wedge didn't take; hold position as best-reviewed utility in category, plan next swing |

---

## Cross-cutting

**Per-release checklist** (extends the repo's existing flow): `npm run lint` → `typecheck` → `test` → `build` → manual smoke (basic type, advanced batch, shortcut, pause/resume/stop, prefs migration) → `npm run zip` → CWS submit → tag release → update `docs/`.

**Risk register**

| Risk | Mitigation |
|---|---|
| Rename ranking dip | Keyword suffix kept in title; baseline (0.3) to measure; 2-week patience rule |
| GhostType name collision surfaces late | Phase 0 gate before any asset spend; Keyframe/Mimic as pre-cleared fallbacks |
| Nano availability varies wildly across users | Fallback-first design; feature never advertised as requirement; availability re-checked each open |
| CWS review delay near launch window | Submit R2 ≥1 week before PH date; launch on the live version only |
| Command shortcut conflicts | Unbound-detection + Settings deep link (2.4); Alt+Shift namespace |
| Review backlash on future monetization | Pro gates new features only; documented in listing changelog |

**Explicit non-goals** (from both docs — resist scope creep): no telemetry/analytics, no cloud AI fallback, no subscriptions, no paid ads, no Firefox/Edge ports until Chrome works, no "undetectable/bypass detection" positioning ever, no typing-practice or accessibility marketing claims.

**Timeline at a glance**

```
Wk 1      ▸ Phase 0 pre-flight + Phase 1 rebrand code
Wk 2–3    ▸ Phase 2 shortcut + review-ask → ship R1 v3.0.0
Wk 4–6    ▸ Phase 3 AI Assist → ship R2 v3.1.0
Wk 6–8    ▸ Phase 4 launches (PH, HN, DevRel, Featured badge)
Wk 8–11   ▸ Phase 5 export → ship R3 v3.2.0 → second launch
M4–M12    ▸ Phase 6 engine: content, SEO, localization, partnerships
            gates at M6 (6K) · ~10K (monetize) · M12 (honest check)
```
