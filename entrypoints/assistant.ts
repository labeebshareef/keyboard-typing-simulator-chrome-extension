/**
 * Field Assistant — in-page script (steps 1–2: plumbing + focus-tracked icon).
 *
 * Built as a WXT *unlisted script* (NOT a manifest content script): it only
 * ever reaches a page when the user summons it — Alt+Shift+A or the popup
 * button — via chrome.scripting.executeScript({ files: ['assistant.js'] })
 * under the activeTab grant. Nothing persists across navigation, and no
 * host permissions exist.
 *
 * Executing the file is itself the toggle: first run mounts, running it
 * again unmounts (idempotent via the window.__ktsAssistant guard).
 *
 * Perf contract (the anti-Grammarly rules): everything is driven by
 * focusin/focusout — no MutationObserver, no page-wide scanning. A single
 * 22px icon exists for the focused field only, in a closed shadow root, and
 * a lightweight status poll runs ONLY while the icon is visible.
 *
 * Step 3 adds the prompt panel + service-worker streaming bridge; step 4
 * wires "Insert & Type". The icon's click handler is the single seam they
 * plug into.
 */
import { defineUnlistedScript } from 'wxt/sandbox';
import { createFieldPanel } from './popup/utils/field-panel';
import { controlPageTyping, startPageTyping } from './popup/utils/injected-engine';
import { loadPreferences } from './popup/utils/preferences';

interface AssistantHandle {
  mounted: boolean;
  unmount: () => void;
}

type AssistantWindow = Window & {
  __ktsAssistant?: AssistantHandle;
  __ktsSession?: { status: { phase: string } };
};

const HOST_ID = '__kts_assistant_host';
const ICON_SIZE = 22;
const EDGE_GAP = 4;
const MIN_FIELD_WIDTH = 120;
const MIN_FIELD_HEIGHT = 24;
const HIDE_GRACE_MS = 300;
const STATUS_POLL_MS = 350;
const ACTIVE_PHASES = ['validating', 'delaying', 'running', 'paused', 'stopping'];

const CARET_GLYPH = `
  <svg viewBox="0 0 22 22" width="14" height="14" aria-hidden="true">
    <rect x="13" y="4" width="3" height="14" rx="1.5" fill="#ffffff"/>
    <rect x="8" y="6" width="2.4" height="10" rx="1.2" fill="#ffffff" opacity="0.55"/>
    <rect x="3.6" y="8" width="2.4" height="6" rx="1.2" fill="#ffffff" opacity="0.3"/>
  </svg>`;

const STOP_GLYPH = `
  <svg viewBox="0 0 22 22" width="12" height="12" aria-hidden="true">
    <rect x="5" y="5" width="12" height="12" rx="2" fill="#ffffff"/>
  </svg>`;

