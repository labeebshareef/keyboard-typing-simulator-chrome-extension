# Keyboard Typing Simulator Modernization

Status: automated implementation complete; unpacked-Chrome validation pending
Baseline version: 2.3.0
Audit date: 2026-07-22

This document is the durable implementation ledger for the repository audit. Keep findings, phase status, validation evidence, and acceptance checks current as work proceeds.

## Executive Summary

The WXT, React 18, TypeScript, Tailwind CSS, Lucide React, Vitest, and Biome stack is suitable and should be preserved. The extension does not need a rewrite. The modernization should focus on one tab-scoped typing-session model, safe field identity and preflight, a shared typing engine, deterministic cleanup, framework-compatible value updates, accessible feedback, preference persistence, and a compact operational popup.

Highest-risk findings:

1. Advanced mode can resolve an ambiguous or stale selector and clear the wrong field.
2. Basic and advanced modes do not share session ownership; `App.tsx` hardcodes `isTypingInProgress` to false.
3. Scan highlights are not cleaned when a scan is abandoned, rescanned, or only partly selected.
4. Basic mode can stay at 0% forever when the active element is invalid.
5. Advanced mode lacks pause, resume, stop, progress, and reliable partial-failure reporting.
6. Direct `element.value` assignment is unreliable for React and other controlled inputs.
7. There are no tests, and lint and standalone TypeScript checks fail.

The supplied public context is approximately 900 users and a 3.8-star rating. No Chrome Web Store review data was supplied or accessed.

