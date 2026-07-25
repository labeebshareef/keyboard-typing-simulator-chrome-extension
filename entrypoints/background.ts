/**
 * Background service worker — exists solely to handle keyboard commands.
 * Event-driven: Chrome wakes it on a command press and suspends it after.
 * No network access, no listeners beyond chrome.commands.onCommand.
 *
 * Permissions: pressing an extension command is one of the gestures that
 * grants `activeTab`, so executeScript on the command's tab works exactly
 * like it does from the popup — no host permissions needed.
 */
import { defineBackground } from 'wxt/sandbox';
import { controlPageTyping, startPageTyping } from './popup/utils/injected-engine';
import { loadLastScript } from './popup/utils/last-script';
import { loadPreferences } from './popup/utils/preferences';

export default defineBackground(() => {
  chrome.commands.onCommand.addListener((command, tab) => {
    if (!tab?.id) return; // fired on a window with no eligible tab
    void handleCommand(command, tab.id);
  });
});

async function handleCommand(command: string, tabId: number): Promise<void> {
  switch (command) {
    case 'type-into-focused-field': {
      const [script, preferences] = await Promise.all([loadLastScript(), loadPreferences()]);
      if (!script) {
        await toast(tabId, 'GhostType: no text saved yet — open the popup and enter text once.');
        return;
      }
      try {
        // Basic mode types into document.activeElement on the page — with the
        // shortcut the user's focus is genuinely on the field, so this is
        // exactly the "type into focused field" semantic.
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: startPageTyping,
          args: [{ mode: 'basic' as const, text: script, typingConfig: preferences.typing }],
        });
        const result = results[0]?.result;
        if (result && !result.ok) {
          await toast(tabId, `GhostType: ${result.status.message || 'could not type here.'}`);
        }
      } catch {
        // Chrome-internal pages, the Web Store, blocked frames, etc.
        await toast(tabId, 'GhostType: this page does not allow typing.');
      }
      return;
    }

    case 'toggle-pause-typing':
    case 'stop-typing': {
      const action = command === 'stop-typing' ? ('stop' as const) : ('toggle-pause' as const);
      await chrome.scripting
        .executeScript({ target: { tabId }, func: controlPageTyping, args: [action] })
        .catch(() => undefined);
      return;
    }
  }
}

/**
 * Minimal injected toast — deliberately avoids the `notifications`
 * permission (not worth a new install-time warning for this).
 */
function toast(tabId: number, message: string): Promise<unknown> {
  return chrome.scripting
    .executeScript({
      target: { tabId },
      func: (text: string) => {
        const id = '__kts_toast';
        document.getElementById(id)?.remove();
        const element = document.createElement('div');
        element.id = id;
        element.textContent = text;
        element.style.cssText =
          'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
          'background:#1e1e2e;color:#fff;padding:10px 16px;border-radius:8px;' +
          'font:13px/1.4 system-ui,sans-serif;z-index:2147483647;' +
          'box-shadow:0 4px 16px rgba(0,0,0,.25);pointer-events:none';
        document.documentElement.appendChild(element);
        setTimeout(() => element.remove(), 3200);
      },
      args: [message],
    })
    .catch(() => undefined);
}