function mount(): AssistantHandle {
  const assistantWindow = window as AssistantWindow;
  const cleanups: Array<() => void> = [];
  const listen = <K extends keyof DocumentEventMap>(
    target: Document | Window,
    type: K | string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions
  ) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  // Single host element + closed shadow root: site CSS cannot reach our UI
  // and our styles cannot leak out.
  document.getElementById(HOST_ID)?.remove();
  const host = document.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .kts-icon {
      position: fixed;
      width: ${ICON_SIZE}px;
      height: ${ICON_SIZE}px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 6px;
      background: #5b5bd6;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      padding: 0;
      z-index: 2147483646;
      opacity: 0;
      transform: scale(0.85);
      pointer-events: none;
      transition: opacity 0.12s ease, transform 0.12s ease;
    }
    .kts-icon.kts-visible {
      opacity: 0.6;
      transform: scale(1);
      pointer-events: auto;
    }
    .kts-icon.kts-visible:hover,
    .kts-icon.kts-visible:focus-visible { opacity: 1; }
    .kts-icon.kts-stop { background: #dc2626; opacity: 0.95; }
    .kts-icon.kts-pulse { animation: kts-pulse 0.35s ease; }
    @keyframes kts-pulse {
      50% { transform: scale(1.18); }
    }
    .kts-status {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 10px;
      background: #1e1e2e;
      color: #fff;
      font: 12px/1.4 system-ui, sans-serif;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      pointer-events: none;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .kts-status.kts-visible { opacity: 1; transform: translateY(0); }
    .kts-caret {
      width: 3px;
      height: 14px;
      border-radius: 2px;
      background: #5b5bd6;
      animation: kts-blink 1.06s steps(1) infinite;
    }
    @keyframes kts-blink { 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) {
      .kts-icon, .kts-status { transition: none; }
      .kts-icon.kts-pulse { animation: none; }
    }
  `;
  shadow.appendChild(style);
  document.documentElement.appendChild(host);
  cleanups.push(() => host.remove());

  // Transient confirmation so the Alt+Shift+A toggle is visibly instant.
  const showStatus = (message: string) => {
    const status = document.createElement('div');
    status.className = 'kts-status';
    const caret = document.createElement('span');
    caret.className = 'kts-caret';
    const label = document.createElement('span');
    label.textContent = message;
    status.append(caret, label);
    shadow.appendChild(status);
    requestAnimationFrame(() => status.classList.add('kts-visible'));
    window.setTimeout(() => {
      status.classList.remove('kts-visible');
      window.setTimeout(() => status.remove(), 200);
    }, 2200);
  };

  // -------------------------------------------------------------------------
  // The icon (one instance, reused for whichever field is focused)
  // -------------------------------------------------------------------------

  const icon = document.createElement('button');
  icon.type = 'button';
  icon.className = 'kts-icon';
  icon.innerHTML = CARET_GLYPH;
  icon.title = 'Generate with GhostType (AI runs on your device) · Alt+Shift+A to hide';
  shadow.appendChild(icon);

  let currentField: HTMLElement | null = null;
  let hideTimer: number | null = null;
  let repositionQueued = false;
  let statusTimer: number | null = null;
  let showingStop = false;
  let panelHolding = false;

  // Types generated text into a field via the same engine the popup uses.
  // Runs in this isolated world, so startPageTyping is a direct call.
  const typeIntoField = (field: HTMLElement, text: string) => {
    field.focus();
    void loadPreferences()
      .then((preferences) => {
        startPageTyping({ mode: 'basic', text, typingConfig: preferences.typing });
      })
      .catch(() => undefined);
  };

  const panel = createFieldPanel({
    shadow,
    typeIntoField,
    onOpenChange: (isOpen) => {
      // While the panel is open, focus lives in the panel (not the field), so
      // suspend the blur-driven hide and keep the icon anchored.
      panelHolding = isOpen;
      if (isOpen) cancelHide();
    },
  });
  cleanups.push(() => panel.destroy());

  /** Same family the engine's preflight accepts, minus too-small fields. */
  const isEligibleField = (element: Element | null): element is HTMLElement => {
    if (!(element instanceof HTMLElement)) return false;
    let editable = false;
    if (element instanceof HTMLTextAreaElement) {
      editable = !element.disabled && !element.readOnly;
    } else if (element instanceof HTMLInputElement) {
      editable =
        ['text', 'email', 'search', 'url', 'tel', ''].includes(element.type) &&
        !element.disabled &&
        !element.readOnly;
    } else {
      editable = element.isContentEditable;
    }
    if (!editable) return false;
    const rect = element.getBoundingClientRect();
    return rect.width >= MIN_FIELD_WIDTH && rect.height >= MIN_FIELD_HEIGHT;
  };

  /**
   * Outside top-right corner by default; inside bottom-right for tall
   * fields (textareas/contenteditable > 80px). Clamped into the viewport.
   */
  const positionIcon = () => {
    if (!currentField) return;
    if (!currentField.isConnected) {
      hideIcon();
      return;
    }
    const rect = currentField.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hideIcon();
      return;
    }
    let left: number;
    let top: number;
    if (rect.height > 80) {
      left = rect.right - ICON_SIZE - 6;
      top = rect.bottom - ICON_SIZE - 6;
    } else {
      left = rect.right - ICON_SIZE;
      top = rect.top - ICON_SIZE - EDGE_GAP;
      if (top < EDGE_GAP) {
        // No room above (field at viewport top): tuck inside right-center.
        top = rect.top + (rect.height - ICON_SIZE) / 2;
        left = rect.right - ICON_SIZE - 6;
      }
    }
    left = Math.min(Math.max(EDGE_GAP, left), window.innerWidth - ICON_SIZE - EDGE_GAP);
    top = Math.min(Math.max(EDGE_GAP, top), window.innerHeight - ICON_SIZE - EDGE_GAP);
    icon.style.left = `${Math.round(left)}px`;
    icon.style.top = `${Math.round(top)}px`;
  };

  const queueReposition = () => {
    if (repositionQueued || !currentField) return;
    repositionQueued = true;
    requestAnimationFrame(() => {
      repositionQueued = false;
      positionIcon();
    });
  };

  const setStopState = (stop: boolean) => {
    if (showingStop === stop) return;
    showingStop = stop;
    icon.classList.toggle('kts-stop', stop);
    icon.innerHTML = stop ? STOP_GLYPH : CARET_GLYPH;
    icon.title = stop
      ? 'Stop GhostType typing'
      : 'Generate with GhostType (AI runs on your device) · Alt+Shift+A to hide';
  };

  /** Poll runs ONLY while the icon is visible; drives the stop-morph. */
  const startStatusPoll = () => {
    if (statusTimer !== null) return;
    statusTimer = window.setInterval(() => {
      const phase = assistantWindow.__ktsSession?.status.phase ?? 'idle';
      setStopState(ACTIVE_PHASES.includes(phase));
      // Layout can shift without scroll/resize events (SPA rerenders).
      positionIcon();
    }, STATUS_POLL_MS);
  };

  const stopStatusPoll = () => {
    if (statusTimer !== null) {
      clearInterval(statusTimer);
      statusTimer = null;
    }
  };
  cleanups.push(stopStatusPoll);

  const cancelHide = () => {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const showIcon = (field: HTMLElement) => {
    cancelHide();
    currentField = field;
    positionIcon();
    icon.classList.add('kts-visible');
    startStatusPoll();
  };

  const hideIcon = () => {
    if (panelHolding) return; // never hide while the panel owns the field
    cancelHide();
    currentField = null;
    icon.classList.remove('kts-visible');
    setStopState(false);
    stopStatusPoll();
  };
  cleanups.push(() => {
    panelHolding = false;
    hideIcon();
  });

  /** Grace period: moving pointer/focus between field and icon never flickers. */
  const scheduleHide = () => {
    if (panelHolding) return;
    cancelHide();
    hideTimer = window.setTimeout(() => {
      hideTimer = null;
      hideIcon();
    }, HIDE_GRACE_MS);
  };

  listen(
    document,
    'focusin',
    (event) => {
      const target = event.target as Element | null;
      if (target === host) {
        // Focus moved into our own UI (the icon button): keep everything.
        cancelHide();
        return;
      }
      if (isEligibleField(target)) {
        showIcon(target);
      } else if (currentField) {
        scheduleHide();
      }
    },
    { passive: true }
  );

  listen(
    document,
    'focusout',
    () => {
      if (currentField) scheduleHide();
    },
    { passive: true }
  );

  // Scroll doesn't bubble, but it does capture — one listener catches inner
  // scroll containers too.
  listen(document, 'scroll', queueReposition, { capture: true, passive: true });
  listen(window, 'resize', queueReposition, { passive: true });

  // Classic trick: preventDefault on mousedown keeps focus in the field, so
  // clicking the icon never blurs the target the user is working in.
  icon.addEventListener('mousedown', (event) => event.preventDefault());

  icon.addEventListener('click', () => {
    if (showingStop) {
      controlPageTyping('stop');
      setStopState(false);
      return;
    }
    if (!currentField) return;
    if (panel.isOpen()) {
      panel.close();
      return;
    }
    icon.classList.remove('kts-pulse');
    void icon.offsetWidth; // reflow so the pulse replays on consecutive clicks
    icon.classList.add('kts-pulse');
    panel.open(currentField, icon.getBoundingClientRect());
  });

  // The panel's "Hide on this page" footer asks the whole assistant to unmount.
  listen(window, '__ktsAssistantHide', () => {
    (window as AssistantWindow).__ktsAssistant?.unmount();
  });

  // If a field is already focused when the assistant is summoned (e.g. the
  // Alt+Shift+A path, where focus stays in the field), show the icon at once.
  // When summoned from the popup, focus isn't on a page field, so the status
  // toast tells the user what to do next.
  const alreadyOnField = isEligibleField(document.activeElement);
  if (alreadyOnField) {
    showIcon(document.activeElement as HTMLElement);
  }

  showStatus(
    alreadyOnField
      ? 'GhostType is on — tap the ✨ icon to generate. Alt+Shift+A hides it.'
      : 'GhostType is on — click any text field to generate. Alt+Shift+A hides it.'
  );

  return {
    mounted: true,
    unmount() {
      for (const cleanup of cleanups.splice(0)) {
        try {
          cleanup();
        } catch {
          // never let one cleanup break the rest
        }
      }
      (window as AssistantWindow).__ktsAssistant = undefined;
    },
  };
}

export default defineUnlistedScript(() => {
  const assistantWindow = window as AssistantWindow;
  const existing = assistantWindow.__ktsAssistant;
  if (existing?.mounted) {
    existing.unmount();
    return;
  }
  assistantWindow.__ktsAssistant = mount();
});