## Validation Baseline

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run lint` | Failed | Biome checked 36 files: 177 errors, 17 warnings, and 184 suppressed diagnostics. Formatting drift, JSONC parsing, unused code, explicit `any`, missing button types, and accessibility issues are present. |
| `npx tsc --noEmit` | Failed | TS6305: `wxt.config.d.ts` was not built from `wxt.config.ts`, caused by the root project reference/include arrangement. |
| `npm test` | Failed | Vitest found no test files and exited with code 1. |
| `npm run build` | Passed | WXT 0.19.29 / Vite 5.4.8 built Chrome MV3 in 8.015 seconds. `caniuse-lite` was reported as outdated. |
| `npm ls --depth=0` | Passed | React 18.3.1, Lucide 0.344.0, TypeScript 5.6.3, Tailwind 3.4.17, Vitest 2.1.9, WXT 0.19.29. |

Production baseline:

| Artifact | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Montserrat variable font | 688,600 | 282,353 |
| Popup JavaScript | 187,043 | 56,894 |
| Logo PNG | 96,098 | 95,595 |
| Popup CSS | 22,226 | 4,383 |
| Other output | 9,023 | 8,492 |
| Total | 1,002,990 | 447,717 |

## Findings Ledger

### Critical

- [x] **C1: Advanced mode can clear the wrong field.** Replaced selector-only execution with tokenized scans, retained page references, and preflight validation.

### High

- [x] **H1: Session ownership is split.** Both workflows now use one page-owned tab session with explicit lifecycle states, including a distinct stopped terminal state.
- [x] **H2: Basic invalid targets can hang at 0%.** Start validates the target and returns a structured failure.
- [x] **H3: Scan cleanup is incomplete.** Cleanup is tokenized and idempotent across rescan, stop, completion, clear, and expiry paths.
- [x] **H4: Advanced lifecycle and failure reporting are incomplete.** Shared pause, resume, stop, progress, counts, and failure feedback are implemented.
- [x] **H5: Controlled-field compatibility is unreliable.** Native setters and input events are implemented; React/Vue/Svelte browser fixtures remain a release check.
- [x] **H6: Typing settings differ by mode.** Both workflows route through the shared injected engine.

### Medium

- [x] **M1: Native alerts and fragmented capability checks.** Inline actionable status replaces alerts, with tab capability checks and injected execution errors.
- [x] **M2: Preferences do not persist.** Versioned validated preferences use `chrome.storage.local`; sensitive workflow data is excluded.
- [x] **M3: Polling and teardown are inefficient.** Active polling is limited to 4 Hz and tears down on terminal state or unmount.
- [x] **M4: Accessibility is incomplete.** Semantic controls, labels, focus, progress, live status, and reduced motion are implemented; manual assistive-technology verification remains.
- [x] **M5: Popup styling is oversized and noisy.** The popup is a compact 460 by 600 single-scroll workspace with stable feedback and restrained motion.
- [x] **M6: Quality gates do not protect behavior.** Lint, WXT-aware typecheck, focused tests, and production build now pass.

### Low

- [x] **L1: Dead and duplicated source.** Removed unused settings, stale root Vite scaffold, and superseded utilities.
- [x] **L2: Background entrypoint has no current role.** Removed the no-op background entrypoint.
- [x] **L3: Permissions are currently minimal.** Permissions are exactly `activeTab`, `scripting`, and justified `storage`.

## Feature Decisions

| Feature | Decision | Recommendation |
| --- | --- | --- |
| Basic single-field typing | Improve | Keep as the primary workflow and route through the shared engine. |
| Advanced ordered form filling | Improve | Retain after locator, preflight, lifecycle, and cleanup fixes. |
| Typing speed | Keep | Validate documented minimum and maximum. |
| Normal style | Keep | Baseline behavior. |
| Random delay | Improve | Use bounded deterministic timing shared by both modes. |
| Word-by-word | Improve | Support consistently in both modes or remove it from unsupported surfaces. |
| Mistake simulation | Improve | Make consistent and deterministic under tests. |
| Typing sounds | Improve | Keep opt-in with one audio lifecycle and graceful fallback. |
| Initial/inter-field delays | Keep | Make both cancellable and visible in session state. |
| Hide extension | Improve | Close only after start acknowledgment and preserve remote control. |
| Pause/resume/stop/progress | Add | Required in both modes. |
| Settings persistence | Add | Preferences only; no user-entered text. |
| Light/dark/system theme | Add | Use semantic CSS tokens and system media query. |
| Reusable snippets/recent text | Remove from scope | Privacy and complexity are not justified by current evidence. |
| Keyboard shortcuts | Add narrowly | Popup keyboard operation first; global pause/stop only after lifecycle validation. |
| Field highlighting | Improve | Tokenized, reversible, and explicitly cleaned. |
| Target selection | Improve | Show stale/ambiguous state and support keyboard enable/reorder/rescan. |

## Performance Budgets

- Popup JavaScript at or below 60 kB gzip after lifecycle work; growth over 10 kB requires justification.
- Total production output below 500 kB raw, primarily through font/logo optimization.
- Popup interaction readiness below 100 ms on a typical supported desktop after cached load.
- Scan 500 ordinary controls in under 100 ms without repeated unnecessary layout reads.
- Progress updates no more than four times per second unless event-driven.
- No extension-created long task over 50 ms during ordinary typing.
- No visible control movement when progress or errors appear.
- No new UI or animation runtime dependency without measurement proving browser APIs and CSS insufficient.

## Implementation Plan

### Phase 1: Critical correctness and session lifecycle

Status: implemented; unpacked-Chrome lifecycle validation pending

Goal: one observable tab-scoped session with deterministic start, pause, resume, stop, completion, and failure.

Likely modules: `App.tsx`, `types.ts`, `useTypingSimulator.ts`, `AdvancedTyping.tsx`, a shared session module, and focused tests.

Acceptance: exactly one session per tab; every start ends in completed, stopped, or failed; popup remount can observe/control an active session.

Rollback: preserve the current UI while replacing ownership; keep changes isolated behind the shared contract until browser validation passes.

### Phase 2: Typing engine compatibility and cleanup

Status: implemented; browser compatibility fixtures pending

Goal: one injectable engine, stable targets, preflight, framework-compatible editing, and idempotent cleanup.

Likely modules: typing hook, advanced workflow, scanner, injected engine, existing utilities, and browser fixtures.

Acceptance: no field clears before preflight; common native and controlled fields update; no page resources remain after terminal states.

Rollback: explicitly leave complex rich-text editors unsupported rather than expanding permissions or adding editor-specific code.

### Phase 3: Error handling and user feedback

Status: complete

Goal: remove native alerts and expose actionable inline status and partial results.

Likely modules: app, workflows, progress display, and a small notice/status component.

Acceptance: no user-flow `alert()`; every failure has a clear reason and recovery action.

### Phase 4: State persistence and theming

Status: implemented; popup reload/theme visual check pending

Goal: restore validated preferences and light/dark/system theme without persisting sensitive text.

Likely modules: app, style, Tailwind config, WXT manifest, and a preferences module.

Acceptance: preferences and theme restore without flash; only `storage` is added to permissions.

### Phase 5: Popup UX, accessibility, and animation

Status: implemented; manual keyboard, contrast, and screen-reader checks pending

Goal: compact single-scroll layout with semantic controls, stable feedback, visible focus, and reduced motion.

Likely modules: all popup components and `style.css`.

Acceptance: keyboard-only operation, no nested scroll trap or layout shift, labels and announcements present, reduced motion honored.

### Phase 6: Feature pruning and selected additions

Status: complete

Goal: remove dead source and keep only tested, justified features.

Likely modules: unused component/types/utils, root `src`, optional background command path.

Acceptance: every shipped feature has a route, consistent behavior, and tests; no snippets/history/accounts/analytics/sync.

### Phase 7: Performance, bundle optimization, and release verification

Status: automated gates complete; packaged Chrome smoke test pending

Goal: optimize media, enforce quality commands, and validate a packaged Chrome MV3 release.

Likely modules: fonts/logo, package scripts, build config only when measured, release documentation.

Acceptance: gates pass, budgets are met or exceptions documented, permissions stay minimal, and a fresh-profile/upgrade smoke test passes.

## Final Acceptance Checklist

- [x] No native `alert()` usage in user workflows.
- [ ] Exactly one active typing session per tab across modes and popup reopen.
- [ ] Start, pause, resume, stop, completion, partial failure, and failure are deterministic.
- [ ] Highlights, attributes, timers, polling, globals, audio contexts, and injected resources are cleaned up.
- [ ] No field is cleared until session acquisition and target preflight succeed.
- [ ] Settings and light/dark/system theme restore correctly.
- [x] Typed text, passwords, selectors, and scan results are not persisted by default.
- [ ] Native input, textarea, contenteditable, and common framework-controlled inputs pass compatibility fixtures.
- [ ] Restricted pages, unavailable tabs, inaccessible frames, navigation, and permission failures show actionable feedback.
- [ ] No popup resizing, overlap, nested-scroll trap, hover layout shift, or animation jank.
- [ ] Controls are keyboard accessible with visible focus, semantic labels, and status announcements.
- [x] `prefers-reduced-motion` disables nonessential motion.
- [x] Manifest permissions remain `activeTab` and `scripting`, plus only `storage` if persistence ships.
- [x] Lint, typecheck, tests, and production build pass in the current working tree.
- [x] Popup JavaScript remains at or below 60 kB gzip unless growth is measured and justified.
- [x] Font/logo optimization materially reduces the 1,002,990-byte raw production baseline.
- [ ] Final Chrome MV3 package is tested on a fresh profile and an upgrade path from 2.3.0.

## Validation Log

Add dated commands and results here after every phase. Do not erase failures; append the remediation and succeeding rerun.

### 2026-07-22 implementation result

- `npm run lint`: passed, 26 files, no diagnostics.
- `npm run typecheck`: passed.
- `npm test`: passed, 2 files and 18 tests.
- `npm run build`: passed with WXT 0.19.29 in 3.144 seconds; the existing outdated `caniuse-lite` advisory remains.
- `npm audit --omit=dev`: passed with 0 production vulnerabilities.
- Production output: 225,344 B raw / 77,094 B gzip, down 77.5% raw and 82.8% gzip from baseline.
- Popup JavaScript: 190,146 B raw / 57,743 B gzip.
- Popup CSS: 19,823 B raw / 4,151 B gzip.
- Popup logo: 7,076 B raw / 7,099 B gzip.
- Manifest: `activeTab`, `scripting`, and `storage`; no host permissions and no background service worker.
- Remaining evidence: load `.output/chrome-mv3` in Chrome and execute the unchecked browser/manual acceptance items above.
