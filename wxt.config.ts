import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    // Store title, short name and summary live in public/_locales/<lang>/messages.json
    // (en = default, es, pt_BR). Chrome shows the localized title/summary in the
    // Web Store search result for that language, so each locale is its own
    // keyword surface. Limits per locale: title 75 chars, summary 132 chars —
    // both verified by docs/listing-locales.md. Rationale in webstore-deployment.md §1–2, §12.
    default_locale: 'en',
    name: '__MSG_extName__',
    short_name: '__MSG_extShortName__',
    description: '__MSG_extDescription__',
    // 3.3.1 = listing-only release (name order, summary, es/pt-BR locales,
    // tagged store links). No engine changes.
    version: '3.3.1',
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
