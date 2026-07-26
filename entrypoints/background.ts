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
import { generateSitePresets, getAiAvailability, streamGeneration } from './popup/utils/ai';
import { getSharedSession } from './popup/utils/ai-session';
import {
  ASSISTANT_PORT,
  type PanelToWorker,
  type WorkerToPanel,
} from './popup/utils/assistant-messages';
import { controlPageTyping, startPageTyping } from './popup/utils/injected-engine';
import { loadLastScript } from './popup/utils/last-script';
import { loadPreferences } from './popup/utils/preferences';
import { getGateStatus, refreshRemoteConfig } from './popup/utils/version-gate';
import { recordInstallEvent } from './popup/utils/whats-new';

export default defineBackground(() => {
  chrome.commands.onCommand.addListener((command, tab) => {
    if (!tab?.id) return; // fired on a window with no eligible tab
    void handleCommand(command, tab.id);
  });

  // Record install/update events for the one-time release notes, and pull a
  // fresh compatibility config right away on every version change.
  chrome.runtime.onInstalled.addListener((details) => {
    void recordInstallEvent(details.reason, details.previousVersion);
    void refreshRemoteConfig(true);
  });

  // Refresh the compatibility config once per browser start (throttled).
  chrome.runtime.onStartup.addListener(() => {
    void refreshRemoteConfig();
  });

  // Apply a downloaded update the moment Chrome reports it. Safe even during
  // a typing session: the engine runs injected in the page and finishes on
  // its own — only the popup/worker restart.
  chrome.runtime.onUpdateAvailable.addListener(() => {
    chrome.runtime.reload();
  });

  // The field assistant's in-page panel connects here to run generation in
  // the worker (the Prompt API isn't guaranteed in content scripts).
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === ASSISTANT_PORT) handleAssistantPort(port);
  });
});

function handleAssistantPort(port: chrome.runtime.Port): void {
  let abort: AbortController | null = null;
  const send = (message: WorkerToPanel) => {
    try {
      port.postMessage(message);
    } catch {
      // port closed mid-flight — ignore
    }
  };

  port.onMessage.addListener((raw: PanelToWorker) => {
    void (async () => {
      switch (raw.type) {
        case 'availability': {
          send({ type: 'availability', state: await getAiAvailability() });
          return;
        }
        case 'presets': {
          const session = await getSharedSession();
          if (!session) {
            send({ type: 'presets', id: raw.id, presets: null });
            return;
          }
          try {
            const presets = await generateSitePresets(session, {
              host: raw.host,
              title: raw.title,
            });
            send({ type: 'presets', id: raw.id, presets });
          } catch {
            send({ type: 'presets', id: raw.id, presets: null });
          }
          return;
        }
        case 'generate': {
          abort?.abort();
          abort = new AbortController();
          const controller = abort;
          const session = await getSharedSession();
          if (!session) {
            send({ type: 'error', id: raw.id });
            return;
          }
          try {
            const text = await streamGeneration(
              session,
              raw.instruction,
              (full) => send({ type: 'chunk', id: raw.id, text: full }),
              controller.signal
            );
            send({ type: 'done', id: raw.id, text });
          } catch {
            send(
              controller.signal.aborted
                ? { type: 'aborted', id: raw.id }
                : { type: 'error', id: raw.id }
            );
          }
          return;
        }
        case 'abort': {
          abort?.abort();
          return;
        }
      }
    })();
  });

  port.onDisconnect.addListener(() => abort?.abort());
}

/**
 * Injected into the page to read the clipboard. Tries the async Clipboard
 * API first; falls back to execCommand('paste') into a hidden textarea,
 * which works when the extension holds the (optional, user-granted)
 * clipboardRead permission. Restores focus to the original element so the
 * typing session that follows targets the right field.
 */
function readPageClipboard(): Promise<string> {
  const readViaExecCommand = (): string => {
    const original = document.activeElement as HTMLElement | null;
    const textarea = document.createElement('textarea');
    textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
    document.body.appendChild(textarea);
    textarea.focus();
    const pasted = document.execCommand('paste');
    const value = pasted ? textarea.value : '';
    textarea.remove();
    original?.focus?.();
    return value;
  };

  return navigator.clipboard
    .readText()
    .catch(() => readViaExecCommand())
    .then((value) => value ?? '');
}

async function handleCommand(command: string, tabId: number): Promise<void> {
  // Compatibility gate: outdated versions refuse to run. Decision comes from
  // the cached config (instant); the network refresh happens off this path.
  const gate = await getGateStatus();
  if (gate.blocked) {
    void refreshRemoteConfig();
    await toast(tabId, 'GhostType: an update is required — click the GhostType icon to update.');
    // Ask Chrome to fetch the update in the background as well.
    try {
      chrome.runtime.requestUpdateCheck(() => undefined);
    } catch {
      // throttled or unavailable — the popup path still covers it
    }
    return;
  }
  void refreshRemoteConfig();

  switch (command) {
    case 'type-clipboard-into-field': {
      const hasPermission = await chrome.permissions
        .contains({ permissions: ['clipboardRead'] })
        .catch(() => false);
      if (!hasPermission) {
        await toast(
          tabId,
          'GhostType: enable clipboard typing first — extension icon → gear menu.'
        );
        return;
      }
      try {
        const read = await chrome.scripting.executeScript({
          target: { tabId },
          func: readPageClipboard,
        });
        const clipboard = (read[0]?.result ?? '').slice(0, 50_000);
        if (!clipboard.trim()) {
          await toast(tabId, 'GhostType: your clipboard is empty.');
          return;
        }
        const preferences = await loadPreferences();
        // Typed transiently — clipboard content is never stored anywhere.
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: startPageTyping,
          args: [{ mode: 'basic' as const, text: clipboard, typingConfig: preferences.typing }],
        });
        const result = results[0]?.result;
        if (result && !result.ok) {
          await toast(tabId, `GhostType: ${result.status.message || 'could not type here.'}`);
        }
      } catch {
        await toast(tabId, 'GhostType: this page does not allow typing.');
      }
      return;
    }

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

    case 'toggle-field-assistant': {
      const preferences = await loadPreferences();
      if (!preferences.assistant.enabled) {
        await toast(
          tabId,
          'GhostType: field assistant is off — turn it on in the GhostType popup.'
        );
        return;
      }
      // Executing the assistant file IS the toggle: it mounts on the first
      // run and unmounts on the next (window.__ktsAssistant guard).
      await chrome.scripting
        .executeScript({ target: { tabId }, files: ['assistant.js'] })
        .catch(() => toast(tabId, 'GhostType: the assistant cannot run on this page.'));
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
