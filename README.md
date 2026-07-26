# TypeReel Chrome Extension

TypeReel — Realistic Typing Simulator & Auto Typer for Demo Videos. Human-like typing for demo videos, screen recordings, tutorials, and form testing. A Manifest V3 extension built with WXT, React 18, TypeScript, Tailwind CSS, Lucide React, Vitest, and Biome.

## Development

```sh
npm install
npm run dev
```

For a production build:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Load `.output/chrome-mv3` as an unpacked extension in Chrome for manual testing.

## Supported Editing Targets

- Text, email, search, URL, and telephone inputs
- Textareas
- Plain contenteditable elements
- Common framework-controlled inputs that respond to native value setters and input events

Password inputs, browser-internal pages, Chrome Web Store pages, inaccessible frames, and complex rich-text editors are intentionally excluded or reported as unsupported.

## Privacy And Permissions

The extension requests these permissions:

- `activeTab`: access only the tab where the user invokes the extension (popup or keyboard shortcut)
- `scripting`: scan fields and run a user-started typing session
- `storage`: retain preferences such as speed, style, delays, sound, and theme
- `clipboardRead` (optional, off by default): enables the clipboard-typing shortcut; requested only when the user turns it on in the gear menu, revocable there at any time. Clipboard content is typed transiently and never stored

Typed text, detected fields, selectors, and passwords are not persisted to disk by default. For the keyboard shortcut, the most recent script is mirrored to `chrome.storage.session` (memory-only, cleared when the browser closes); an explicit opt-in setting ("Remember text after restart") additionally stores it in `chrome.storage.local`, and it can be cleared at any time from the settings menu.

The extension has no host permissions, accounts, analytics, or cloud synchronization. The only background component is an event-driven service worker that exists solely to handle keyboard shortcuts — it has no network access and registers no listeners beyond `chrome.commands.onCommand`.

## Keyboard Shortcuts

| Command | Default | Notes |
| --- | --- | --- |
| Type your saved text into the focused field | `Alt+Shift+T` | Uses the last script started from the popup |
| Type your clipboard into the focused field | `Alt+Shift+C` | Requires the opt-in clipboard permission (gear menu) |
| Show or hide AI icons on input fields | `Alt+Shift+A` | Field assistant; also available from the popup switch row |
| Pause or resume the current typing session | `Alt+Shift+P` | |
| Stop the current typing session | unbound | Assign at `chrome://extensions/shortcuts` |

Defaults may install unbound if another extension already claimed them; the settings menu surfaces the current binding and links to `chrome://extensions/shortcuts` for rebinding.

## Architecture

Both basic and advanced workflows use one tab-scoped injected typing engine. The page owns the active session so reopening the popup can recover progress and controls. Scans use opaque tokens and retained element references, selected fields are preflighted before mutation, and page modifications are cleaned on completion, stop, rescan, explicit clear, or timeout. The background service worker reuses the same injected engine functions for shortcut-initiated sessions.

The audit, implementation phases, performance budgets, and release checklist are tracked in [docs/modernization-plan.md](docs/modernization-plan.md). The rebrand and feature roadmap is tracked in [docs/ghosttype-implementation-plan.md](docs/ghosttype-implementation-plan.md).
