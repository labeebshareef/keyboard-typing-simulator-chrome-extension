import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'GhostType — Auto Typer & Typing Simulator',
    description:
      'Types your text like a human — real speed, natural pauses, optional typos. For demos, screen recordings, tutorials & form testing.',
    version: '3.0.0',
    // Unchanged permission set: pressing a command shortcut grants activeTab
    // for that tab, so the background worker can inject the engine without
    // any new permissions (and without a new install-time warning).
    permissions: ['scripting', 'activeTab', 'storage'],
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
      'toggle-pause-typing': {
        suggested_key: { default: 'Alt+Shift+P', mac: 'Alt+Shift+P' },
        description: 'Pause or resume the current typing session',
      },
      // Deliberately no suggested key: rare action, users can bind it.
      'stop-typing': {
        description: 'Stop the current typing session',
      },
    },
    icons: {
      16: '/icons/icon16.png',
      48: '/icons/icon48.png',
      128: '/icons/icon128.png',
    },
  },
});
