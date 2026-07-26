import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    // Store title (66/75 chars) — keyword rationale in webstore-deployment.md §1.
    name: 'TypeReel — Realistic Typing Simulator & Auto Typer for Demo Videos',
    // CWS summary (129/132 chars) — Variant A (demo hook), webstore-deployment.md §2.
    description:
      'Realistic human typing for demo videos, tutorials and screen recordings. On-device AI writes and fills forms. Export GIF or WebM.',
    version: '3.3.0',
    // Unchanged permission set: pressing a command shortcut grants activeTab
    // for that tab, so the background worker can inject the engine without
    // any new permissions (and without a new install-time warning).
    permissions: ['scripting', 'activeTab', 'storage'],
    // clipboardRead is OPTIONAL and off by default: the clipboard-typing
    // shortcut only works after the user explicitly enables it in the gear
    // menu (chrome.permissions.request needs that click). This keeps the
    // install-time permission set — and the privacy story — unchanged.
    optional_permissions: ['clipboardRead'],
    commands: {
      // Alt+Shift avoids reserved combos (Ctrl+Shift+T reopens a closed tab)
      // and common DevTools palettes. If another extension already claimed a
      // suggested key, the command installs unbound — the popup detects that
      // via chrome.commands.getAll() and points users to
      // chrome://extensions/shortcuts.
      'type-into-focused-field': {
        suggested_key: { default: 'Alt+Shift+T', mac: 'Alt+Shift+T' },
        description: 'Type your saved text into the focused field',
      },
      'type-clipboard-into-field': {
        suggested_key: { default: 'Alt+Shift+C', mac: 'Alt+Shift+C' },
        description: 'Type your clipboard into the focused field',
      },
      'toggle-pause-typing': {
        suggested_key: { default: 'Alt+Shift+P', mac: 'Alt+Shift+P' },
        description: 'Pause or resume the current typing session',
      },
      // Uses the fourth and last suggested-key slot Chrome allows.
      'toggle-field-assistant': {
        suggested_key: { default: 'Alt+Shift+A', mac: 'Alt+Shift+A' },
        description: 'Show or hide AI icons on input fields',
      },
      // Deliberately no suggested key: rare action, users can bind it.
      'stop-typing': {
        description: 'Stop the current typing session',
      },
    },
    icons: {
      16: '/icons/icon16.png',
      32: '/icons/icon32.png',
      48: '/icons/icon48.png',
      128: '/icons/icon128.png',
    },
  },
});
